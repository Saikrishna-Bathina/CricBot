"""OCR interface for scanned PDF pages with graceful degradation."""

from typing import Optional
from app.core.logging import logger


class OCREngine:
    def __init__(self):
        self.available = False
        try:
            import pytesseract
            from PIL import Image
            self.available = True
            self.pytesseract = pytesseract
            self.Image = Image
        except ImportError:
            self.available = False

    def is_available(self) -> bool:
        return self.available

    def ocr_page_image(self, image_bytes: bytes) -> Optional[str]:
        if not self.available:
            logger.warning("OCR engine requested but pytesseract/PIL is not fully configured.")
            return None
        try:
            import io
            img = self.Image.open(io.BytesIO(image_bytes))
            text = self.pytesseract.image_to_string(img)
            return text.strip() if text else None
        except Exception as exc:
            logger.warning("OCR processing error: %s", exc)
            return None
