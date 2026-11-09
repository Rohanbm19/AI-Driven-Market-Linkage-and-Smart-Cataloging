import unittest

import cv2
import numpy as np

from main import BACKGROUND_PRESETS, MAX_IMAGE_DIMENSION, process_image_bytes


class ImageProcessingTests(unittest.TestCase):
    def test_jpeg_is_enhanced_and_downscaled_to_limit(self) -> None:
        source = np.full((1200, 2400, 3), 90, dtype=np.uint8)
        source[300:900, 600:1800] = (35, 100, 180)
        success, encoded = cv2.imencode(".jpg", source)
        self.assertTrue(success)

        result = process_image_bytes(encoded.tobytes(), ".jpg")
        decoded = cv2.imdecode(np.frombuffer(result, dtype=np.uint8), cv2.IMREAD_COLOR)

        self.assertIsNotNone(decoded)
        self.assertEqual(max(decoded.shape[:2]), MAX_IMAGE_DIMENSION)
        self.assertEqual(decoded.shape[2], 3)

    def test_png_keeps_alpha_channel(self) -> None:
        source = np.zeros((160, 240, 4), dtype=np.uint8)
        source[:, :, :3] = (70, 120, 180)
        source[:, :, 3] = 128
        success, encoded = cv2.imencode(".png", source)
        self.assertTrue(success)

        result = process_image_bytes(encoded.tobytes(), ".png")
        decoded = cv2.imdecode(np.frombuffer(result, dtype=np.uint8), cv2.IMREAD_UNCHANGED)

        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.shape[2], 4)
        self.assertEqual(int(np.median(decoded[:, :, 3])), 128)

    def test_unreadable_data_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "not a readable image"):
            process_image_bytes(b"not an image", ".jpg")

    def test_background_preset_replaces_background_and_keeps_subject(self) -> None:
        source = np.full((160, 200, 3), (35, 100, 180), dtype=np.uint8)
        source[45:115, 65:135] = (20, 40, 220)
        success, encoded = cv2.imencode(".png", source)
        self.assertTrue(success)

        result = process_image_bytes(encoded.tobytes(), ".png", "clean_white")
        decoded = cv2.imdecode(np.frombuffer(result, dtype=np.uint8), cv2.IMREAD_COLOR)

        expected_background = np.array(BACKGROUND_PRESETS["clean_white"])
        self.assertTrue(np.allclose(decoded[0, 0], expected_background, atol=2))
        self.assertGreater(int(decoded[80, 100, 2]), 150)

    def test_unknown_background_preset_is_rejected(self) -> None:
        success, encoded = cv2.imencode(".png", np.full((80, 80, 3), 120, dtype=np.uint8))
        self.assertTrue(success)

        with self.assertRaisesRegex(ValueError, "valid studio background"):
            process_image_bytes(encoded.tobytes(), ".png", "unknown")

    def test_uploaded_background_is_composited_behind_subject(self) -> None:
        source = np.full((160, 200, 3), (35, 100, 180), dtype=np.uint8)
        source[45:115, 65:135] = (20, 40, 220)
        background = np.full((100, 150, 3), (30, 210, 30), dtype=np.uint8)
        success, source_encoded = cv2.imencode(".png", source)
        self.assertTrue(success)
        success, background_encoded = cv2.imencode(".png", background)
        self.assertTrue(success)

        result = process_image_bytes(
            source_encoded.tobytes(),
            ".png",
            background_bytes=background_encoded.tobytes(),
            background_suffix=".png",
        )
        decoded = cv2.imdecode(np.frombuffer(result, dtype=np.uint8), cv2.IMREAD_COLOR)

        self.assertTrue(np.allclose(decoded[0, 0], [30, 210, 30], atol=2))
        self.assertGreater(int(decoded[80, 100, 2]), 150)


if __name__ == "__main__":
    unittest.main()
