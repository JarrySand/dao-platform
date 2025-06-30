import { NextRequest, NextResponse } from 'next/server';

const EAS_GRAPHQL_ENDPOINT = 'https://sepolia.easscan.org/graphql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔥 EAS Proxy: Forwarding GraphQL query:', body);

    const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    console.log('🔥 EAS Proxy: GraphQL response:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('🔥 EAS Proxy: Error:', error);
    return NextResponse.json(
      { errors: [{ message: 'Proxy request failed' }] },
      { status: 500 }
    );
  }
} 