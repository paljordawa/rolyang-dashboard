import { supabaseAdmin } from '@/lib/supabase';
import ArtistsAndContributorsClient from './ArtistsAndContributorsClient';

export default async function ArtistsPage() {
  // Fetch existing artists
  const { data: artists, error: artistsError } = await supabaseAdmin
    .from('artists')
    .select('*')
    .order('name');

  if (artistsError) {
    console.error("Error fetching artists:", artistsError);
  }

  // Fetch albums, tracks, and follows to compute counts dynamically
  const { data: albums } = await supabaseAdmin.from('albums').select('id, artist_id');
  const { data: tracks } = await supabaseAdmin.from('tracks').select('id, artist_id, album_id');
  const { data: follows } = await supabaseAdmin.from('user_follows').select('artist_id');

  const enrichedArtists = (artists || []).map((artist: any) => {
    const totalAlbums = albums ? albums.filter((a: any) => a.artist_id === artist.id).length : 0;
    const totalSingles = tracks ? tracks.filter((t: any) => t.artist_id === artist.id && !t.album_id).length : 0;
    const followersCount = follows ? follows.filter((f: any) => f.artist_id === artist.id).length : 0;

    return {
      ...artist,
      total_albums: totalAlbums,
      total_singles: totalSingles,
      followers_count: followersCount
    };
  });

  // Fetch invite codes joined with profiles email
  const { data: codesObj } = await supabaseAdmin
    .from('invite_codes')
    .select('*, user_profiles(email)')
    .order('created_at', { ascending: false });
  const inviteCodes = codesObj || [];

  return (
    <div className="w-full py-8 px-6">
      <ArtistsAndContributorsClient 
        initialArtists={enrichedArtists} 
        initialInviteCodes={inviteCodes}
      />
    </div>
  );
}
