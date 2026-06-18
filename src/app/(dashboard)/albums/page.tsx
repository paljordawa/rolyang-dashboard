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
    <div className="w-full py-8 px-6 space-y-6">
      <div className="flex justify-end items-center pb-4 border-b border-white/10 flex-wrap gap-4">
        <Link href="/upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold transition-all bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 h-9 px-4 py-2 hover:scale-[1.02] active:scale-[0.98] shrink-0">
          <Upload className="w-3.5 h-3.5 mr-2" />
          New Release
        </Link>
      </div>

      <AlbumDirectoryView albums={albums} />
    </div>
  );
}
