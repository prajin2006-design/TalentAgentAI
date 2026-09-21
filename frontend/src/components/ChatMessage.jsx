import React, { useState } from 'react';
import { Bot, User, Copy, RotateCcw, Check, Sparkles, Code2 } from 'lucide-react';
import { safeString } from '../utils/userHelpers';
import './ChatMessage.css';

/**
 * Enhanced markdown parser with support for:
 * - Special Career Insight blocks
 * - Code blocks with copy button
 * - Headings, bullet points, numbered lists, blockquotes, bold & inline code
 */
function renderMarkdown(text) {
  if (typeof text !== 'string') {
    text = text ? String(text) : '';
  }
  if (!text.trim()) return null;

  // Split text by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Check if code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const firstLineEnd = part.indexOf('\n');
      const language = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : 'code';
      const codeContent = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);

      return (
        <CodeBlockSnippet key={index} language={language} code={codeContent} />
      );
    }

    // Split non-code text into lines and render paragraphs/headers/lists/career insights
    const lines = part.split('\n');
    const elements = [];
    let currentList = [];
    let isInsideInsightCard = false;
    let insightLines = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="ai-markdown-list">
            {currentList.map((item, lIdx) => (
              <li key={lIdx}>{formatInline(item)}</li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushInsightCard = () => {
      if (insightLines.length > 0) {
        elements.push(
          <div key={`insight-${elements.length}`} className="ai-career-insight-card">
            <div className="career-insight-header">
              <Sparkles size={14} className="career-insight-icon" />
              <span>CAREER INSIGHT</span>
            </div>
            <div className="career-insight-body">
              {insightLines.map((line, idx) => (
                <p key={idx}>{formatInline(line)}</p>
              ))}
            </div>
          </div>
        );
        insightLines = [];
        isInsideInsightCard = false;
      }
    };

    lines.forEach((line, lIdx) => {
      const trimmed = line.trim();

      // Check if this line marks start/end of career insight box
      if (trimmed.includes('✦ CAREER INSIGHT') || trimmed.toUpperCase().startsWith('[CAREER INSIGHT]') || trimmed.startsWith('┌──') || trimmed.startsWith('└──')) {
        if (trimmed.startsWith('┌──') || trimmed.includes('CAREER INSIGHT')) {
          flushList();
          isInsideInsightCard = true;
          return;
        }
        if (trimmed.startsWith('└──')) {
          flushInsightCard();
          return;
        }
      }

      if (isInsideInsightCard) {
        const cleanInsightLine = trimmed.replace(/^[│|]\s*/, '').replace(/\s*[│|]$/, '');
        if (cleanInsightLine) {
          insightLines.push(cleanInsightLine);
        }
        return;
      }

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
        elements.push(<h4 key={lIdx} className="ai-markdown-h4">{formatInline(trimmed.slice(4))}</h4>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h3 key={lIdx} className="ai-markdown-h3">{formatInline(trimmed.slice(3))}</h3>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={lIdx} className="ai-markdown-h2">{formatInline(trimmed.slice(2))}</h2>);
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={lIdx} className="ai-markdown-quote">
            {formatInline(trimmed.slice(2))}
          </blockquote>
        );
      } else {
        elements.push(<p key={lIdx} className="ai-markdown-p">{formatInline(line)}</p>);
      }
    });

    flushList();
    flushInsightCard();

    return <React.Fragment key={index}>{elements}</React.Fragment>;
  });
}

function CodeBlockSnippet({ language, code }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="ai-code-block-wrapper">
      <div className="ai-code-header">
        <div className="ai-code-lang">
          <Code2 size={12} />
          <span>{language || 'code'}</span>
        </div>
        <button type="button" onClick={handleCopy} className="ai-code-copy-btn" title="Copy code">
          {copiedCode ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
          <span>{copiedCode ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="ai-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function formatInline(text) {
  if (typeof text !== 'string') {
    text = text ? String(text) : '';
  }
  if (!text) return '';

  // Process bold: **text** or code `text` or highlight [metric]
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((seg, sIdx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
      const inner = seg.slice(2, -2);
      // If it contains percentage or confidence metric, add subtle accent class
      if (/\d+%/g.test(inner)) {
        return <strong key={sIdx} className="highlight-metric">{inner}</strong>;
      }
      return <strong key={sIdx}>{inner}</strong>;
    }
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
      return (
        <code key={sIdx} className="ai-inline-code">
          {seg.slice(1, -1)}
        </code>
      );
    }
    return seg;
  });
}

export const ChatMessage = ({ message = {}, onRegenerate }) => {
  const isAI = message.sender === 'ai' || message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const rawText = typeof message.text === 'string'
    ? message.text
    : (typeof message.content === 'string' ? message.content : (typeof message.message === 'string' ? message.message : ''));

  const timestamp = safeString(message.timestamp, 'Just now');

  const copyMessage = async () => {
    try {
      await navigator.clipboard?.writeText(rawText);
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
          <div className="ai-avatar" title="Talent Agent AI">
            <Sparkles size={16} />
          </div>
        ) : (
          <div className="user-avatar" title="You">
            <User size={16} />
          </div>
        )}
      </div>

      <div className="message-bubble-wrapper">
        <div className="message-header-info">
          <span className="sender-name">{isAI ? 'Talent Agent AI' : 'You'}</span>
          <span className="message-timestamp">{timestamp}</span>
        </div>

        <div className="message-bubble">
          {isAI ? (
            <div className="ai-markdown-content">
              {renderMarkdown(rawText)}

              <div className="ai-message-footer-actions">
                <button
                  type="button"
                  onClick={copyMessage}
                  className="btn-msg-action"
                  title="Copy response"
                  aria-label="Copy response"
                >
                  {copied ? <Check size={12} className="text-lime" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="btn-msg-action"
                    title="Regenerate response"
                    aria-label="Regenerate response"
                  >
                    <RotateCcw size={12} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="user-text-content">{rawText}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
