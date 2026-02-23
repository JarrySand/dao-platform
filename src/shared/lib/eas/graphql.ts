import { CHAIN_CONFIG } from '@/config/chains';

const EAS_GRAPHQL_ENDPOINT = CHAIN_CONFIG.sepolia.eas.graphqlEndpoint;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function executeEASQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(EAS_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`EAS GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors?.length) {
        throw new Error(`EAS GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BASE_DELAY_MS * Math.pow(2, attempt)),
        );
      }
    }
  }

  throw lastError;
}
