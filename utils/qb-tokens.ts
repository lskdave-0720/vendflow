// utils/qb-tokens.ts
import { createClient } from '@/utils/supabase/server';

interface QBTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO date
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Get current tokens from DB
  const { data: connection } = await supabase
    .from('quickbooks_connections')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (!connection) return null;

  const { access_token, refresh_token, expires_at } = connection;

  // If token is still valid (with 5 min buffer), return it
  const expirationDate = new Date(expires_at);
  if (expirationDate.getTime() > Date.now() + 5 * 60 * 1000) {
    return access_token;
  }

  // Token expired – refresh it
  const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.NEXT_PUBLIC_QB_CLIENT_ID}:${process.env.NEXT_PUBLIC_QB_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    }),
  });

  if (!tokenResponse.ok) {
    console.error('Token refresh failed');
    return null;
  }

  const newTokens = await tokenResponse.json();
  const { access_token: newAccessToken, refresh_token: newRefreshToken, expires_in } = newTokens;

  // Update DB with new tokens
  const { error } = await supabase
    .from('quickbooks_connections')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update tokens:', error);
    return null;
  }

  return newAccessToken;
}