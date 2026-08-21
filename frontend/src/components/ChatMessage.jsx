import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, RotateCcw } from 'lucide-react';
import './ChatMessage.css';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('jsx', js);
SyntaxHighlighter.registerLanguage('typescript', js);
SyntaxHighlighter.registerLanguage('tsx', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('html', markup);

export const ChatMessage = ({ message, onRegenerate }) => {
  const isAI = message.sender === 'ai';
  const copyMessage = async () => {
    await navigator.clipboard?.writeText(message.text || '');
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
              <ReactMarkdown
                rehypePlugins={[rehypeSanitize]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const language = /language-(\w+)/.exec(className || '')?.[1];
                    return !inline && language ? (
                      <SyntaxHighlighter style={oneDark} language={language} PreTag="div" {...props}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : <code className={className} {...props}>{children}</code>;
                  }
                }}
              >
                {message.text || ''}
              </ReactMarkdown>
              
              <div className="message-actions-row">
                <button type="button" onClick={copyMessage} className="btn-chat-action" title="Copy response" aria-label="Copy response">
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                {onRegenerate && (
                  <button type="button" onClick={onRegenerate} className="btn-chat-action" title="Regenerate response" aria-label="Regenerate response">
                    <RotateCcw size={13} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            </div>
          ) : <div className="user-query-text">{message.text}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
