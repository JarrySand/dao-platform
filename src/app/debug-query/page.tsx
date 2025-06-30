'use client';

import { useState } from 'react';
import { queryDocumentsByDAO } from '@/services/documentQueryService';

export default function DebugQueryPage() {
  const [daoUID, setDaoUID] = useState('0x35f18f6f2818a833b9b5c7e77e3e83b9315db0e9976456d101766ec1bf4385f3');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      console.log('Starting debug query for DAO UID:', daoUID);
      const result = await queryDocumentsByDAO(daoUID);
      setResults(result);
      console.log('Debug query result:', result);
    } catch (error) {
      console.error('Debug query error:', error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Document Query Debug</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            DAO Attestation UID
          </label>
          <input
            type="text"
            value={daoUID}
            onChange={(e) => setDaoUID(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="0x..."
          />
        </div>
        
        <button
          onClick={handleQuery}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Querying...' : 'Test Query'}
        </button>
        
        {results && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Open your browser's Developer Tools (F12)</li>
          <li>Go to the Console tab</li>
          <li>Click "Test Query" to see detailed logs</li>
          <li>Check if documents are being found and parsed correctly</li>
        </ol>
      </div>
    </div>
  );
} 