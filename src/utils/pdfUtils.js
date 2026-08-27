import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker to avoid bundling worker file (CRA-friendly, free)
// pdfjs-dist v4 requires explicit workerSrc. We use unpkg CDN matching installed version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

/**
 * Extract plain text from a PDF File object using pdf.js (client-side, free, no server).
 * @param {File} file
 * @param {number} maxChars - truncate to control token cost
 * @returns {Promise<{ text: string, pages: number }>}
 */
export async function extractPdfText(file, maxChars = 15000) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += `\n\n--- Page ${i} ---\n${pageText}`;
    if (fullText.length >= maxChars) break;
  }

  // Truncate and indicate truncation for the LLM
  let truncated = false;
  if (fullText.length > maxChars) {
    fullText = fullText.slice(0, maxChars);
    truncated = true;
  }

  if (truncated) {
    fullText += `\n\n[Note: Paper truncated to ${maxChars} characters for free-tier context window. Original had ${numPages} pages.]`;
  }

  return { text: fullText.trim(), pages: numPages };
}

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
