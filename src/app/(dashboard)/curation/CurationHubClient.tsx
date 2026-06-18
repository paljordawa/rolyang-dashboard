// src/app/(dashboard)/curation/CurationHubClient.tsx
"use client";

import React, { useState } from 'react';
import { ListMusic, Image as ImageIcon, Tags, Sliders } from 'lucide-react';
import PlaylistManagerClient from '../playlists/PlaylistManagerClient';
import BannerManagerClient from '../banners/BannerManagerClient';
import GenreManagerClient from '../genres/GenreManagerClient';

interface CurationHubClientProps {
  playlists: any[];
  tracks: any[];
  artists: any[];
  banners: any[];
  albums: any[];
  genres: any[];
  trackGenres: any[];
}

export default function CurationHubClient({
  playlists,
  tracks,
  artists,
  banners,
  albums,
  genres,
  trackGenres
}: CurationHubClientProps) {
  const [activeTab, setActiveTab] = useState<'playlists' | 'banners' | 'genres'>('playlists');

  // Pre-map tracks with their genre IDs for the GenreManagerClient
  const mappedTracks = React.useMemo(() => {
    return tracks.map((t: any) => {
      const matchingGids = trackGenres
        .filter((tg: any) => tg.track_id === t.id)
        .map((tg: any) => tg.genre_id);
      return { ...t, genre_ids: matchingGids };
    });
  }, [tracks, trackGenres]);

  return (
    <div className="space-y-6">
      {/* Curation Hub Tab Selectors */}
      <div className="flex justify-end border-b border-white/10 pb-4 mb-6">
        {/* Curation Tabs */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl gap-2 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'playlists' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
          >
            <ListMusic className="w-4 h-4" />
            Playlists
          </button>
          
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'banners' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
          >
            <ImageIcon className="w-4 h-4" />
            Banners
          </button>

          <button
            onClick={() => setActiveTab('genres')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${activeTab === 'genres' ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 border border-violet-500/20 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]' : 'text-zinc-400 hover:text-white border border-transparent'}`}
          >
            <Tags className="w-4 h-4" />
            Genres
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'playlists' && (
          <PlaylistManagerClient
            initialPlaylists={playlists}
            allTracks={tracks}
            allArtists={artists}
          />
        )}

        {activeTab === 'banners' && (
          <BannerManagerClient
            initialBanners={banners}
            artists={artists}
            albums={albums}
            tracks={tracks}
            playlists={playlists}
          />
        )}

        {activeTab === 'genres' && (
          <GenreManagerClient
            initialGenres={genres}
            allTracks={mappedTracks}
          />
        )}
      </div>
    </div>
  );
}
