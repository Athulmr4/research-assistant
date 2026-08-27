import React, { useRef } from 'react';
import './Sidebar.css';

const QUICK_ACTIONS = [
  {
    id: 'summarize',
    label: 'Summarize paper',
    description: 'Get a concise overview',
    prompt: 'Please summarize this research paper. Cover the main problem it addresses, the approach taken, key findings, and the overall impact or takeaway.',
  },
  {
    id: 'concepts',
    label: 'Explain key concepts',
    description: 'Simple language breakdown',
    prompt: 'What are the key technical concepts and terminology used in this paper? Explain each one in simple, everyday language that a non-expert could understand.',
  },
  {
    id: 'contributions',
    label: 'Main contributions',
    description: "What does this paper add?",
    prompt: 'What are the main contributions and novel aspects of this paper? What does it add to its field that did not exist before?',
  },
  {
    id: 'methodology',
    label: 'Methodology',
    description: 'How was the research done?',
    prompt: 'Describe the methodology used in this paper. What data, models, experiments, or techniques were used? How was the research structured?',
  },
  {
    id: 'limitations',
    label: 'Limitations & future work',
    description: 'Gaps the authors acknowledge',
    prompt: 'What are the limitations, weaknesses, or open problems in this paper? What future work do the authors suggest?',
  },
];

export function Sidebar({ paper, isProcessing, onFileSelect, onQuickAction, onClearPaper, isOpen, onClose, id }) {
  const fileInputRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current.click();
    }
  }

  return (
    <aside id={id} className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Paper and quick actions">
      {/* Upload zone — HTML5 drag & drop + keyboard a11y */}
      <div
        className={`upload-zone ${paper ? 'has-paper' : ''}`}
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={paper ? `Loaded: ${paper.name}. Click to replace` : 'Upload PDF — click or drag and drop'}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => onFileSelect(e.target.files[0])}
        />

        {isProcessing ? (
          <div className="upload-loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>Processing PDF...</span>
          </div>
        ) : paper ? (
          <div className="paper-info">
            <div className="paper-icon" aria-hidden="true">📄</div>
            <div className="paper-details">
              <p className="paper-name" title={paper.name}>{paper.name}</p>
              <p className="paper-meta">{paper.size}{paper.pages ? ` · ${paper.pages} pages` : ''} · Ready</p>
            </div>
            <button
              className="clear-btn"
              onClick={(e) => { e.stopPropagation(); onClearPaper(); }}
              title="Remove paper"
              aria-label="Remove paper"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon" aria-hidden="true">⬆</div>
            <p className="upload-title">Upload PDF</p>
            <p className="upload-sub">Click or drag & drop a research paper</p>
          </div>
        )}
      </div>

      {/* Quick actions — semantic nav */}
      <nav className="quick-actions" aria-label="Quick actions">
        <p className="section-label">Quick actions</p>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            className="action-btn"
            onClick={() => onQuickAction(action.prompt)}
            disabled={!paper}
            aria-disabled={!paper}
          >
            <span className="action-label">{action.label}</span>
            <span className="action-desc">{action.description}</span>
          </button>
        ))}
      </nav>

      <p className="sidebar-hint">
        Free: text is extracted in-browser (pdf.js) then sent to your chosen LLM. No server.
      </p>
    </aside>
  );
}
