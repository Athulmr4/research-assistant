import React, { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

export function ChatInput({ onSend, isLoading, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize the textarea as the user types
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [text]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <div className="chat-input-bar">
      <textarea
        ref={textareaRef}
        className="chat-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Upload a PDF to start chatting…' : 'Ask anything about the paper… (Enter to send, Shift+Enter for newline)'}
        disabled={disabled || isLoading}
        rows={1}
      />
      <button
        className="send-button"
        onClick={submit}
        disabled={!text.trim() || isLoading || disabled}
        title="Send message"
      >
        {isLoading ? (
          <span className="send-spinner" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
