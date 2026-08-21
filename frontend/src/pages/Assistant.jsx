import React, { useEffect, useRef, useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { aiAPI } from '../services/api';
import { ChatMessage } from '../components/ChatMessage';
import { Bot, Clock3, LoaderCircle, Plus, Send, Square, Trash2, MoreVertical, Trash, Edit2 } from 'lucide-react';
import './Assistant.css';

export const Assistant = () => {
  const { 
    chatMessages, 
    sendMessageToAI, 
    conversationId, 
    isChatLoading, 
    chatError, 
    clearChat, 
    stopChatGeneration, 
    loadChatConversation 
  } = useCareer();

  const [inputText, setInputText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const chatBottomRef = useRef(null);
  const sidebarMenuRef = useRef(null);

  // Load conversations
  const refreshConversations = () => {
    aiAPI.getConversations()
      .then((result) => setConversations(result.conversations || []))
      .catch(() => {});
  };

  useEffect(() => {
    refreshConversations();
  }, [conversationId, chatMessages.length]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Click outside to close three-dot menu dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeDropdownId && !e.target.closest('.conversation-dots-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdownId]);

  const handleSend = (event) => {
    event?.preventDefault();
    if (inputText.trim() && !isChatLoading) {
      sendMessageToAI(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (promptText) => {
    if (!isChatLoading) {
      sendMessageToAI(promptText);
    }
  };

  const regenerate = () => {
    const lastUserMessage = [...chatMessages].reverse().find((message) => message.sender === 'user');
    if (lastUserMessage && !isChatLoading) {
      sendMessageToAI(lastUserMessage.text, true);
    }
  };

  const openDeleteModal = (e, convId) => {
    e.stopPropagation();
    setDeletingId(convId);
    setIsDeleteModalOpen(true);
    setActiveDropdownId(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await aiAPI.deleteConversation(deletingId);
      
      // Update conversations local list
      const result = await aiAPI.getConversations();
      const updatedConversations = result.conversations || [];
      setConversations(updatedConversations);
      
      // If we deleted the active conversation, switch or clear
      if (deletingId === conversationId) {
        if (updatedConversations.length > 0) {
          loadChatConversation(updatedConversations[0].id);
        } else {
          clearChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    }
  };

  const suggestionChips = [
    "How can I improve my resume?",
    "What skills should I learn for UX design?",
    "Which roles match my profile?",
    "Prepare me for a frontend interview"
  ];

  return (
    <div className="assistant-page-wrapper">
      {/* Premium Dashboard Header Card */}
      <div className="assistant-header-card">
        <div className="header-top-row">
          <div className="badge badge-accent">
            <Bot size={13} />
            <span>TALENT AGENT AI</span>
          </div>
          <span className="live-status-lbl">Private conversation</span>
        </div>
        <h2 className="banner-heading">Career intelligence, in conversation.</h2>
        <p className="banner-sub">Ask about careers, technology, resumes, interviews, learning plans, or anything you are working toward.</p>
      </div>

      <div className="assistant-workspace">
        {/* Sidebar Navigation */}
        <aside className="conversation-sidebar" aria-label="Conversation history">
          <button type="button" className="btn-chat-new" onClick={clearChat}>
            <Plus size={15} />
            <span>New conversation</span>
          </button>
          
          <div className="conversation-history-title">
            <Clock3 size={13} />
            <span>Recent conversations</span>
          </div>

          <div className="conversation-list-scroll">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id} 
                className={`conversation-item-row ${conversation.id === conversationId ? 'active' : ''}`}
                onClick={() => loadChatConversation(conversation.id)}
              >
                <span className="conversation-title-text">
                  {conversation.title || 'Untitled conversation'}
                </span>
                
                {/* Three-dot Context Menu Trigger */}
                <div className="conversation-dots-container">
                  <button 
                    type="button" 
                    className="conversation-dots-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(activeDropdownId === conversation.id ? null : conversation.id);
                    }}
                    title="Conversation options"
                    aria-label="Conversation options"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeDropdownId === conversation.id && (
                    <div className="conversation-context-menu">
                      <button 
                        type="button" 
                        className="menu-action-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Placeholder rename or simple notice
                          const newName = prompt("Rename conversation:", conversation.title || '');
                          if (newName && newName.trim()) {
                            // Note: we can expand rename later, focus on UI action
                            conversation.title = newName;
                            setConversations([...conversations]);
                          }
                          setActiveDropdownId(null);
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Rename</span>
                      </button>
                      <button 
                        type="button" 
                        className="menu-action-item danger"
                        onClick={(e) => openDeleteModal(e, conversation.id)}
                      >
                        <Trash size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Window Workspace */}
        <section className="chat-window-card" aria-label="Talent Agent AI chat">
          <div className="chat-toolbar">
            <span className="chat-toolbar-status">{conversationId ? 'Conversation active' : 'New conversation'}</span>
            <button type="button" onClick={clearChat} className="btn-chat-toolbar-clear" title="Clear conversation">
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>

          <div className="messages-stream">
            {chatMessages.length === 0 && (
              <div className="chat-empty-state">
                <Bot size={28} className="empty-bot-icon" />
                <h3>AI Career Co-Pilot</h3>
                <p className="empty-sub-desc">Ask about careers, skill calibration, resume optimizations, or interview preps. Get personalized paths.</p>
                
                {/* Clickable suggestion prompt cards */}
                <div className="suggestion-chips-grid">
                  {suggestionChips.map((promptText, i) => (
                    <button 
                      key={i} 
                      type="button" 
                      onClick={() => handleSuggestionClick(promptText)} 
                      className="suggestion-chip-btn"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onRegenerate={message.sender === 'ai' && index === chatMessages.length - 1 ? regenerate : null} 
              />
            ))}

            {isChatLoading && (
              <div className="chat-typing">
                <LoaderCircle size={14} className="spin-loader" />
                <span>Talent Agent AI is thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {chatError && <div className="chat-error-alert" role="alert">{chatError}</div>}

          {/* Chat composer with integrated Send button */}
          <form onSubmit={handleSend} className="chat-input-container">
            <textarea 
              value={inputText} 
              onChange={(event) => setInputText(event.target.value)} 
              onKeyDown={handleKeyDown} 
              placeholder="Ask anything..." 
              className="chat-composer-textarea"
              rows={1} 
              maxLength={6000} 
              aria-label="Message Talent Agent AI" 
            />
            <div className="chat-composer-actions">
              {isChatLoading ? (
                <button type="button" className="btn-composer-icon stop" onClick={stopChatGeneration} title="Stop generation">
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button type="submit" className="btn-composer-icon send" disabled={!inputText.trim()} title="Send message">
                  <Send size={13} />
                </button>
              )}
            </div>
          </form>
          <div className="chat-input-hint">Enter to send · Shift + Enter for a new line</div>
        </section>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Delete conversation?</h3>
            <p className="modal-body">This conversation will be permanently removed. This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-modal cancel" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingId(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-modal confirm-danger" 
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
