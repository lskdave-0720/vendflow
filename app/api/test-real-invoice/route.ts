import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PDF_CO_API_KEY!;
  const sampleInvoiceUrl = 'https://www.invoicesamples.com/sample-invoice.pdf';

  try {
    // Download the sample invoice PDF from the public URL
    const pdfResponse = await fetch(sampleInvoiceUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to download sample invoice' }, { status: 502 });
    }
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

    // Upload to PDF.co
    const uploadForm = new FormData();
    uploadForm.append('file', blob, 'sample-invoice.pdf');
    const uploadRes = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: uploadForm,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || uploadData.error) {
      return NextResponse.json({ step: 'upload', error: uploadData }, { status: 502 });
    }

    // Parse the uploaded file
    const parserBody = JSON.stringify({
      url: uploadData.url,
      outputFormat: 'JSON',
      inline: true,
    });
    const parserRes = await fetch('https://api.pdf.co/v1/pdf/documentparser', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: parserBody,
    });
    const parserData = await parserRes.json();

    // Return the raw PDF.co response (and also the parsed structure if available)
    return NextResponse.json({
      upload: { status: uploadRes.status, url: uploadData.url },
      parser: { status: parserRes.status, body: parserData },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}