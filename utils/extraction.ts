// utils/extraction.ts (two‑step upload + async parser with polling)
export async function extractPDF(fileArrayBuffer: ArrayBuffer, fileName: string) {
  const apiKey = process.env.PDF_CO_API_KEY!;

  // Step 1: Upload to PDF.co temp storage
  const blob = new Blob([fileArrayBuffer], { type: 'application/pdf' });
  const uploadForm = new FormData();
  uploadForm.append('file', blob, fileName);

  const uploadRes = await fetch('https://api.pdf.co/v1/file/upload', {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: uploadForm,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || uploadData.error) {
    throw new Error(`Upload failed: ${uploadData.message || uploadData.error || uploadRes.statusText}`);
  }

  const uploadedUrl = uploadData.url;

  // Step 2: Start async parsing
  const startBody = JSON.stringify({
    url: uploadedUrl,
    outputFormat: 'JSON',
    inline: true,
    async: true,   // <— the key change
  });

  const startRes = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: startBody,
  });

  const startData = await startRes.json();
  if (!startRes.ok || startData.error) {
    throw new Error(`Parser start failed: ${startData.message || startData.error || startRes.statusText}`);
  }

  const jobId = startData.jobId;
  if (!jobId) {
    throw new Error('No jobId returned from async parser');
  }

  // Step 3: Poll for the result
  let attempts = 0;
  const maxAttempts = 30; // up to 30 seconds
  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds

    const checkRes = await fetch('https://api.pdf.co/v1/job/check', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId }),
    });

    const checkData = await checkRes.json();
    if (checkData.error) {
      throw new Error(`Job check error: ${checkData.message}`);
    }

    if (checkData.status === 'working') {
      attempts++;
      continue;
    }

    if (checkData.status === 'success') {
      // The parsed data is in checkData.result (or checkData.body, depending on endpoint)
      return checkData.result || checkData.body || checkData;
    }

    // Any other status (failed, expired, etc.)
    throw new Error(`Parsing job failed with status: ${checkData.status}`);
  }

  throw new Error('Parser timed out after polling');
}