import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { usePaper } from './hooks/usePaper';
import { useChat } from './hooks/useChat';
import './App.css';

export default function App() {
  const { paper, pdfBase64, isProcessing, loadPaper, clearPaper } = usePaper();
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(pdfBase64);

  function handleClearPaper() {
    clearPaper();
    clearChat();
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="9" height="13" rx="1.5" stroke="white" strokeWidth="1.4"/>
              <path d="M6 6.5h6M6 9h6M6 11.5h4" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="13.5" cy="13" r="2.8" fill="#0F6E56" stroke="white" strokeWidth="1.2"/>
              <path d="M13.5 11.8v2.4M12.3 13h2.4" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">Research Paper Assistant</h1>
            <p className="brand-sub">RAG · Summarize · Q&amp;A · Explain</p>
          </div>
        </div>
        {paper && (
          <div className="header-paper-badge">
            <span>📄</span>
            <span className="badge-name">{paper.name}</span>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="app-body">
        <Sidebar
          paper={paper}
          isProcessing={isProcessing}
          onFileSelect={loadPaper}
          onQuickAction={sendMessage}
          onClearPaper={handleClearPaper}
        />

        <main className="chat-panel">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onClearChat={clearChat}
          />
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!pdfBase64}
          />
        </main>
      </div>
    </div>
  );
}
