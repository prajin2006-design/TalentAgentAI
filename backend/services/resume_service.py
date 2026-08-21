import os
import uuid
import logging
import zipfile
from pathlib import Path
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from config import Config

logger = logging.getLogger(__name__)

def allowed_file(filename: str) -> bool:
    """Validates file extension against allowed types."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


def validate_resume_file(file_obj, extension: str) -> None:
    """Validate file signatures before saving parser input to disk."""
    header = file_obj.stream.read(8)
    file_obj.stream.seek(0)
    if extension == 'pdf' and not header.startswith(b'%PDF-'):
        raise ValueError('The uploaded file is not a valid PDF.')
    if extension == 'docx':
        try:
            with zipfile.ZipFile(file_obj.stream) as archive:
                entries = archive.infolist()
                if len(entries) > 200 or sum(entry.file_size for entry in entries) > 8 * 1024 * 1024:
                    raise ValueError('The DOCX file is too large to process safely.')
                if 'word/document.xml' not in archive.namelist():
                    raise ValueError('The uploaded file is not a valid DOCX.')
        except zipfile.BadZipFile as error:
            raise ValueError('The uploaded file is not a valid DOCX.') from error
        finally:
            file_obj.stream.seek(0)

def save_and_extract_resume(file_obj, user_id: int) -> dict:
    """
    Saves uploaded resume securely and extracts text content.
    Returns metadata and parsed text.
    """
    original_name = secure_filename(file_obj.filename)
    if not original_name or '.' not in original_name:
        raise ValueError('The uploaded resume filename is invalid.')
    extension = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else 'pdf'
    unique_stored_name = f"resume_{user_id}_{uuid.uuid4().hex[:8]}.{extension}"
    target_path = Config.UPLOAD_FOLDER / unique_stored_name

    try:
        file_obj.save(str(target_path))
        file_size = os.path.getsize(target_path)
    except OSError as error:
        target_path.unlink(missing_ok=True)
        raise ValueError('The resume could not be stored. Please try again.') from error
    mime_type = file_obj.content_type or f"application/{extension}"

    extracted_text = ""
    try:
        if extension == 'pdf':
            reader = PdfReader(str(target_path))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        elif extension == 'docx':
            # Simple text extraction for docx
            import zipfile
            import xml.etree.ElementTree as ET
            with zipfile.ZipFile(str(target_path)) as docx:
                xml_content = docx.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                extracted_text = ''.join(node.text for node in tree.iter() if node.text)
    except Exception as error:
        logger.error('Text extraction failed on %s: %s', original_name, error)
        try:
            target_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise ValueError('The resume could not be parsed. Please upload a valid PDF or DOCX file.') from error

    return {
        'original_filename': original_name,
        'stored_filename': unique_stored_name,
        'mime_type': mime_type,
        'file_size': file_size,
        'extracted_text': extracted_text.strip()
    }
