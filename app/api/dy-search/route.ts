import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();

  const response = await fetch('https://recs-search.dynamicyield.com/search/8770123', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
