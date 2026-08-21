import React from 'react';
import { Bot, User, Copy, RotateCcw, Check } from 'lucide-react';
import './ChatMessage.css';

/**
 * Lightweight markdown parser to render AI chat responses cleanly
 * without requiring external heavy markdown packages.
 */
function renderMarkdown(text) {
  if (!text) return null;

  // Split text by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Check if code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const firstLineEnd = part.indexOf('\n');
      const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
      const codeContent = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);

      return (
        <div key={index} className="code-block-wrapper" style={{ margin: '0.75rem 0', borderRadius: '8px', overflow: 'hidden' }}>
          {language && (
            <div className="code-block-header" style={{ background: '#1e293b', color: '#94a3b8', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {language}
            </div>
          )}
          <pre style={{ margin: 0, padding: '1rem', background: '#0f172a', color: '#f8fafc', overflowX: 'auto', fontSize: '0.85rem', lineHeight: 1.5, fontFamily: 'monospace' }}>
            <code>{codeContent}</code>
          </pre>
        </div>
      );
    }

    // Split non-code text into lines and render paragraphs/headers/lists
    const lines = part.split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: '0.5rem 0 0.5rem 1.25rem', padding: 0 }}>
            {currentList.map((item, lIdx) => (
              <li key={lIdx} style={{ margin: '0.25rem 0' }}>{formatInline(item)}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, lIdx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Check for bullet list item
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        currentList.push(trimmed.replace(/^[-*•]\s+/, ''));
        return;
      }

      // If not a list item, flush any accumulated list
      flushList();

      // Check for headers
      if (trimmed.startsWith('### ')) {
        elements.push(<h4 key={lIdx} style={{ margin: '0.75rem 0 0.35rem', fontWeight: 700 }}>{formatInline(trimmed.slice(4))}</h4>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={lIdx} style={{ margin: '1rem 0 0.5rem', fontWeight: 700 }}>{formatInline(trimmed.slice(3))}</h3>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={lIdx} style={{ margin: '1.25rem 0 0.5rem', fontWeight: 700 }}>{formatInline(trimmed.slice(2))}</h2>);
      } else {
        elements.push(<p key={lIdx} style={{ margin: '0.35rem 0' }}>{formatInline(line)}</p>);
      }
    });

    flushList();

    return <React.Fragment key={index}>{elements}</React.Fragment>;
  });
}

function formatInline(text) {
  if (!text) return '';

  // Process bold: **text** or __text__
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((seg, sIdx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
      return <strong key={sIdx}>{seg.slice(2, -2)}</strong>;
    }
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      return (
        <code
          key={sIdx}
          style={{
            background: 'rgba(0,0,0,0.06)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.875em'
          }}
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    return seg;
  });
}

export const ChatMessage = ({ message, onRegenerate }) => {
  const [copied, setCopied] = React.useState(false);
  const isAI = message.sender === 'ai';

  const copyMessage = async () => {
    try {
      await navigator.clipboard?.writeText(message.text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  return (
    <div className={`chat-message-row ${isAI ? 'ai' : 'user'}`}>
      <div className="avatar-box">
        {isAI ? (
          <div className="ai-avatar">
            <Bot size={18} />
          </div>
        ) : (
          <div className="user-avatar">
            <User size={18} />
          </div>
        )}
      </div>

      <div className="message-bubble-wrapper">
        <div className="message-header-info">
          <span className="sender-name">{isAI ? 'Talent Agent AI' : 'You'}</span>
          <span className="timestamp">{message.timestamp}</span>
        </div>

        <div className="message-bubble">
          {isAI ? (
            <div className="markdown-response">
              {renderMarkdown(message.text || '')}

              <div className="message-actions-row">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="btn-chat-action"
                  title="Copy response"
                  aria-label="Copy response"
                >
                  {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="btn-chat-action"
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RotateCcw size={13} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="user-query-text">{message.text}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
