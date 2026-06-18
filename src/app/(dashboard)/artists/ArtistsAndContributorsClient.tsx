"use client";

import React, { useState } from 'react';
import { Users, Ticket, UserPlus } from 'lucide-react';
import Link from 'next/link';
import ArtistDirectoryView from '@/components/ArtistDirectoryView';
import InviteCodesManager from '../users/InviteCodesManager';

interface Artist {
  id: string;
  name: string;
  image_url: string | null;
  followers: string | null;
  total_albums?: number;
  total_singles?: number;
  followers_count?: number;
}

interface InviteCode {
  code: string;
  role: 'artist' | 'contributor';
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  user_profiles?: {
    email: string;
  } | null;
}

interface Props {
  initialArtists: Artist[];
  initialInviteCodes: InviteCode[];
}

export default function ArtistsAndContributorsClient({
  initialArtists,
  initialInviteCodes
}: Props) {
  const [activeTab, setActiveTab] = useState<'roster' | 'codes'>('roster');

  return (
    <div className="space-y-8">
      {/* Navigation Tabs & Actions in One Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        {/* Custom Glassmorphic Tabs Navigation */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-full md:w-fit">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] border border-violet-500/20'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Artist Profiles
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
              activeTab === 'codes'
                ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] border border-violet-500/20'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Invite Codes
          </button>
        </div>

        {activeTab === 'roster' && (
          <Link 
            href="/artists/new" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-all bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 h-9 px-4 py-2 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" />
            Add Artist
          </Link>
        )}
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <ArtistDirectoryView artists={initialArtists} />
          </div>
        )}

        {activeTab === 'codes' && (
          <div className="space-y-4">
            <InviteCodesManager initialCodes={initialInviteCodes} />
          </div>
        )}
      </div>
    </div>
  );
}
