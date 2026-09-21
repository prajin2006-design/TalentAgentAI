import io
import logging
import re
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_source) -> dict:
    """
    Extracts text content from a PDF file (passed as bytes, file-like object, or file path).
    Returns a dictionary with success status, extracted_text, page_count, and error message.
    """
    try:
        if isinstance(pdf_source, bytes):
            reader = PdfReader(io.BytesIO(pdf_source))
        elif hasattr(pdf_source, 'read'):
            raw_bytes = pdf_source.read()
            if hasattr(pdf_source, 'seek'):
                pdf_source.seek(0)
            reader = PdfReader(io.BytesIO(raw_bytes))
        else:
            reader = PdfReader(pdf_source)

        page_count = len(reader.pages)
        if page_count == 0:
            return {
                'success': False,
                'extracted_text': '',
                'page_count': 0,
                'error': 'The uploaded PDF file contains 0 pages.'
            }

        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ''
            extracted_pages.append(text)

        full_text = "\n\n".join(extracted_pages).strip()

        # Clean control characters and normalize excessive linebreaks
        cleaned_text = re.sub(r'[\r\t]+', ' ', full_text)
        cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
        cleaned_text = re.sub(r' {2,}', ' ', cleaned_text).strip()

        if len(cleaned_text) < 30:
            logger.warning("Extracted PDF text is too short (< 30 chars). Likely image-based scanned PDF.")
            return {
                'success': False,
                'extracted_text': cleaned_text,
                'page_count': page_count,
                'error': 'This PDF appears to be image-based or scanned. Please upload a text-based PDF or DOCX resume.'
            }

        logger.info(f"Successfully extracted {len(cleaned_text)} chars across {page_count} pages.")
        return {
            'success': True,
            'extracted_text': cleaned_text,
            'page_count': page_count,
            'error': None
        }

    except Exception as e:
        logger.error(f"Error parsing PDF file: {e}")
        return {
            'success': False,
            'extracted_text': '',
            'page_count': 0,
            'error': f"Failed to extract text from PDF: {str(e)}"
        }

def extract_text_from_docx(docx_source) -> dict:
    """
    Extracts text content from a Microsoft Word .docx document using Python built-in zipfile and ElementTree.
    """
    try:
        raw_bytes = docx_source
        if not isinstance(docx_source, bytes):
            if hasattr(docx_source, 'read'):
                raw_bytes = docx_source.read()
                if hasattr(docx_source, 'seek'):
                    docx_source.seek(0)
            else:
                with open(docx_source, 'rb') as f:
                    raw_bytes = f.read()

        with zipfile.ZipFile(io.BytesIO(raw_bytes)) as z:
            xml_content = z.read('word/document.xml')

        tree = ET.fromstring(xml_content)
        texts = [node.text for node in tree.iter() if node.tag.endswith('}t') and node.text]
        full_text = " ".join(texts).strip()

        cleaned_text = re.sub(r'[\r\t]+', ' ', full_text)
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

        if len(cleaned_text) < 20:
            return {
                'success': False,
                'extracted_text': '',
                'page_count': 1,
                'error': 'The uploaded DOCX file contains no parseable text.'
            }

        logger.info(f"Successfully extracted {len(cleaned_text)} chars from DOCX.")
        return {
            'success': True,
            'extracted_text': cleaned_text,
            'page_count': 1,
            'error': None
        }

    except Exception as e:
        logger.error(f"Error parsing DOCX file: {e}")
        return {
            'success': False,
            'extracted_text': '',
            'page_count': 0,
            'error': f"Failed to extract text from DOCX: {str(e)}"
        }

def extract_resume_text(file_source, filename: str) -> dict:
    """
    Unified text extraction dispatcher for PDF and DOCX files.
    """
    fn_lower = (filename or '').lower()
    if fn_lower.endswith('.docx'):
        return extract_text_from_docx(file_source)
    return extract_text_from_pdf(file_source)
