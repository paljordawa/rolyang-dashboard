// src/app/(dashboard)/royalties/page.tsx
import React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import RoyaltyManagerClient from './RoyaltyManagerClient';

export const dynamic = 'force-dynamic';

export default async function RoyaltiesPage() {
  // Fetch artists
  const { data: artistsObj, error: artistsError } = await supabaseAdmin
    .from('artists')
    .select('*')
    .order('name');
  const artists = artistsError ? [] : (artistsObj || []);

  // Fetch royalty payments history
  const { data: paymentsObj, error: paymentsError } = await supabaseAdmin
    .from('royalty_payments')
    .select('*')
    .order('created_at', { ascending: false });
  const payments = paymentsError ? [] : (paymentsObj || []);

  // Fetch tracks to see catalogs
  const { data: tracksObj } = await supabaseAdmin
    .from('tracks')
    .select('id, title, artist_id');
  const tracks = tracksObj || [];

  // Fetch play counts grouped by track or just all plays from track_plays
  const { data: playsObj } = await supabaseAdmin
    .from('track_plays')
    .select('id, track_id, played_at');
  const plays = playsObj || [];

  return (
    <div className="w-full py-8 px-6 space-y-6">
      <RoyaltyManagerClient
        initialArtists={artists}
        initialPayments={payments}
        allTracks={tracks}
        allPlays={plays}
      />
    </div>
  );
}
