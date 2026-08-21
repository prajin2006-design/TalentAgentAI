import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import './ResumeUploader.css';

export const ResumeUploader = ({ onAnalysisComplete }) => {
  const { uploadResume, resume } = useCareer();
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
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

  const processFile = (file) => {
    setIsAnalyzing(true);
    setAnalysisStage('Uploading resume...');

    setTimeout(() => {
      setAnalysisStage('Analyzing experience...');
    }, 600);

    setTimeout(() => {
      setAnalysisStage('Extracting skills...');
    }, 1200);

    setTimeout(() => {
      setAnalysisStage('Building career profile...');
    }, 1800);

    setTimeout(() => {
      setAnalysisStage('Analysis complete.');
      uploadResume(file);
      setIsAnalyzing(false);
      if (onAnalysisComplete) onAnalysisComplete();
    }, 2400);
  };

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
          accept=".pdf"
          style={{ display: 'none' }}
        />

        {isAnalyzing ? (
          <div className="upload-state-content">
            <Loader2 size={40} className="animate-spin text-electric-blue" />
            <h3 className="state-title">{analysisStage}</h3>
            <p className="state-sub">Neural engine is processing skills, experience, and computing job readiness index.</p>
          </div>
        ) : (
          <div className="upload-state-content">
            <div className="upload-icon-circle">
              <UploadCloud size={32} className="cloud-icon" />
            </div>
            <h3 className="state-title">Upload your resume</h3>
            <p className="state-sub">Drag & drop your PDF resume here, or <span className="highlight-link">Choose file</span></p>
            <span className="file-format-badge">PDF Files up to 10MB</span>
          </div>
        )}
      </div>

      {resume && !isAnalyzing && (
        <div className="uploaded-file-banner">
          <div className="banner-left">
            <FileText size={20} className="pdf-icon" />
            <div>
              <div className="file-name">{resume.fileName}</div>
              <div className="file-meta">{resume.fileSize} • Parsed {resume.analyzedAt}</div>
            </div>
          </div>
          <div className="banner-right">
            <span className="badge badge-accent">
              <CheckCircle2 size={13} /> {resume.score}% Match Ready
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
