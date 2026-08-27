import { useState, useCallback } from 'react';
import { extractPdfText, formatSize } from '../utils/pdfUtils';

/**
 * usePaper — handles PDF file selection, client-side text extraction (pdf.js, free),
 * and keeps base64 for providers that need it (Anthropic document blocks).
 *
 * @returns {{ paper, pdfBase64, pdfText, isProcessing, error, loadPaper, clearPaper }}
 */
export function usePaper() {
  const [paper, setPaper] = useState(null);   // { name, size, pages }
  const [pdfBase64, setPdfBase64] = useState(null);
  const [pdfText, setPdfText] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const loadPaper = useCallback(async (file) => {
    if (!file) return;
    // Allow PDFs by mime or extension (some browsers report empty type)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Please upload a PDF file.');
      return;
    }
    // 10MB guard — keeps free-tier context manageable
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF too large. Please upload a file under 10MB.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPaper({ name: file.name, size: formatSize(file.size) });

    try {
      // Parallel: base64 for Anthropic + extracted text for free providers
      const [base64, { text, pages }] = await Promise.all([
        fileToBase64(file),
        extractPdfText(file),
      ]);
      setPdfBase64(base64);
      setPdfText(text);
      setPaper((prev) => ({ ...prev, pages }));
    } catch (e) {
      setError(e.message || 'Failed to process PDF.');
      setPaper(null);
      setPdfBase64(null);
      setPdfText(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearPaper = useCallback(() => {
    setPaper(null);
    setPdfBase64(null);
    setPdfText(null);
    setError(null);
  }, []);

  return { paper, pdfBase64, pdfText, isProcessing, error, loadPaper, clearPaper };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
