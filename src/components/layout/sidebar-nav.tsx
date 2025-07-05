
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  Settings,
  Gem,
  PiggyBank,
  LogOut,
  Landmark,
} from 'lucide-react';
import type { User } from 'firebase/auth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/receipts', icon: Receipt, label: 'Receipts' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/tax-report', icon: Landmark, label: 'Tax Report' },
  { href: '/upload', icon: Upload, label: 'Upload' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, isPremium } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const getAvatarFallback = (user: User | null) => {
    if (!user) return 'U';
    if (user.displayName) return user.displayName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold">Recietly</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname.startsWith(item.href)}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="gap-4">
        {!isPremium && (
            <Card className="bg-primary/10 text-center">
                <CardHeader className="p-4">
                    <CardTitle className="text-base flex items-center justify-center gap-2">
                        <Gem className="text-primary"/> Upgrade to Pro
                    </CardTitle>
                    <CardDescription>
                        Unlock advanced features and get unlimited receipt uploads.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Link href="/settings">
                        <Button className="w-full" size="sm">Upgrade</Button>
                    </Link>
                </CardContent>
            </Card>
        )}
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt="User" />
            <AvatarFallback>{getAvatarFallback(user)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">{user?.displayName || 'User'}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={handleLogout} title="Log Out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
