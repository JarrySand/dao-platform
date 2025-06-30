export default function Loading() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">DAO一覧</h1>
        
        {/* ローディングスケルトン */}
        <div className="space-y-6">
          {/* 検索・フィルター部分のスケルトン */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-48">
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-48">
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>

          {/* テーブル部分のスケルトン */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b">
              <div className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ローディングメッセージ */}
          <div className="text-center py-8">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-lg text-gray-600">DAOを読み込んでいます...</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              EAS、API、ローカルストレージから順次データを取得中
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 