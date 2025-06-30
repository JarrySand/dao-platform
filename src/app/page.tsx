import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            合同会社型DAO 定款・規程 公開プラットフォーム
          </h1>
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            DAOの定款・規程を一元的に公開・管理し、Ethereum Attestation Service (EAS) を使って改ざん不能性を保証するプラットフォームです。
          </p>

          <div className="flex justify-center">
            <Link 
              href="/daos" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors duration-200 hover:shadow-xl"
            >
              DAO一覧を見る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
