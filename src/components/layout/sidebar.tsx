import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Settings,
  Wine,
  Plus,
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      title: 'Add Products',
      icon: Plus,
      href: '/reviews/gather',
    },
    {
      title: 'Reviews',
      icon: Search,
      href: '/reviews',
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      href: '/analytics',
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/profile',
    },
  ];

  return (
    <div
      className={cn(
        'pb-12 min-h-screen border-r bg-background w-64',
        className
      )}
      {...props}
    >
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 px-2">
            <Wine className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Spoiled Vine
            </h2>
          </div>
        </div>
        <div className="px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2',
                  isActive(item.href) && 'bg-secondary'
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}