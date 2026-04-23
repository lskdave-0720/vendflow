import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { extractPDF } from '@/utils/extraction';

export async function POST(request: NextRequest) {
  // 1. Check user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Ensure QuickBooks is connected (to match bills later)
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .single();
  if (!connection) {
    return NextResponse.json({ error: 'Please connect QuickBooks first' }, { status: 400 });
  }

  // 3. Get the file from the form
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (!file.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();

    // 4. Extract with PDF.co
    const extractedData = await extractPDF(arrayBuffer, file.name);

    // 5. Store job & results in Supabase
    const { data: job, error } = await supabase
      .from('document_jobs')
      .insert({
        user_id: user.id,
        file_key: file.name,
        status: 'completed',
        result_blocks: extractedData,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'File uploaded and analyzed successfully.',
      result: extractedData, // The structured extracted data
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}