import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getValidAccessToken } from '@/utils/qb-tokens';
import VendorUpload from './VendorUpload'; // we'll create this next

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if QuickBooks is connected
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('realm_id, updated_at')
    .eq('user_id', user.id)
    .single();

  const isConnected = !!connection;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>

        {/* QuickBooks Connection Status */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">QuickBooks Connection</h2>
          {isConnected ? (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Connected to QuickBooks Online (Company ID: {connection.realm_id})</span>
              </div>
              {/* Token‑refreshed company info */}
              <QuickBooksInfo userId={user.id} />
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-gray-600">Connect your QuickBooks Online account to start automating vendor statement reconciliation.</p>
              <Link
                href="/api/auth/qb"
                className="mt-3 inline-block rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Connect QuickBooks
              </Link>
            </div>
          )}
          {connection && (
            <p className="mt-1 text-xs text-gray-400">
              Last connected: {new Date(connection.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Vendor Statement Upload */}
        <VendorUpload />
      </div>
    </main>
  );
}

// Token‑refreshing company info component
async function QuickBooksInfo({ userId }: { userId: string }) {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    return <p className="text-sm text-red-600">Could not obtain a valid QuickBooks token. Please reconnect.</p>;
  }

  const supabase = await createClient();
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('realm_id')
    .eq('user_id', userId)
    .single();

  if (!connection) return null;

  const baseUrl = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  const url = `${baseUrl}/${connection.realm_id}/companyinfo/${connection.realm_id}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return <p className="text-sm text-red-600">Could not fetch company information.</p>;
  }

  const { CompanyInfo } = await response.json();

  return (
    <p className="text-sm text-gray-600">
      Company: <span className="font-semibold">{CompanyInfo.CompanyName}</span>
    </p>
  );
}