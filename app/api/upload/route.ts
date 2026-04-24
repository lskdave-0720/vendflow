import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { extractPDF } from '@/utils/extraction';
import { parseExtractedData } from '@/utils/parse-extraction';
import { matchLineItems } from '@/utils/matching';
import { getValidAccessToken } from '@/utils/qb-tokens';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure QuickBooks connection
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('realm_id')
    .eq('user_id', user.id)
    .single();
  if (!connection) {
    return NextResponse.json({ error: 'Please connect QuickBooks first' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!file.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
  }

  try {
    // 1. Extract PDF content
    const arrayBuffer = await file.arrayBuffer();
    const extractedData = await extractPDF(arrayBuffer, file.name);

    // 2. Parse line items
    const lineItems = parseExtractedData(extractedData);

    // 3. Get valid QuickBooks token
    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'QuickBooks token invalid. Please reconnect.' }, { status: 401 });
    }

    // 4. Fetch all open bills from QuickBooks
    const baseUrl = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
    const query = "SELECT * FROM Bill WHERE Balance > '0'";
    const billsResponse = await fetch(
      `${baseUrl}/${connection.realm_id}/query?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!billsResponse.ok) {
      console.error('Failed to fetch bills:', billsResponse.statusText);
      return NextResponse.json({ error: 'Could not fetch QuickBooks bills' }, { status: 500 });
    }

    const billsData = await billsResponse.json();
    const openBills = billsData?.QueryResponse?.Bill || [];

    // 5. Match
    const matchResults = matchLineItems(lineItems, openBills);

    // 6. Store job + results in Supabase
    const { data: job, error } = await supabase
      .from('document_jobs')
      .insert({
        user_id: user.id,
        file_key: file.name,
        status: 'completed',
        result_blocks: {
          extracted: extractedData,
          lineItems,
          matches: matchResults,
        },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'File processed. Matches found.',
      result: {
        lineItems,
        matches: matchResults,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}