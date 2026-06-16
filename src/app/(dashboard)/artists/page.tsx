import { supabaseAdmin } from '@/lib/supabase';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import ArtistDirectoryView from '@/components/ArtistDirectoryView';

export default async function ArtistsPage() {
  const { data: artists, error } = await supabaseAdmin
    .from('artists')
    .select('*')
    .order('name');

  if (error) {
    console.error("Error fetching artists:", error);
  }

  return (
    <div className="w-full w-full py-8 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Artist Directory</h1>
          <p className="text-zinc-500 mt-1 text-base">Manage your artist roster.</p>
        </div>
        <Link href="/artists/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-indigo-600 text-white shadow hover:bg-indigo-700 h-9 px-4 py-2">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Artist
        </Link>
      </div>

      <ArtistDirectoryView artists={artists || []} />
    </div>
  );
}
