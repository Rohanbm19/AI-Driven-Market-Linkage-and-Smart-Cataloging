import unittest

import cv2
import numpy as np

from main import MAX_IMAGE_DIMENSION, process_image_bytes


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


if __name__ == "__main__":
    unittest.main()
