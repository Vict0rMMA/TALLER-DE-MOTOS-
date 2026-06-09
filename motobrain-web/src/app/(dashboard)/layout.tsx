import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { SplashOverlay } from '@/components/auth/SplashOverlay';

const NotificationWatcher = dynamic(
  () =>
    import('@/components/layout/NotificationWatcher').then((m) => m.NotificationWatcher),
  { ssr: false },
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-primary">
      <SplashOverlay />
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:p-5 md:p-7 md:pb-7">
          {children}
        </main>
        <MobileNav />
      </div>
      <NotificationWatcher />
    </div>
  );
}
