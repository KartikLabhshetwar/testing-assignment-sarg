'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Calculator, 
  FileText,
  Settings,
  LogOut,
  BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { authClient } from '@/lib/auth-client';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Calculator', href: '/calculator', icon: Calculator },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
          },
        },
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="flex flex-col w-72 bg-white border-r-4 border-black h-full">
      {/* Logo */}
      <div className="p-8 border-b-4 border-black">
        <div className="flex items-center">
          <BarChart3 className="h-10 w-10 text-black mr-4" />
          <h2 className="text-xl font-bold uppercase tracking-wide">BI Dashboard</h2>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-6 py-8 space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={cn(
                'flex items-center px-4 py-4 text-base font-bold uppercase tracking-wide transition-all border-4',
                isActive
                  ? 'bg-black text-white border-black'
                  : 'text-black hover:bg-gray-100 border-transparent hover:border-gray-300'
              )}
            >
              <item.icon className="mr-4 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div className="p-6 border-t-4 border-black space-y-3">
        <Button variant="ghost" className="w-full justify-start text-black hover:text-black">
          <Settings className="mr-4 h-5 w-5" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-black hover:text-black"
          onClick={handleSignOut}
        >
          <LogOut className="mr-4 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
