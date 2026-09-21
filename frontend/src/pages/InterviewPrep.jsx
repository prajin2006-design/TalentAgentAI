import React, { useState, useEffect } from 'react';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import { interviewAPI, aiAPI } from '../services/api';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  RefreshCw,
  Clock,
  BookOpen,
  ChevronRight,
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import './InterviewPrep.css';

export const InterviewPrep = () => {
  const { profile, skills } = useCareer();
  const { user } = useAuth();

  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [aiConfigured, setAiConfigured] = useState(true);

  useEffect(() => {
    if (profile?.preferred_role) {
      setTargetRole(profile.preferred_role);
    }
    // Check AI service status
    aiAPI.getHealth()
      .then((res) => {
        setAiConfigured(res?.configured ?? true);
      })
      .catch(() => {});
  }, [profile]);

  const handleGenerateQuestions = async (e) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setEvaluationResult(null);
    setUserAnswer('');

    try {
      const res = await interviewAPI.generateQuestions({
        target_role: targetRole || 'Software Engineer',
        job_description: jobDescription
      });
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setActiveQuestionIndex(0);
      } else {
        setError('No interview questions were generated. Please try again.');
      }
    } catch (err) {
      console.error('Failed to generate interview questions:', err);
      setError(err.message || 'Unable to generate interview questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || questions.length === 0) return;

    const currentQ = questions[activeQuestionIndex];
    setIsEvaluating(true);
    setError(null);

    try {
      const res = await interviewAPI.evaluateAnswer({
        question: currentQ.question,
        answer: userAnswer,
        target_role: targetRole || 'Software Engineer'
      });
      setEvaluationResult(res);

      // Add to session history
      const historyItem = {
        questionId: currentQ.id || activeQuestionIndex + 1,
        question: currentQ.question,
        category: currentQ.category,
        answer: userAnswer,
        score: res.score,
        rating: res.rating,
        evaluatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (err) {
      console.error('Failed to evaluate answer:', err);
      setError(err.message || 'Unable to evaluate answer.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const activeQuestion = questions[activeQuestionIndex];

  return (
    <div className="interview-page-container">
      {/* Page Header Card */}
      <div className="interview-header-card">
        <div className="header-top-row">
          <div className="badge badge-accent">
            <Sparkles size={14} />
            <span>AI MOCK INTERVIEW & PREPARATION ENGINE</span>
          </div>
          <span className={`status-pill ${aiConfigured ? 'ready' : 'warning'}`}>
            {aiConfigured ? 'AI Evaluator Ready' : 'AI Service Inactive'}
          </span>
        </div>
        <h1 className="banner-heading">Practice Technical & Behavioral Interviews</h1>
        <p className="banner-sub">
          Generate rigorous, position-tailored questions based on your profile, resume, and target job descriptions. Receive instant feedback and quantitative hiring rubrics.
        </p>

        {/* Configuration Setup Form */}
        <div className="interview-setup-bar">
          <div className="setup-input-group">
            <label className="setup-label">Target Position</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Frontend Architect, Data Engineer"
              className="setup-input"
            />
          </div>

          <div className="setup-input-group flex-2">
            <label className="setup-label">Target Job Description (Optional)</label>
            <input
              type="text"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description keywords or snippet to tailor questions..."
              className="setup-input"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateQuestions}
            disabled={isGenerating}
            className="btn btn-primary setup-btn"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Generate Questions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error-bar">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Interview Practice Studio */}
      {questions.length === 0 && !isGenerating ? (
        <div className="card interview-empty-state">
          <BrainCircuit size={48} className="text-accent mb-2" />
          <h3>No Questions Active</h3>
          <p>
            Click "Generate Questions" above to generate a customized 5-question mock interview set tailored to your {targetRole || 'engineering'} profile.
          </p>
          <button onClick={handleGenerateQuestions} className="btn btn-primary btn-sm mt-3">
            <Sparkles size={14} />
            <span>Generate Interview Set</span>
          </button>
        </div>
      ) : isGenerating ? (
        <div className="card interview-loading-card text-center">
          <RefreshCw size={36} className="animate-spin text-accent mb-3" />
          <h3>Generating Technical & Behavioral Questions...</h3>
          <p className="text-muted">Analyzing role competencies and formatting rubric criteria.</p>
        </div>
      ) : (
        <div className="interview-studio-grid">
          {/* Left Column: Active Question & Answer Composer */}
          <div className="studio-main-col">
            {/* Question Navigation Tabs */}
            <div className="question-nav-pills">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    setEvaluationResult(null);
                    setUserAnswer('');
                  }}
                  className={`q-nav-btn ${activeQuestionIndex === idx ? 'active' : ''}`}
                >
                  <span>Q{idx + 1}</span>
                  <span className="q-nav-diff">{q.difficulty || 'Mid'}</span>
                </button>
              ))}
            </div>

            {/* Question Card */}
            {activeQuestion && (
              <div className="card question-display-card">
                <div className="q-card-header">
                  <div className="q-category-tag">
                    <BookOpen size={13} />
                    <span>{activeQuestion.category || 'Technical Evaluation'}</span>
                  </div>
                  <span className="q-focus-tag">{activeQuestion.focus_area || 'Core Competency'}</span>
                </div>

                <h2 className="q-title-text">{activeQuestion.question}</h2>

                {activeQuestion.hint && (
                  <div className="q-hint-box">
                    <Lightbulb size={16} className="text-warning" />
                    <div>
                      <strong>Key points to address:</strong> {activeQuestion.hint}
                    </div>
                  </div>
                )}

                {/* Answer Composer */}
                <form onSubmit={handleEvaluateAnswer} className="q-answer-form">
                  <label className="answer-label">Your Response (Type or paste your answer):</label>
                  <textarea
                    rows={6}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Structure your answer clearly. Highlight practical scenarios, methodologies, trade-offs, and measurable outcomes..."
                    className="answer-textarea"
                    required
                  />

                  <div className="answer-action-row">
                    <span className="word-count-text">
                      {userAnswer.trim() ? `${userAnswer.trim().split(/\s+/).length} words` : '0 words'}
                    </span>

                    <button
                      type="submit"
                      disabled={!userAnswer.trim() || isEvaluating}
                      className="btn btn-accent evaluate-btn"
                    >
                      {isEvaluating ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Evaluating Answer...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Submit for AI Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AI Evaluation Result Card */}
            {evaluationResult && (
              <div className="card evaluation-result-card">
                <div className="eval-score-header">
                  <div className="eval-score-badge">
                    <Award size={20} />
                    <span className="score-num">{evaluationResult.score}/100</span>
                    <span className="score-lbl">{evaluationResult.rating || 'Evaluated'}</span>
                  </div>
                  <div className="eval-summary-text">
                    <p>{evaluationResult.feedback_summary}</p>
                  </div>
                </div>

                <div className="eval-details-grid">
                  {/* Strengths */}
                  <div className="eval-box strengths">
                    <div className="eval-box-title">
                      <ThumbsUp size={15} />
                      <span>Key Strengths Identified</span>
                    </div>
                    <ul>
                      {(evaluationResult.strengths || []).map((st, i) => (
                        <li key={i}>{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="eval-box improvements">
                    <div className="eval-box-title">
                      <TrendingUp size={15} />
                      <span>Recommended Refinements</span>
                    </div>
                    <ul>
                      {(evaluationResult.improvements || []).map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model Answer Formulation */}
                {evaluationResult.model_answer && (
                  <div className="eval-model-answer-box">
                    <h4>
                      <Sparkles size={15} className="text-electric-blue" />
                      <span>Exemplary Answer Structure</span>
                    </h4>
                    <p>{evaluationResult.model_answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Practice History & Tips */}
          <div className="studio-sidebar-col">
            <div className="card interview-tips-card">
              <h3>
                <Lightbulb size={16} className="text-accent" />
                <span>Interview Mastery Guide</span>
              </h3>
              <ul className="tips-list">
                <li>
                  <strong>STAR Methodology:</strong> Structure behavioral answers with Situation, Task, Action, and Result.
                </li>
                <li>
                  <strong>Quantify Impact:</strong> Whenever possible, state metrics (e.g. "improved load time by 35%").
                </li>
                <li>
                  <strong>Trade-offs:</strong> High-performing candidates explain why they chose one architecture over another.
                </li>
              </ul>
            </div>

            {history.length > 0 && (
              <div className="card practice-history-card">
                <h3>Session Scorecard</h3>
                <div className="history-items-list">
                  {history.map((item, idx) => (
                    <div key={idx} className="history-row-item">
                      <div className="history-q-meta">
                        <span className="history-q-name">Q{item.questionId}: {item.category}</span>
                        <span className="history-time">{item.evaluatedAt}</span>
                      </div>
                      <span className={`history-score-pill ${item.score >= 75 ? 'high' : 'medium'}`}>
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
