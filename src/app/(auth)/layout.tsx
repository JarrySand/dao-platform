'use client';

import { Sidebar, MobileHeader, ContentHeader } from '@/shared/components/layout/Sidebar';
import { Footer } from '@/shared/components/layout';
import { AuthGuard } from '@/features/auth';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <ContentHeader />
        <main className="flex-1">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Footer />
      </div>
    </div>
  );
}
