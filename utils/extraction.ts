// utils/extraction.ts
export async function extractPDF(fileArrayBuffer: ArrayBuffer, fileName: string) {
  const apiKey = process.env.PDF_CO_API_KEY!;

  // Convert ArrayBuffer to Blob
  const blob = new Blob([fileArrayBuffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('outputFormat', 'JSON');
  formData.append('parseTables', 'true');
  formData.append('extractTables', 'true');
  formData.append('inline', 'true');

  const response = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`PDF.co API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.message || 'PDF.co extraction failed');
  }

  return data; // Contains parsed tables and forms
}