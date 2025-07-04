
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    // Prevent rendering dashboard for logged-out users, even for a flash
    // A more sophisticated skeleton loader could be used here
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Do not show sidebar on the upload page for mobile
  const showSidebar = !(pathname === '/upload' && (typeof window !== 'undefined' && window.innerWidth < 768));

  return (
    <SidebarProvider>
      {showSidebar && (
        <Sidebar>
          <SidebarNav />
        </Sidebar>
      )}
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:justify-end">
          <Link href="/upload">
            <Button className="md:hidden">Upload Receipt</Button>
          </Link>
          <div className="md:hidden">
            {/* Mobile menu trigger will be handled by the sidebar component */}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
