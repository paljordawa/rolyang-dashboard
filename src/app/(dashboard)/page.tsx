import { supabaseAdmin } from '@/lib/supabase';
import { Users, Disc3, Music, Upload, Library, TrendingUp, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  // Fetch initial stats from Supabase on the server
  const { count: usersCountObj, error: usersError } = await supabaseAdmin.from('auth.users').select('*', { count: 'exact', head: true });
  const usersCount = usersError ? 0 : usersCountObj;
  const { count: artistsCount } = await supabaseAdmin.from('artists').select('*', { count: 'exact', head: true });
  const { count: albumsCount } = await supabaseAdmin.from('albums').select('*', { count: 'exact', head: true });
  const { count: tracksCount } = await supabaseAdmin.from('tracks').select('*', { count: 'exact', head: true });

  // Fetch recent tracks
  const { data: recentTracksObj } = await supabaseAdmin
    .from('tracks')
    .select('id, title, artist_id, duration, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  const recentTracks = recentTracksObj || [];

  // Fetch recent artists
  const { data: recentArtistsObj } = await supabaseAdmin
    .from('artists')
    .select('id, name, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(4);
  const recentArtists = recentArtistsObj || [];

  return (
    <div className="max-w-6xl mx-auto py-10 px-8">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Dashboard <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">Welcome back to the Rolyang control center. Here is your platform at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/upload">
            <Button className="btn-gradient border-0 shadow-lg shadow-indigo-500/20">
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Artists</CardTitle>
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white">{artistsCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Albums</CardTitle>
            <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <Disc3 className="h-4 w-4 text-fuchsia-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white">{albumsCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Tracks</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Music className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white">{tracksCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Registered Users</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white">{usersCount === 0 ? 'N/A' : usersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Tracks */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
            <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> 
                Recently Added Tracks
              </h2>
            </div>
            <CardContent className="p-0">
              {recentTracks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-400 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4 font-medium">Track Title</th>
                        <th className="px-6 py-4 font-medium">Artist</th>
                        <th className="px-6 py-4 font-medium">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentTracks.map((track: any) => {
                        const date = track.created_at ? new Date(track.created_at).toLocaleDateString() : 'Unknown';
                        return (
                          <tr key={track.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{track.title}</td>
                            <td className="px-6 py-4 text-zinc-400">
                              <Link href={`/artists/${track.artist_id}`} className="hover:text-indigo-400 transition-colors">
                                {track.artist_id}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 flex items-center gap-2">
                              <CalendarDays className="w-3 h-3" /> {date}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Music className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No tracks added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Artists */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
            <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-400" /> 
                New Artists
              </h2>
              <Link href="/artists" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>
            </div>
            <CardContent className="p-0">
              {recentArtists.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {recentArtists.map((artist: any) => (
                    <Link key={artist.id} href={`/artists/${artist.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                        {artist.image_url ? (
                          <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 font-bold text-lg">
                            {artist.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{artist.name}</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {artist.created_at ? new Date(artist.created_at).toLocaleDateString() : 'Legacy'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No artists added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
