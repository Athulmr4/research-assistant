import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { usePaper } from './hooks/usePaper';
import { useChat } from './hooks/useChat';
import { resolveProvider, getProviderLabel } from './utils/llmProvider';
import './App.css';

export default function App() {
  const { paper, pdfBase64, pdfText, isProcessing, error: paperError, loadPaper, clearPaper } = usePaper();
  const { messages, isLoading, error, sendMessage, clearChat } = useChat({ pdfText, pdfBase64 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const provider = resolveProvider();

  const handleClearPaper = useCallback(() => {
    clearPaper();
    clearChat();
  }, [clearPaper, clearChat]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setIsSidebarOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!isSidebarOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSidebarOpen]);

  return (
    <div className="app-layout">
      {/* Header — semantic HTML5 */}
      <header className="app-header">
        <div className="header-left">
          <button
            className="hamburger"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar"
            onClick={() => setIsSidebarOpen((o) => !o)}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
          <div className="header-brand">
            <div className="brand-icon" aria-hidden="true">
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
        </div>
        <div className="header-right">
          <span className={`provider-badge provider--${provider}`} title={`LLM: ${getProviderLabel(provider)}`}>
            {getProviderLabel(provider)}
          </span>
          {paper && (
            <div className="header-paper-badge" title={paper.name}>
              <span aria-hidden="true">📄</span>
              <span className="badge-name">{paper.name}</span>
              {paper.pages && <span className="badge-pages">{paper.pages} pages</span>}
            </div>
          )}
        </div>
      </header>

      {paperError && (
        <div className="paper-error-banner" role="alert">
          {paperError}
        </div>
      )}

      {/* Body — Flexbox layout, responsive via CSS */}
      <div className="app-body">
        {/* Mobile overlay */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />}

        <Sidebar
          id="sidebar"
          paper={paper}
          isProcessing={isProcessing}
          onFileSelect={loadPaper}
          onQuickAction={(prompt) => { setIsSidebarOpen(false); sendMessage(prompt); }}
          onClearPaper={handleClearPaper}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
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
            disabled={!pdfText && !pdfBase64}
          />
        </main>
      </div>
    </div>
  );
}
