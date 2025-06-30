import { Timestamp } from 'firebase/firestore';

/**
 * Firestoreタイムスタンプを日本語形式の文字列に変換
 * @param timestamp - Firestore Timestamp、文字列、またはDateオブジェクト
 * @returns 日本語形式の日付文字列
 */
export function formatTimestamp(timestamp: Timestamp | string | Date | null | undefined): string {
  if (!timestamp) {
    return '未設定';
  }
  
  try {
    // Firestore Timestampオブジェクトの場合
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // Timestampオブジェクト（seconds/nanosecondsプロパティを持つ）の場合
    if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      const date = new Date((timestamp as any).seconds * 1000);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // 文字列の場合
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '無効な日付';
      }
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // Dateオブジェクトの場合
    if (timestamp instanceof Date) {
      if (isNaN(timestamp.getTime())) {
        return '無効な日付';
      }
      return timestamp.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // その他の場合
    return String(timestamp);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '日付エラー';
  }
}

/**
 * 詳細な日時形式でタイムスタンプを変換
 * @param timestamp - Firestore Timestamp、文字列、またはDateオブジェクト
 * @returns 詳細な日本語形式の日時文字列
 */
export function formatTimestampDetailed(timestamp: Timestamp | string | Date | null | undefined): string {
  if (!timestamp) {
    return '未設定';
  }
  
  try {
    let date: Date;
    
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date((timestamp as any).seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return String(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return '無効な日付';
    }
    
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting detailed timestamp:', error);
    return '日付エラー';
  }
} 