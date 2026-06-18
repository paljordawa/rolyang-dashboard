// src/app/(dashboard)/curation/page.tsx
import React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import CurationHubClient from './CurationHubClient';

export const dynamic = 'force-dynamic';

export default async function CurationPage() {
  const [
    playlistsRes,
    tracksRes,
    artistsRes,
    bannersRes,
    albumsRes,
    genresRes,
    trackGenresRes
  ] = await Promise.all([
    supabaseAdmin.from('playlists').select('*').order('name'),
    supabaseAdmin.from('tracks').select('*').order('title'),
    supabaseAdmin.from('artists').select('id, name').order('name'),
    supabaseAdmin.from('banners').select('*').order('sort_order'),
    supabaseAdmin.from('albums').select('id, title, artist_id').order('title'),
    supabaseAdmin.from('genres').select('*').order('name'),
    supabaseAdmin.from('track_genres').select('*')
  ]);

  const playlists = playlistsRes.error ? [] : (playlistsRes.data || []);
  const tracks = tracksRes.error ? [] : (tracksRes.data || []);
  const artists = artistsRes.error ? [] : (artistsRes.data || []);
  const banners = bannersRes.error ? [] : (bannersRes.data || []);
  const albums = albumsRes.error ? [] : (albumsRes.data || []);
  const genres = genresRes.error ? [] : (genresRes.data || []);
  const trackGenres = trackGenresRes.error ? [] : (trackGenresRes.data || []);

  return (
    <div className="w-full py-8 px-6 space-y-6">
      <CurationHubClient
        playlists={playlists}
        tracks={tracks}
        artists={artists}
        banners={banners}
        albums={albums}
        genres={genres}
        trackGenres={trackGenres}
      />
    </div>
  );
}
