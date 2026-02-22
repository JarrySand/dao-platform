import { getIPFSUrl } from './gateway';

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

export interface IPFSUploadResult {
  cid: string;
  gatewayUrl: string;
}

export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  if (!PINATA_JWT) {
    throw new Error(
      'NEXT_PUBLIC_PINATA_JWT is not set. Configure the environment variable to enable IPFS uploads.',
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(PINATA_UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const cid: string = result.IpfsHash;

      return {
        cid,
        gatewayUrl: getIPFSUrl(cid),
      };
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

export async function fetchFromIPFS(cid: string): Promise<Response> {
  const url = getIPFSUrl(cid);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch from IPFS (${response.status}): ${cid}`);
  }

  return response;
}
