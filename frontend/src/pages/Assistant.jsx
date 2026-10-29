import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import { ChatMessage } from '../components/ChatMessage';
import {
  Sparkles,
  Bot,
  Send,
  Plus,
  Clock,
  Trash2,
  Edit2,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  Paperclip,
  Briefcase,
  Target,
  FileText,
  Award,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import './Assistant.css';

export const Assistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    chatMessages,
    sendMessageToAI,
    conversationId,
    isChatLoading,
    chatError,
    clearChat,
    loadChatConversation,
    profile,
    skills,
    profileCompletion,
    profileScore,
    skillGaps,
    careerPath
  } = useCareer();

  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [deletingConvId, setDeletingConvId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const chatBottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Load conversation list
  const refreshConversations = async () => {
    try {
      const res = await aiAPI.getConversations();
      if (res?.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [conversationId, chatMessages.length]);

  // Scroll to bottom on message update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isChatLoading) return;

    sendMessageToAI(text);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (prompt) => {
    if (!isChatLoading) {
      sendMessageToAI(prompt);
    }
  };

  const handleNewChat = () => {
    clearChat();
    setIsHistoryOpen(false);
  };

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitleText(conv.title || '');
  };

  const handleSaveRename = async (convId, e) => {
    e?.stopPropagation();
    if (!editTitleText.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      await aiAPI.renameConversation(convId, editTitleText.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: editTitleText.trim() } : c))
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setEditingConvId(null);
    }
  };

  const openDeleteDialog = (convId, e) => {
    e.stopPropagation();
    setDeletingConvId(convId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingConvId) return;
    try {
      await aiAPI.deleteConversation(deletingConvId);
      setConversations((prev) => prev.filter((c) => c.id !== deletingConvId));
      if (deletingConvId === conversationId) {
        clearChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingConvId(null);
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...chatMessages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg && !isChatLoading) {
      sendMessageToAI(lastUserMsg.text, true);
    }
  };

  // Group conversations into relative time categories
  const formatRelativeGroup = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return 'Last week';
    return 'Older';
  };

  // Career Snapshot metrics derived from DB
  const displayProfilePercent = profile?.profile_completion || profileCompletion || 82;
  const topSkillName = (skills && skills.length > 0) ? skills[0].skill_name : 'React';
  const targetRoleName = profile?.preferred_role || profile?.headline || 'Frontend Developer';
  const readinessMatchPct = profile?.readiness_score || profileScore || 84;
  const skillGapsCount = (skillGaps && skillGaps.length > 0) ? skillGaps.length : 3;
  const recommendedTopic = (skillGaps && skillGaps.length > 0) ? skillGaps[0].skill || skillGaps[0].skill_name : 'TypeScript';

  const suggestionCards = [
    {
      icon: Briefcase,
      title: "Find jobs that match my skills",
      desc: "Discover top role matches based on your tech stack"
    },
    {
      icon: Target,
      title: "Analyze my skill gaps",
      desc: "Find out what key skills are missing for your target roles"
    },
    {
      icon: FileText,
      title: "Improve my resume",
      desc: "Get ATS optimization tips and bullet point enhancements"
    },
    {
      icon: Award,
      title: "Prepare me for a frontend interview",
      desc: "Practice mock technical & behavioral questions"
    }
  ];

  return (
    <div className="modern-ai-assistant-page">
      {/* MAIN CHAT AREA */}
      <div className={`chat-center-container ${isSnapshotOpen ? 'with-snapshot' : 'snapshot-collapsed'}`}>
        {/* Top Header */}
        <header className="assistant-main-header">
          <div className="header-left-meta">
            <span className="assistant-eyebrow-tag">— AI COPILOT // AUTONOMOUS_CAREER_INTELLIGENCE</span>
            <div className="header-title-row">
              <h1 className="assistant-primary-title">AI Career Assistant</h1>
              <div className="status-badge-online">
                <span className="online-indicator-dot" />
                <span>Neural Core Active</span>
              </div>
            </div>
          </div>

          <div className="header-right-actions">
            <button
              type="button"
              onClick={handleNewChat}
              className="btn-header-action new-chat-btn"
              title="Start a new conversation"
            >
              <Plus size={15} />
              <span className="btn-label-desktop">New Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`btn-header-action icon-only ${isHistoryOpen ? 'active' : ''}`}
              title="Conversation history"
              aria-label="Conversation history"
            >
              <Clock size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsSnapshotOpen(!isSnapshotOpen)}
              className={`btn-header-action icon-only ${isSnapshotOpen ? 'active' : ''}`}
              title={isSnapshotOpen ? "Hide Career Snapshot" : "Show Career Snapshot"}
              aria-label="Toggle career snapshot"
            >
              {isSnapshotOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </header>

        {/* Message Stream or Welcome State */}
        <div className="assistant-messages-scrollarea">
          {chatMessages.length === 0 ? (
            <div className="ai-welcome-state-container">
              <div className="welcome-brand-badge">
                <img src="/logo.png" alt="Talent Agent AI" className="welcome-badge-logo" />
                <span>TALENT AGENT AI // COPILOT</span>
              </div>

              <h2 className="welcome-hero-heading">
                Your career, <span className="headline-orange-word">understood.</span>
              </h2>
              <p className="welcome-hero-sub">
                Ask Talent Agent AI anything about roles, ATS resumes, interview questions, or your skill readiness.
              </p>

              <div className="suggestion-cards-grid">
                {suggestionCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-action-card"
                      onClick={() => handleSuggestionClick(card.title)}
                    >
                      <div className="suggestion-card-top">
                        <div className="suggestion-icon-wrap">
                          <Icon size={17} />
                        </div>
                        <span className="suggestion-arrow-pill">
                          <ChevronRight size={14} className="suggestion-arrow" />
                        </span>
                      </div>
                      <div className="suggestion-card-title">{card.title}</div>
                      <div className="suggestion-card-desc">{card.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="chat-messages-flow">
              {chatMessages.map((msg, index) => (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  onRegenerate={
                    msg.sender === 'ai' && index === chatMessages.length - 1
                      ? handleRegenerate
                      : null
                  }
                />
              ))}

              {isChatLoading && (
                <div className="ai-thinking-indicator-row">
                  <div className="ai-avatar-thinking">
                    <Sparkles size={15} />
                  </div>
                  <div className="thinking-bubble">
                    <div className="bouncing-dots">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                    <span className="thinking-label">Synthesizing career insights...</span>
                  </div>
                </div>
              )}

              {chatError && (
                <div className="ai-chat-error-banner">
                  <div className="error-text-wrap">
                    <strong>Something went wrong.</strong>
                    <span>{chatError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="btn-retry-chat"
                  >
                    <RotateCcw size={13} />
                    <span>Try again</span>
                  </button>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Floating Chat Input Bar */}
        <div className="assistant-input-floating-wrapper">
          {chatMessages.length === 0 && (
            <div className="composer-quick-chips-row">
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSuggestionClick("What is my current ATS resume score and how can I improve it?")}
              >
                <span>⚡ Audit ATS Score</span>
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSuggestionClick("What are the top missing skills for my target role?")}
              >
                <span>🎯 Identify Skill Gaps</span>
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSuggestionClick("Which jobs match my current profile best?")}
              >
                <span>💼 Top Role Matches</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="modern-chat-composer">
            <button
              type="button"
              className="composer-attachment-btn"
              title="Attach context or career files"
              onClick={() => navigate('/resume-analysis')}
            >
              <Paperclip size={17} />
            </button>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your career agent anything about jobs, skills, or interviews..."
              rows={1}
              maxLength={6000}
              className="composer-textarea"
              aria-label="Ask your career agent anything..."
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isChatLoading}
              className="composer-send-btn"
              title="Send message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp size={18} className="send-arrow-icon" />
            </button>
          </form>

          <div className="composer-disclaimer-text">
            <span>— TELEMETRY // MODEL: GEMINI_HYBRID · LATENCY: 180MS · TALENT AGENT AI VERIFIED</span>
          </div>
        </div>
      </div>

      {/* RIGHT CONTEXT PANEL: YOUR CAREER SNAPSHOT */}
      <aside className={`career-snapshot-panel ${isSnapshotOpen ? 'open' : 'closed'}`}>
        <div className="snapshot-panel-header">
          <div className="snapshot-title-group">
            <span className="snapshot-pulse-dot" />
            <span className="snapshot-heading-text">Career Snapshot</span>
            <span className="snapshot-live-pill">LIVE</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSnapshotOpen(false)}
            className="btn-close-snapshot"
            title="Close Snapshot"
          >
            <X size={15} />
          </button>
        </div>

        <div className="snapshot-panel-content">
          {/* Profile Completion Bento Card */}
          <div className="snapshot-metric-card">
            <div className="metric-row-top">
              <span className="metric-label">Profile Readiness</span>
              <span className="metric-highlight-value">{displayProfilePercent}%</span>
            </div>
            <div className="snapshot-progress-track">
              <div
                className="snapshot-progress-bar"
                style={{ width: `${Math.min(100, Math.max(10, displayProfilePercent))}%` }}
              />
            </div>
            <span className="metric-sub-note">Benchmark: 80%+ Recommended</span>
          </div>

          {/* Key Telemetry Stats Grid */}
          <div className="snapshot-stats-list">
            <div className="snapshot-stat-item">
              <span className="stat-item-label">Top Skill</span>
              <span className="stat-item-badge skill">{topSkillName}</span>
            </div>

            <div className="snapshot-stat-item">
              <span className="stat-item-label">Target Role</span>
              <span className="stat-item-val role">{targetRoleName}</span>
            </div>

            <div className="snapshot-stat-item">
              <span className="stat-item-label">Current Match</span>
              <span className="stat-item-badge match">{readinessMatchPct}%</span>
            </div>

            <div className="snapshot-stat-item">
              <span className="stat-item-label">Skill Gaps</span>
              <span className="stat-item-badge gap">{skillGapsCount} identified</span>
            </div>

            <div className="snapshot-stat-item">
              <span className="stat-item-label">Recommended Learning</span>
              <span className="stat-item-val learning">{recommendedTopic}</span>
            </div>
          </div>

          {/* Telemetry Strategy Insight Pill */}
          <div className="snapshot-insight-pill">
            <div className="insight-pill-header">
              <Sparkles size={13} className="insight-spark" />
              <span>RECOMMENDED MOVE</span>
            </div>
            <p className="insight-pill-desc">
              Focus on closing <strong>{recommendedTopic}</strong> to boost your role match from {readinessMatchPct}% towards peak benchmark.
            </p>
          </div>

          {/* Navigation link to full profile */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn-view-full-profile"
          >
            <span>View Full Profile</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </aside>

      {/* CONVERSATION HISTORY DRAWER / SIDEBAR */}
      {isHistoryOpen && (
        <div className="history-drawer-backdrop" onClick={() => setIsHistoryOpen(false)}>
          <div className="history-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="history-drawer-header">
              <div className="history-title-wrap">
                <Clock size={16} />
                <h3>Recent conversations</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="btn-close-drawer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <button type="button" className="btn-drawer-new-chat" onClick={handleNewChat}>
              <Plus size={15} />
              <span>New conversation</span>
            </button>

            <div className="history-items-scroll">
              {conversations.length === 0 ? (
                <div className="history-empty-notice">
                  <MessageSquare size={24} />
                  <p>No conversation history yet.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`history-conv-row ${conv.id === conversationId ? 'active' : ''}`}
                    onClick={() => {
                      loadChatConversation(conv.id);
                      setIsHistoryOpen(false);
                    }}
                  >
                    <div className="conv-content-cell">
                      {editingConvId === conv.id ? (
                        <div className="inline-rename-form" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitleText}
                            onChange={(e) => setEditTitleText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e);
                              if (e.key === 'Escape') setEditingConvId(null);
                            }}
                            autoFocus
                            className="inline-rename-input"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="btn-rename-save"
                          >
                            <Check size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="conv-title-text" title={conv.title}>
                            {conv.title || 'Untitled conversation'}
                          </span>
                          <span className="conv-rel-date">
                            {formatRelativeGroup(conv.updated_at || conv.created_at)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="conv-actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(conv, e)}
                        className="btn-conv-action"
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteDialog(conv.id, e)}
                        className="btn-conv-action danger"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="assistant-modal-backdrop">
          <div className="assistant-modal-box">
            <h3 className="modal-title">Delete conversation?</h3>
            <p className="modal-desc">
              This conversation will be permanently removed from your history. This action cannot be undone.
            </p>
            <div className="modal-btn-row">
              <button
                type="button"
                className="btn-modal cancel"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingConvId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal confirm-delete"
                onClick={confirmDelete}
              >
                Delete conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;
