import { supabaseAdmin } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Disc3, Users, ChevronLeft, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ArtistMediaManagerClient from './ArtistMediaManagerClient';

export default async function ArtistDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch artist details
  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();

  if (artistError || !artist) {
    redirect('/artists');
  }

  // Fetch artist's albums
  const { data: albums } = await supabaseAdmin
    .from('albums')
    .select('*')
    .eq('artist_id', id)
    .order('year', { ascending: false });

  // Fetch artist's tracks
  const { data: tracks } = await supabaseAdmin
    .from('tracks')
    .select('*')
    .eq('artist_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-6">
      
      <div className="mb-6">
        <Link href="/artists" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Artists
        </Link>
      </div>

      {/* Compact Header */}
      <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
        
        {/* Small 100px Profile Image */}
        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/10 flex items-center justify-center relative z-10">
          {artist.image_url ? (
            <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="w-8 h-8 text-zinc-300" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white truncate">{artist.name}</h1>
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 border border-white/10">
              {artist.followers ? parseInt(artist.followers).toLocaleString() : '0'} Followers
            </span>
          </div>
          
          {artist.bio ? (
            <p className="text-zinc-400 text-sm leading-relaxed max-w-4xl line-clamp-2">
              {artist.bio}
            </p>
          ) : (
            <p className="text-zinc-400 text-sm italic">No biography provided.</p>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 relative z-10 w-full md:w-auto">
          <Link href={`/artists/${artist.id}/edit`} className="w-full md:w-auto">
            <Button size="sm" variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-colors">
              Edit Profile
            </Button>
          </Link>
          <Link href={`/upload?artist=${artist.id}`} className="w-full md:w-auto">
            <Button size="sm" className="w-full btn-gradient border-0">
              <Music className="w-4 h-4 mr-2" /> Upload Release
            </Button>
          </Link>
        </div>
        
        {/* Very faint background tint based on artist presence */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-50 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-1">
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white mb-1">{tracks?.length || 0}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Tracks</span>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white mb-1">{albums?.length || 0}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Albums</span>
          </div>
        </div>
      </div>

      <ArtistMediaManagerClient 
        artistId={artist.id} 
        initialAlbums={albums || []} 
        initialTracks={tracks || []} 
      />

    </div>
  );
}

