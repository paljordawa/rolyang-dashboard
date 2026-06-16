import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tags, Music } from 'lucide-react';
import GenreManagerClient from './GenreManagerClient';

export default async function GenresPage() {
  // Fetch existing genres
  const { data: genresObj, error: genresError } = await supabaseAdmin.from('genres').select('*').order('name');
  const genres = genresError ? [] : (genresObj || []);

  // Fetch track_genres
  const { data: trackGenresObj } = await supabaseAdmin.from('track_genres').select('*');
  const trackGenres = trackGenresObj || [];

  // Fetch all tracks
  const { data: tracksObj } = await supabaseAdmin.from('tracks').select('id, title, artist_id');
  let tracks = tracksObj || [];
  
  // Attach genre_ids to tracks
  tracks = tracks.map((t: any) => {
    const matchingGids = trackGenres.filter((tg: any) => tg.track_id === t.id).map((tg: any) => tg.genre_id);
    return { ...t, genre_ids: matchingGids };
  });

  return (
    <div className="w-full py-10 px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Genre <span className="text-gradient">Management</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Organize your catalog by creating and managing music genres.
        </p>
      </div>

      <GenreManagerClient initialGenres={genres} allTracks={tracks} />
    </div>
  );
}
