async function digestToHex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return digestToHex(buffer);
}

export async function calculateTextHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  return digestToHex(data.buffer as ArrayBuffer);
}

export function formatHashForBlockchain(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}
