import { createClient, createAdminClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import AlbumDetailsClient from './AlbumDetailsClient';

export default async function AlbumDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Get current logged in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const role = user.user_metadata?.role || 'listener';
  const artistId = user.user_metadata?.artist_id || null;

  // 2. Fetch the album
  const { data: album, error: albumError } = await adminSupabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();

  if (albumError || !album) {
    redirect('/discography');
  }

  // 3. Verify permissions (must be admin, or the artist who owns this album)
  if (role !== 'admin' && album.artist_id !== artistId) {
    redirect('/discography');
  }

  // 4. Fetch tracks belonging to this album
  const { data: tracks } = await adminSupabase
    .from('tracks')
    .select('*, track_genres(genre_id)')
    .eq('album_id', id);

  // 5. Fetch all genres for editing tracks
  const { data: genres } = await adminSupabase
    .from('genres')
    .select('*')
    .order('name');

  return (
    <AlbumDetailsClient
      album={album}
      initialTracks={tracks || []}
      genres={genres || []}
      artistId={album.artist_id}
      userRole={role}
    />
  );
}
