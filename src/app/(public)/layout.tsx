import { Navbar } from '@/shared/components/layout';
import { Footer } from '@/shared/components/layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
