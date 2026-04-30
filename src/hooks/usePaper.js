import { useState, useCallback } from 'react';

/**
 * usePaper — handles PDF file selection and base64 conversion.
 *
 * @returns {{ paper, pdfBase64, isProcessing, loadPaper, clearPaper }}
 */
export function usePaper() {
  const [paper, setPaper] = useState(null);   // { name, size, pages }
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPaper = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') return;

    setIsProcessing(true);
    setPaper({ name: file.name, size: formatSize(file.size) });

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setPdfBase64(base64);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearPaper = useCallback(() => {
    setPaper(null);
    setPdfBase64(null);
  }, []);

  return { paper, pdfBase64, isProcessing, loadPaper, clearPaper };
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
