"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Music, Upload, UserCircle, LogOut, Languages, BarChart2, CheckSquare, User, DollarSign, Megaphone, Sliders } from 'lucide-react';
import { logout } from '@/app/login/actions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'artist', 'contributor'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['admin', 'artist'] },
  { label: 'Upload Media', href: '/upload', icon: Upload, roles: ['admin', 'artist'] },
  { label: 'Discography', href: '/discography', icon: Music, roles: ['artist'] },
  { label: 'Lyrics Sync', href: '/lyrics', icon: Languages, roles: ['admin', 'artist', 'contributor'] },
  { label: 'Profile Settings', href: '/profile', icon: User, roles: ['artist', 'contributor'] },
  { label: 'Curation Hub', href: '/curation', icon: Sliders, roles: ['admin'] },
  { label: 'Moderation Queue', href: '/moderation', icon: CheckSquare, roles: ['admin'] },
  { label: 'Users', href: '/users', icon: UserCircle, roles: ['admin'] },
  { label: 'Artists & Contributors', href: '/artists', icon: Users, roles: ['admin'] },
  { label: 'Royalties', href: '/royalties', icon: DollarSign, roles: ['admin'] },
  { label: 'Broadcasts', href: '/notifications', icon: Megaphone, roles: ['admin'] },
];

interface SidebarProps {
  role: string;
  displayName: string;
  avatarUrl?: string;
}

export default function Sidebar({ role, displayName, avatarUrl }: SidebarProps) {
  const currentPath = usePathname();

  // Filter navigation items by role
  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-20 shrink-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <img src="/rolyang-logo.svg" alt="Rolyang Logo" className="h-8 w-auto" />
        <h1 className="text-xl font-bold tracking-tight text-white">Rolyang Studio</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <ul className="space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-fuchsia-400' : ''}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3 px-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/20 border border-white/10 shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="capitalize">{displayName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate capitalize">{displayName}</span>
            <span className="text-xs text-zinc-500 capitalize">{role === 'admin' ? 'Superuser' : role}</span>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
