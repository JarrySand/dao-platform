// This layout will be used for authenticated pages.
// AuthGuard will be added in Phase 2 when the auth feature is complete.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen">{children}</main>;
}
