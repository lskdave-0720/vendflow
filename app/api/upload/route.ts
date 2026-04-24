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

  // Ensure QuickBooks connected
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
    const arrayBuffer = await file.arrayBuffer();

    // 1. Extract (using mock)
    const extractedData = await extractPDF(arrayBuffer, file.name);
    const lineItems = parseExtractedData(extractedData);

    // 2. Get valid QuickBooks token
    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json({ error: 'QuickBooks token invalid. Please reconnect.' }, { status: 401 });
    }

    // 3. Fetch open bills from QuickBooks
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

    // 4. Match
    const matchResults = matchLineItems(lineItems, openBills);

    // 5. Store & return
    await supabase.from('document_jobs').insert({
      user_id: user.id,
      file_key: file.name,
      status: 'completed',
      result_blocks: {
        extracted: extractedData,
        lineItems,
        matches: matchResults,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'File processed. Matches found.',
      result: {
        lineItems,
        matches: matchResults,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Processing failed', details: message }, { status: 500 });
  }
}