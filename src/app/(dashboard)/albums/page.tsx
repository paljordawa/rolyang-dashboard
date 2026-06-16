import { supabaseAdmin } from '@/lib/supabase';
import { Upload } from 'lucide-react';
import Link from 'next/link';
import AlbumDirectoryView from '@/components/AlbumDirectoryView';

export default async function AlbumsPage() {
  const { data: albumsRaw, error } = await supabaseAdmin
    .from('albums')
    .select(`
      *,
      artists (
        name
      )
    `)
    .order('year', { ascending: false });

  if (error) {
    console.error("Error fetching albums:", error);
  }

  // Flatten the artist name for the React component
  const albums = (albumsRaw || []).map((album: any) => ({
    ...album,
    artist_name: album.artists?.name
  }));

  return (
    <div className="w-full w-full py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Album Directory</h1>
          <p className="text-zinc-500 mt-1 text-base">Manage all releases across your catalog.</p>
        </div>
        <Link href="/upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2">
          <Upload className="w-4 h-4 mr-2" />
          New Release
        </Link>
      </div>

      <AlbumDirectoryView albums={albums} />
    </div>
  );
}
