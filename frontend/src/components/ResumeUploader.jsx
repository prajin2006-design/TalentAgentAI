import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import { safeString } from '../utils/userHelpers';
import './ResumeUploader.css';

export const ResumeUploader = ({ onAnalysisComplete }) => {
  const { uploadResume, resume } = useCareer();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setErrorMsg('');
    if (!file) return;

    const nameLower = (file.name || '').toLowerCase();
    if (!nameLower.endsWith('.pdf') && !nameLower.endsWith('.docx') && !nameLower.endsWith('.txt')) {
      setErrorMsg('Only PDF, DOCX, and TXT resume files are supported. Please select a valid document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10MB limit.`);
      return;
    }

    if (file.size < 100) {
      setErrorMsg('Selected file is empty or corrupted. Please upload a readable document.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('Uploading resume...');

    const t1 = setTimeout(() => setAnalysisStage('Extracting text & structure...'), 500);
    const t2 = setTimeout(() => setAnalysisStage('Scanning ATS compatibility & keywords...'), 1000);
    const t3 = setTimeout(() => setAnalysisStage('Analyzing competencies & generating report...'), 1600);

    try {
      const res = await uploadResume(file);
      if (onAnalysisComplete) {
        onAnalysisComplete(res);
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      setErrorMsg(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsAnalyzing(false);
    }
  };

  const hasResume = !!(resume && (resume.original_filename || resume.fileName || resume.extracted_text));
  const fileName = safeString(resume?.original_filename || resume?.fileName, 'Active Resume');
  const fileSizeStr = resume?.file_size ? `${(resume.file_size / 1024).toFixed(0)} KB` : (resume?.fileSize || '');
  const scoreVal = resume?.ats_score ?? resume?.score;

  return (
    <div className="resume-uploader-card">
      <div
        className={`dropzone-area ${isDragging ? 'dragging' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
        />

        {isAnalyzing ? (
          <div className="upload-state-content">
            <Loader2 size={40} className="animate-spin text-electric-blue" />
            <h3 className="state-title">{analysisStage}</h3>
            <p className="state-sub">AI Engine is processing technical competencies, keyword density, and readiness score.</p>
          </div>
        ) : (
          <div className="upload-state-content">
            <div className="upload-icon-circle">
              <UploadCloud size={32} className="cloud-icon" />
            </div>
            <h3 className="state-title">Upload your resume</h3>
            <p className="state-sub">Drag & drop your PDF, DOCX, or TXT resume here, or <span className="highlight-link">Choose file</span></p>
            <span className="file-format-badge">Supported: PDF, DOCX, TXT • Max 10MB</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="upload-error-alert text-warning mt-2 flex items-center gap-2 text-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {hasResume && !isAnalyzing && (
        <div className="uploaded-file-banner mt-3">
          <div className="banner-left">
            <FileText size={20} className="pdf-icon" />
            <div>
              <div className="file-name">{fileName}</div>
              <div className="file-meta">{fileSizeStr ? `${fileSizeStr} • ` : ''}Active Analyzed Version</div>
            </div>
          </div>
          <div className="banner-right">
            {scoreVal !== undefined && scoreVal !== null ? (
              <span className="badge badge-accent">
                <CheckCircle2 size={13} /> {scoreVal}% ATS Score
              </span>
            ) : (
              <span className="badge badge-success">
                <CheckCircle2 size={13} /> Uploaded
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
