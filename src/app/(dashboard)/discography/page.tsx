import { createClient, createAdminClient } from '@/lib/server';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Disc3, Users, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ArtistMediaManagerClient from '@/app/(dashboard)/artists/[id]/ArtistMediaManagerClient';

export default async function DiscographyPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role || 'listener';
  const artistId = user.user_metadata?.artist_id || null;

  if (role !== 'artist' || !artistId) {
    redirect('/');
  }

  // Fetch artist details
  const { data: artist, error: artistError } = await adminSupabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .single();

  if (artistError || !artist) {
    redirect('/');
  }

  // Fetch artist's albums
  const { data: albums } = await adminSupabase
    .from('albums')
    .select('*')
    .eq('artist_id', artistId)
    .order('year', { ascending: false });

  // Fetch artist's tracks joined with track_genres
  const { data: tracks } = await adminSupabase
    .from('tracks')
    .select('*, track_genres(genre_id)')
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false });

  // Fetch all genres for editing tracks
  const { data: genres } = await adminSupabase
    .from('genres')
    .select('*')
    .order('name');

  return (
    <div className="w-full py-8 px-6 space-y-6">
      


      <ArtistMediaManagerClient 
        artistId={artist.id} 
        userId={user.id}
        artistName={artist.name}
        artistBio={artist.bio || ''}
        artistImageUrl={artist.image_url || ''}
        artistFollowers={artist.followers || '0'}
        initialAlbums={albums || []} 
        initialTracks={tracks || []} 
        genres={genres || []}
      />
    </div>
  );
}
