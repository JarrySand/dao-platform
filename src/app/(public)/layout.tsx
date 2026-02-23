import { Sidebar, MobileHeader, ContentHeader } from '@/shared/components/layout/Sidebar';
import { Footer } from '@/shared/components/layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <ContentHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
