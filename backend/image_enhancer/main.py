import logging
import os
import tempfile
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_DIMENSION = 2048
FORMATS = {
    ".jpg": ("image/jpeg", ".jpg"),
    ".jpeg": ("image/jpeg", ".jpg"),
    ".png": ("image/png", ".png"),
    ".webp": ("image/webp", ".webp"),
}
ALLOWED_MIME_TYPES = {mime for mime, _ in FORMATS.values()}
BACKGROUND_PRESETS = {
    "clean_white": (244, 247, 250),
    "warm_sand": (205, 225, 242),
    "soft_sage": (198, 218, 204),
}

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "IMAGE_ENHANCER_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="KalaSetu OpenCV Image Enhancer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ImageTooLargeError(ValueError):
    pass


def _trim_uniform_light_border(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    if height < 80 or width < 80:
        return image

    corners = np.array(
        [
            np.median(image[:5, :5, :3], axis=(0, 1)),
            np.median(image[:5, -5:, :3], axis=(0, 1)),
            np.median(image[-5:, :5, :3], axis=(0, 1)),
            np.median(image[-5:, -5:, :3], axis=(0, 1)),
        ]
    )
    background = np.median(corners, axis=0)
    if np.min(background) < 230 or np.max(np.ptp(corners, axis=0)) > 12:
        return image

    color_distance = np.max(
        np.abs(image[:, :, :3].astype(np.int16) - background.astype(np.int16)),
        axis=2,
    )
    foreground = color_distance > 20
    active_rows = np.flatnonzero(np.count_nonzero(foreground, axis=1) > max(2, width // 500))
    active_columns = np.flatnonzero(np.count_nonzero(foreground, axis=0) > max(2, height // 500))
    if active_rows.size == 0 or active_columns.size == 0:
        return image

    padding = max(4, int(max(height, width) * 0.025))
    top = max(0, int(active_rows[0]) - padding)
    bottom = min(height, int(active_rows[-1]) + padding + 1)
    left = max(0, int(active_columns[0]) - padding)
    right = min(width, int(active_columns[-1]) + padding + 1)

    crop_height = bottom - top
    crop_width = right - left
    has_clear_margins = (
        top >= height * 0.05
        and left >= width * 0.05
        and height - bottom >= height * 0.05
        and width - right >= width * 0.05
    )
    keeps_most_frame = crop_height >= height * 0.70 and crop_width >= width * 0.70
    if has_clear_margins and keeps_most_frame:
        return image[top:bottom, left:right]
    return image


def _enhance_bgr(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    lightness, channel_a, channel_b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
    improved_lightness = clahe.apply(lightness)
    lightness = cv2.addWeighted(lightness, 0.35, improved_lightness, 0.65, 0)

    channel_a = np.clip(
        channel_a.astype(np.float32)
        + np.clip(128.0 - float(np.mean(channel_a)), -2.0, 2.0) * 0.35,
        0,
        255,
    ).astype(np.uint8)
    channel_b = np.clip(
        channel_b.astype(np.float32)
        + np.clip(128.0 - float(np.mean(channel_b)), -2.0, 2.0) * 0.35,
        0,
        255,
    ).astype(np.uint8)

    balanced = cv2.cvtColor(
        cv2.merge((lightness, channel_a, channel_b)), cv2.COLOR_LAB2BGR
    )
    denoised = cv2.bilateralFilter(balanced, d=5, sigmaColor=20, sigmaSpace=20)
    soft_blur = cv2.GaussianBlur(denoised, (0, 0), sigmaX=1.1)
    return cv2.addWeighted(denoised, 1.18, soft_blur, -0.18, 0)


def _resize_within_limit(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    largest_dimension = max(height, width)
    if largest_dimension <= MAX_IMAGE_DIMENSION:
        return image

    scale = MAX_IMAGE_DIMENSION / largest_dimension
    new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def _studio_background(width: int, height: int, preset: str) -> np.ndarray:
    if preset not in BACKGROUND_PRESETS:
        raise ValueError("Choose a valid studio background.")

    base_color = np.array(BACKGROUND_PRESETS[preset], dtype=np.float32)
    y, x = np.ogrid[:height, :width]
    distance = np.sqrt(
        ((x - width * 0.5) / max(width, 1)) ** 2
        + ((y - height * 0.42) / max(height, 1)) ** 2
    )
    light = np.clip(1.0 - distance * 1.5, 0.0, 1.0) * 10.0
    background = np.clip(base_color + light[:, :, np.newaxis], 0, 255)
    return np.broadcast_to(background, (height, width, 3)).astype(np.uint8).copy()


def _uploaded_background(image_bytes: bytes, suffix: str, width: int, height: int) -> np.ndarray:
    if suffix not in FORMATS:
        raise ValueError("Use a JPEG, PNG, or WebP background image.")
    image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_UNCHANGED)
    if image is None or image.size == 0:
        raise ValueError("The uploaded background is not a readable image.")
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    elif image.ndim == 3 and image.shape[2] == 4:
        alpha = image[:, :, 3].astype(np.float32)[:, :, np.newaxis] / 255.0
        image = np.clip(
            image[:, :, :3].astype(np.float32) * alpha + 255 * (1.0 - alpha),
            0,
            255,
        ).astype(np.uint8)
    elif image.ndim != 3 or image.shape[2] != 3:
        raise ValueError("The uploaded background has an unsupported color format.")

    bg_height, bg_width = image.shape[:2]
    if bg_height * bg_width > MAX_IMAGE_PIXELS:
        raise ImageTooLargeError("The background dimensions are too large to process.")

    scale = max(width / bg_width, height / bg_height)
    resized = cv2.resize(
        image,
        (max(width, round(bg_width * scale)), max(height, round(bg_height * scale))),
        interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR,
    )
    top = (resized.shape[0] - height) // 2
    left = (resized.shape[1] - width) // 2
    return resized[top:top + height, left:left + width]


def _foreground_alpha(image: np.ndarray, existing_alpha: np.ndarray | None) -> np.ndarray:
    if existing_alpha is not None:
        return existing_alpha

    height, width = image.shape[:2]
    scale = min(1.0, 1200 / max(height, width))
    if scale < 1:
        image = cv2.resize(
            image,
            (max(1, round(width * scale)), max(1, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )

    small_height, small_width = image.shape[:2]
    if small_width < 3 or small_height < 3:
        raise ValueError("The image is too small for background replacement.")

    margin_x = max(1, round(small_width * 0.02))
    margin_y = max(1, round(small_height * 0.02))
    grabcut_mask = np.full((small_height, small_width), cv2.GC_BGD, dtype=np.uint8)
    rectangle = (
        margin_x,
        margin_y,
        max(1, small_width - 2 * margin_x),
        max(1, small_height - 2 * margin_y),
    )
    cv2.grabCut(
        image,
        grabcut_mask,
        rectangle,
        np.zeros((1, 65), dtype=np.float64),
        np.zeros((1, 65), dtype=np.float64),
        5,
        cv2.GC_INIT_WITH_RECT,
    )
    foreground = np.where(
        (grabcut_mask == cv2.GC_FGD) | (grabcut_mask == cv2.GC_PR_FGD),
        255,
        0,
    ).astype(np.uint8)
    if np.count_nonzero(foreground) < foreground.size * 0.01:
        raise ValueError("Could not separate the product from its background.")

    if scale < 1:
        foreground = cv2.resize(foreground, (width, height), interpolation=cv2.INTER_LINEAR)
    return cv2.GaussianBlur(foreground, (0, 0), sigmaX=1.2)


def process_image_bytes(
    image_bytes: bytes,
    suffix: str,
    background_preset: str = "none",
    background_bytes: bytes | None = None,
    background_suffix: str = ".png",
) -> bytes:
    if background_preset != "none" and background_preset not in BACKGROUND_PRESETS:
        raise ValueError("Choose a valid studio background.")
    if background_preset != "none" and background_bytes:
        raise ValueError("Choose either a studio preset or a custom background.")

    with tempfile.TemporaryDirectory(prefix="kalasetu-image-") as temp_dir:
        input_path = Path(temp_dir) / f"original{suffix}"
        output_path = Path(temp_dir) / f"enhanced{suffix}"
        input_path.write_bytes(image_bytes)

        encoded_input = np.fromfile(input_path, dtype=np.uint8)
        image = cv2.imdecode(encoded_input, cv2.IMREAD_UNCHANGED)
        if image is None or image.size == 0:
            raise ValueError("The uploaded file is not a readable image.")
        if image.ndim not in (2, 3) or (image.ndim == 3 and image.shape[2] not in (3, 4)):
            raise ValueError("The uploaded image has an unsupported color format.")

        height, width = image.shape[:2]
        if height * width > MAX_IMAGE_PIXELS:
            raise ImageTooLargeError("The image dimensions are too large to process.")

        if image.ndim == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        image = _trim_uniform_light_border(image)
        alpha = image[:, :, 3] if image.ndim == 3 and image.shape[2] == 4 else None
        if image.shape[2] == 4:
            image = image[:, :, :3]

        image = _resize_within_limit(image)
        if alpha is not None:
            alpha = _resize_within_limit(alpha)
        enhanced = _enhance_bgr(image)

        if background_preset != "none" or background_bytes:
            foreground = _foreground_alpha(enhanced, alpha)
            if background_bytes:
                background = _uploaded_background(
                    background_bytes, background_suffix, enhanced.shape[1], enhanced.shape[0]
                )
            else:
                background = _studio_background(
                    enhanced.shape[1], enhanced.shape[0], background_preset
                )
            opacity = foreground.astype(np.float32)[:, :, np.newaxis] / 255.0
            enhanced = np.clip(
                enhanced.astype(np.float32) * opacity
                + background.astype(np.float32) * (1.0 - opacity),
                0,
                255,
            ).astype(np.uint8)
            alpha = None

        if alpha is not None:
            enhanced = cv2.cvtColor(enhanced, cv2.COLOR_BGR2BGRA)
            enhanced[:, :, 3] = alpha

        if suffix in (".jpg", ".jpeg"):
            encode_suffix = ".jpg"
            parameters = [cv2.IMWRITE_JPEG_QUALITY, 92]
        elif suffix == ".webp":
            encode_suffix = ".webp"
            parameters = [cv2.IMWRITE_WEBP_QUALITY, 92]
        else:
            encode_suffix = ".png"
            parameters = [cv2.IMWRITE_PNG_COMPRESSION, 3]

        success, encoded_output = cv2.imencode(encode_suffix, enhanced, parameters)
        if not success:
            raise RuntimeError("OpenCV could not encode the enhanced image.")

        encoded_output.tofile(output_path)
        return output_path.read_bytes()


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "KalaSetu OpenCV Image Enhancer"}


@app.post("/api/enhance")
async def enhance_image(
    file: UploadFile = File(...),
    background_preset: str = Form("none"),
    background_file: UploadFile | None = File(None),
) -> Response:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in FORMATS:
        raise HTTPException(
            status_code=415,
            detail="Use a JPEG, PNG, or WebP image.",
        )
    if file.content_type and file.content_type not in (
        ALLOWED_MIME_TYPES | {"application/octet-stream"}
    ):
        raise HTTPException(status_code=415, detail="The uploaded file is not an image.")

    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image files must be 10 MB or smaller.")

    background_bytes = None
    background_suffix = ".png"
    if background_file is not None:
        background_suffix = Path(background_file.filename or "").suffix.lower()
        if background_suffix not in FORMATS:
            await background_file.close()
            raise HTTPException(status_code=415, detail="Use a JPEG, PNG, or WebP background image.")
        if background_file.content_type and background_file.content_type not in (
            ALLOWED_MIME_TYPES | {"application/octet-stream"}
        ):
            await background_file.close()
            raise HTTPException(status_code=415, detail="The uploaded background is not an image.")
        background_bytes = await background_file.read(MAX_UPLOAD_BYTES + 1)
        await background_file.close()
        if not background_bytes:
            raise HTTPException(status_code=400, detail="The uploaded background is empty.")
        if len(background_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Background images must be 10 MB or smaller.")

    try:
        enhanced_bytes = process_image_bytes(
            image_bytes, suffix, background_preset, background_bytes, background_suffix
        )
    except ImageTooLargeError as error:
        raise HTTPException(status_code=413, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.exception("Image enhancement failed")
        raise HTTPException(
            status_code=500,
            detail="The image could not be enhanced. Please try another image.",
        ) from error

    media_type, _ = FORMATS[suffix]
    return Response(content=enhanced_bytes, media_type=media_type)
