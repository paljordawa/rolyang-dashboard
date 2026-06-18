"use client";

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import React from 'react';

export default function HeaderTitle() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('listener');

  useEffect(() => {
    async function fetchUserRole() {
      // Check rolyang_admin_session cookie first
      const isAdminCookie = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('rolyang_admin_session='))
        : null;
      if (isAdminCookie?.split('=')[1] === 'true') {
        setRole('admin');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRole(user.user_metadata?.role || 'listener');
      }
    }
    fetchUserRole();
  }, [pathname]);

  const getHeaderData = (path: string): { title: React.ReactNode; blurb: string } => {
    if (path === '/') {
      if (role === 'admin') {
        return {
          title: <>Dashboard <span className="text-gradient">Overview</span></>,
          blurb: 'Welcome back to the Rolyang control center. Here is your platform at a glance.'
        };
      }
      if (role === 'artist') {
        return {
          title: <>Artist <span className="text-gradient">Studio</span></>,
          blurb: 'Manage your releases, synchronize lyrics, and check your reach.'
        };
      }
      if (role === 'contributor') {
        return {
          title: <>Contributor <span className="text-gradient">Workspace</span></>,
          blurb: 'Help translate Tibetan tracks and synchronize lyric timing.'
        };
      }
      return {
        title: <>Rolyang <span className="text-gradient">Studio</span></>,
        blurb: 'Manage your releases, check statistics, and synchronize lyrics.'
      };
    }
    
    if (path.startsWith('/analytics')) {
      if (role === 'admin') {
        return {
          title: <>Platform <span className="text-gradient">Analytics</span></>,
          blurb: 'Platform-wide performance statistics, growth charts, active promotions, and storage consumption.'
        };
      }
      return {
        title: <>Performance <span className="text-gradient">Analytics</span></>,
        blurb: 'Track your music catalog, followers, and engagement metrics.'
      };
    }

    if (path.startsWith('/upload')) {
      return {
        title: <>Upload <span className="text-gradient">Media</span></>,
        blurb: 'Publish new audio tracks, edit track details, and upload cover art.'
      };
    }

    if (path.startsWith('/discography')) {
      return {
        title: <>My <span className="text-gradient">Discography</span></>,
        blurb: 'Manage your albums, singles, and track metadata.'
      };
    }

    if (path.startsWith('/lyrics')) {
      return {
        title: <>Lyrics & <span className="text-gradient">Translation Sync</span></>,
        blurb: 'Supply line-by-line synchronized lyrics for the Rolyang audio player.'
      };
    }

    if (path.startsWith('/profile')) {
      return {
        title: <>Profile <span className="text-gradient">Settings</span></>,
        blurb: 'Update your stage name, biographical information, and profile picture.'
      };
    }

    if (path.startsWith('/moderation')) {
      return {
        title: <>Moderation <span className="text-gradient">Center</span></>,
        blurb: 'Review and moderate pending creator profiles, media uploads, and synchronized translations.'
      };
    }

    if (path.startsWith('/users')) {
      return {
        title: <>User <span className="text-gradient">Accounts</span></>,
        blurb: 'Manage registered user logins, monitor subscription levels, and perform account actions.'
      };
    }

    if (path.startsWith('/banners')) {
      return {
        title: <>Featured <span className="text-gradient">Banners</span></>,
        blurb: 'Manage the promotional banners that appear at the top of the main music app.'
      };
    }

    if (path.startsWith('/artists')) {
      if (path === '/artists/new') {
        return {
          title: <>Add New <span className="text-gradient">Artist</span></>,
          blurb: 'Expand your roster by onboarding new artist catalogs.'
        };
      }
      if (path !== '/artists' && path !== '/artists/') {
        return {
          title: <>Artist Profile <span className="text-gradient">Editing</span></>,
          blurb: 'Update profile name, bio, visual headers, and stats.'
        };
      }
      return {
        title: <>Artists & <span className="text-gradient">Contributors</span></>,
        blurb: 'Manage onboarding invite codes and organize your artist catalog.'
      };
    }

    if (path.startsWith('/genres')) {
      return {
        title: <>Genre <span className="text-gradient">Management</span></>,
        blurb: 'Organize your catalog by creating and managing music genres.'
      };
    }

    if (path.startsWith('/albums')) {
      if (path === '/albums' || path === '/albums/') {
        return {
          title: <>Album <span className="text-gradient">Directory</span></>,
          blurb: 'Manage all releases across your catalog.'
        };
      }
      return {
        title: <>Album <span className="text-gradient">Details</span></>,
        blurb: 'Manage track order, release details, and lyrics.'
      };
    }

    if (path.startsWith('/curation')) {
      return {
        title: <>Curation <span className="text-gradient">Hub</span></>,
        blurb: 'Manage promotional banners, curated public playlists, and system genres.'
      };
    }

    if (path.startsWith('/royalties')) {
      return {
        title: <>Royalty <span className="text-gradient">Ledger</span></>,
        blurb: 'Compute artist streaming royalties and record bank payout disbursements.'
      };
    }

    if (path.startsWith('/notifications')) {
      return {
        title: <>Push <span className="text-gradient">Broadcasts</span></>,
        blurb: 'Compose and dispatch notifications to creators or listener devices.'
      };
    }

    return {
      title: <>Rolyang <span className="text-gradient">Studio</span></>,
      blurb: 'Admin dashboard'
    };
  };

  const data = getHeaderData(pathname);

  return (
    <div className="flex items-baseline gap-3 flex-wrap py-1.5 max-w-[85%]">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-none shrink-0">
        {data.title}
      </h1>
      {data.blurb && (
        <div className="flex items-baseline gap-2.5 flex-wrap md:flex-nowrap">
          <span className="text-zinc-500 text-sm hidden md:inline select-none">|</span>
          <p className="text-zinc-400 text-xs md:text-sm font-normal leading-normal max-w-sm md:max-w-lg lg:max-w-3xl self-center" title={data.blurb}>
            {data.blurb}
          </p>
        </div>
      )}
    </div>
  );
}
