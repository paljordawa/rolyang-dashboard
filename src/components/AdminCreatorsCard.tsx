"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, User, CalendarDays, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ArtistItem {
  id: string;
  name: string;
  image_url: string;
  created_at: string;
}

interface ContributorItem {
  id: string;
  email: string;
  created_at: string;
}

interface AdminCreatorsCardProps {
  artists: ArtistItem[];
  contributors: ContributorItem[];
}

type TabType = 'artists' | 'contributors';

export default function AdminCreatorsCard({ artists, contributors }: AdminCreatorsCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('artists');

  return (
    <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
      {/* Header with Tabs */}
      <div className="bg-black/40 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between px-4 pt-4 sm:pt-0">
        <div className="flex border-b sm:border-b-0 border-white/5 pb-2 sm:pb-0 gap-4 h-12 items-end">
          <button
            type="button"
            onClick={() => setActiveTab('artists')}
            className={`pb-3 text-sm font-semibold transition-colors relative px-2 cursor-pointer ${activeTab === 'artists' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Artists ({artists.length})
            {activeTab === 'artists' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contributors')}
            className={`pb-3 text-sm font-semibold transition-colors relative px-2 cursor-pointer ${activeTab === 'contributors' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Contributors ({contributors.length})
            {activeTab === 'contributors' && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            )}
          </button>
        </div>
        
        {activeTab === 'artists' ? (
          <Link href="/artists" className="text-xs text-indigo-400 hover:text-indigo-300 py-3 flex items-center gap-1 font-medium">
            View All Artists <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link href="/users" className="text-xs text-indigo-400 hover:text-indigo-300 py-3 flex items-center gap-1 font-medium">
            Manage Users <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <CardContent className="p-0 min-h-[300px] flex flex-col">
        {activeTab === 'artists' ? (
          artists.length > 0 ? (
            <div className="divide-y divide-white/5 flex-1">
              {artists.map((artist) => (
                <Link key={artist.id} href={`/artists/${artist.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 font-bold text-lg">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{artist.name}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-zinc-600" />
                      Joined {artist.created_at ? new Date(artist.created_at).toLocaleDateString() : 'Legacy'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-20 text-indigo-400" />
              <p className="text-sm">No artists found in the system.</p>
            </div>
          )
        ) : (
          contributors.length > 0 ? (
            <div className="divide-y divide-white/5 flex-1">
              {contributors.map((contrib) => {
                const namePrefix = contrib.email ? contrib.email.split('@')[0] : 'Contributor';
                return (
                  <div key={contrib.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/10 shrink-0 flex items-center justify-center text-fuchsia-300 font-bold text-lg uppercase">
                      {namePrefix.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate capitalize">{namePrefix}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 select-all">{contrib.email}</p>
                      <p className="text-[10px] text-zinc-600 truncate mt-0.5 flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-zinc-700" />
                        Added {contrib.created_at ? new Date(contrib.created_at).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-500 text-center">
              <User className="w-10 h-10 mx-auto mb-3 opacity-20 text-fuchsia-400" />
              <p className="text-sm">No contributors registered yet.</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
