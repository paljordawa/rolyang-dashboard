"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Disc3, Music, Upload, Tags, Image as ImageIcon, UserCircle, LogOut } from 'lucide-react';
import { logout } from '@/app/login/actions';

const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Users', href: '/users', icon: UserCircle },
  { label: 'Banners', href: '/banners', icon: ImageIcon },
  { label: 'Artists', href: '/artists', icon: Users },
  { label: 'Genres', href: '/genres', icon: Tags },
  { label: 'Upload Media', href: '/upload', icon: Upload },
];

export default function Sidebar() {
  const currentPath = usePathname();

  return (
    <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col shadow-2xl z-20">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <img src="/rolyang-logo.svg" alt="Rolyang Logo" className="h-8 w-auto" />
        <h1 className="text-xl font-bold tracking-tight text-white">Rolyang Admin</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] border border-violet-500/20' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
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
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/20 border border-white/10">A</div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Admin</span>
            <span className="text-xs text-zinc-400">Superuser</span>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
