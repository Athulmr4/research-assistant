import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatWindow.css';

export function ChatWindow({ messages, isLoading, error, onClearChat }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <section className="chat-empty" aria-label="Getting started">
        <div className="empty-icon" aria-hidden="true">📚</div>
        <h2 className="empty-title">Research Paper Assistant</h2>
        <p className="empty-sub">
          Upload a PDF on the left, then ask me to summarize it,<br />
          explain concepts, or answer any questions about it.
        </p>
        <div className="empty-examples">
          <p className="examples-label">Try asking:</p>
          <ul>
            <li>"What problem does this paper solve?"</li>
            <li>"Explain the architecture in simple terms"</li>
            <li>"What datasets were used?"</li>
            <li>"How does this compare to prior work?"</li>
          </ul>
        </div>
      </section>
    );
  }

  return (
    <div className="chat-window">
      {messages.length > 0 && (
        <div className="chat-toolbar">
          <button className="clear-chat-btn" onClick={onClearChat}>
            Clear conversation
          </button>
        </div>
      )}

      <div className="messages-list" role="log" aria-live="polite" aria-relevant="additions">
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div className="error-banner" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

const Message = React.memo(function Message({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`message ${isUser ? 'message--user' : 'message--ai'}`}>
      <div className={`avatar ${isUser ? 'avatar--user' : 'avatar--ai'}`} aria-hidden="true">
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="bubble">
        {isUser ? (
          <p>{content}</p>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
});

function TypingIndicator() {
  return (
    <div className="message message--ai">
      <div className="avatar avatar--ai">AI</div>
      <div className="bubble bubble--typing">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}
