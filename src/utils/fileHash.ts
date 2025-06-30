/**
 * ファイルハッシュ計算のためのユーティリティ関数
 */

/**
 * ArrayBufferからSHA-256ハッシュを計算する
 * @param buffer 計算対象のArrayBuffer
 * @returns hex形式のハッシュ文字列
 */
export async function calculateSHA256FromBuffer(buffer: ArrayBuffer): Promise<string> {
  // Web Crypto APIを使用してハッシュを計算
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // ArrayBufferをhex文字列に変換
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * FileからSHA-256ハッシュを計算する
 * @param file 計算対象のFile
 * @returns hex形式のハッシュ文字列
 */
export async function calculateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error('ファイルの読み込みに失敗しました');
        }
        
        const buffer = event.target.result as ArrayBuffer;
        const hash = await calculateSHA256FromBuffer(buffer);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 文字列からSHA-256ハッシュを計算する
 * @param content ハッシュを計算するテキスト
 * @returns hex形式のハッシュ文字列
 */
export async function calculateTextHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  return calculateSHA256FromBuffer(data.buffer as ArrayBuffer);
}

/**
 * ハッシュの検証（比較）を行う
 * @param storedHash 保存されているハッシュ
 * @param computedHash 計算されたハッシュ
 * @returns 一致する場合はtrue
 */
export function verifyHash(storedHash: string, computedHash: string): boolean {
  return storedHash.toLowerCase() === computedHash.toLowerCase();
}

/**
 * bytes32形式のハッシュを生成（ethers.jsのkeccak256互換）
 * @param hash 16進数ハッシュ文字列
 * @returns 0xプレフィックス付きバイト形式のハッシュ
 */
export function formatHashForBlockchain(hash: string): string {
  // 0xプレフィックスを追加（なければ）
  return hash.startsWith('0x') ? hash : `0x${hash}`;
} 