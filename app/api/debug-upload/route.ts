import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.PDF_CO_API_KEY!;
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file || !file.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Please upload a PDF' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

    // Step 1: Upload to PDF.co
    const uploadForm = new FormData();
    uploadForm.append('file', blob, file.name);
    const uploadRes = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: uploadForm,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || uploadData.error) {
      return NextResponse.json({ step: 'upload', error: uploadData }, { status: 502 });
    }

    // Step 2: Start ASYNC parsing
    const startBody = JSON.stringify({
      url: uploadData.url,
      outputFormat: 'JSON',
      inline: true,
      async: true,   // <-- pivotal change
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
      return NextResponse.json({ step: 'start', error: startData }, { status: 502 });
    }

    const jobId = startData.jobId;
    if (!jobId) {
      return NextResponse.json({ step: 'start', error: 'No jobId returned' }, { status: 502 });
    }

    // Step 3: Poll for the result
    let attempts = 0;
    const maxAttempts = 30; // up to 60 seconds
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
        return NextResponse.json({ step: 'check', error: checkData }, { status: 502 });
      }

      if (checkData.status === 'working') {
        attempts++;
        continue;
      }

      if (checkData.status === 'success') {
        // Parsing completed – return the result
        return NextResponse.json({
          success: true,
          rawParserResponse: checkData.result || checkData.body || checkData,
          uploadedUrl: uploadData.url,
          jobId,
          attempts: attempts + 1,
        });
      }

      // Any other status (failed, expired, etc.)
      return NextResponse.json({
        step: 'check',
        error: `Job status: ${checkData.status}`,
        raw: checkData,
      }, { status: 502 });
    }

    return NextResponse.json({
      step: 'poll',
      error: 'Polling timed out',
    }, { status: 408 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}