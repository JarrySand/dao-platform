export default function Loading() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">DAO一覧</h1>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </div>
    </main>
  );
} 