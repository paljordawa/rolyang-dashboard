import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/server';
import { cookies } from 'next/headers';
import { Users, Disc3, Music, Upload, Library, TrendingUp, Clock, CalendarDays, Heart, Sparkles, Languages, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AdminCreatorsCard from '@/components/AdminCreatorsCard';

export default async function Home() {
  const cookieStore = await cookies();
  const isAdminCookie = cookieStore.get('rolyang_admin_session')?.value === 'true';

  let role = 'listener';
  let artistId = null;
  let userId = null;

  if (isAdminCookie) {
    role = 'admin';
  } else {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        role = user.user_metadata?.role || 'listener';
        artistId = user.user_metadata?.artist_id || null;
        userId = user.id;
      }
    } catch (err) {
      console.error('Error fetching role in page.tsx:', err);
    }
  }

  // ==========================================
  // RENDER 1: ARTIST STUDIO DASHBOARD
  // ==========================================
  if (role === 'artist' && artistId) {
    // 1. Fetch artist track count
    const { count: tracksCount } = await supabaseAdmin
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    // 2. Fetch artist album count
    const { count: albumsCount } = await supabaseAdmin
      .from('albums')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    // 3. Fetch artist followers
    const { count: followersCount } = await supabaseAdmin
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId);

    // 4. Fetch artist tracks
    const { data: artistTracks } = await supabaseAdmin
      .from('tracks')
      .select('id, title, duration, created_at, status')
      .eq('artist_id', artistId)
      .order('created_at', { ascending: false });

    // 5. Fetch catalog likes (favorites)
    const artistTrackIds = (artistTracks || []).map((t: any) => t.id);
    let likesCount = 0;
    if (artistTrackIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .in('track_id', artistTrackIds);
      likesCount = count || 0;
    }

    const recentTracks = (artistTracks || []).slice(0, 5);

    return (
      <div className="w-full py-8 px-6">
        <div className="mb-8 flex justify-end items-center flex-wrap gap-4 pb-4 border-b border-white/10">
          <div className="flex gap-3">
            <Link href="/upload">
              <Button className="btn-gradient border-0 shadow-lg shadow-violet-500/20 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload New Song
              </Button>
            </Link>
          </div>
        </div>

        {/* Artist Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Followers</CardTitle>
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white">{followersCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Likes</CardTitle>
              <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart className="h-4 w-4 text-pink-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white">{likesCount}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Albums</CardTitle>
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
              <CardTitle className="text-sm font-medium text-zinc-400">Uploaded Tracks</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Music className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-white">{tracksCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Recent Tracks */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/10 shadow-xl overflow-hidden h-full">
              <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" /> 
                  Your Recently Uploaded Songs
                </h2>
              </div>
              <CardContent className="p-0">
                {recentTracks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-black/20">
                        <tr>
                          <th className="px-6 py-4 font-medium">Title</th>
                          <th className="px-6 py-4 font-medium text-center">Status</th>
                          <th className="px-6 py-4 font-medium">Uploaded Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentTracks.map((track: any) => (
                          <tr key={track.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{track.title}</td>
                            <td className="px-6 py-4 text-center">
                              {track.status === 'approved' && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">Approved</span>
                              )}
                              {track.status === 'pending' && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 font-bold">Pending Review</span>
                              )}
                              {track.status === 'rejected' && (
                                <span className="text-[10px] bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20 font-bold">Declined</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-zinc-500 flex items-center gap-2">
                              <CalendarDays className="w-3 h-3" /> {new Date(track.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-16 text-center text-zinc-500">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">You haven't uploaded any tracks yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Quick actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-white/10 shadow-xl overflow-hidden h-full flex flex-col justify-between">
              <div>
                <CardHeader>
                  <CardTitle className="text-white text-lg">Studio Quick Actions</CardTitle>
                  <CardDescription className="text-zinc-400">Jump straight into creator tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/lyrics" className="block w-full">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5 py-6">
                      <Languages className="w-5 h-5 text-violet-400" />
                      <div className="text-left">
                        <span className="block text-sm font-semibold">Sync Lyrics</span>
                        <span className="block text-[10px] text-zinc-500">Configure time-sync lyrics</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/analytics" className="block w-full">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5 py-6">
                      <TrendingUp className="w-5 h-5 text-fuchsia-400" />
                      <div className="text-left">
                        <span className="block text-sm font-semibold">View Catalog Performance</span>
                        <span className="block text-[10px] text-zinc-500">Detailed analytics & stats</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/upload" className="block w-full">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5 py-6">
                      <Upload className="w-5 h-5 text-blue-400" />
                      <div className="text-left">
                        <span className="block text-sm font-semibold">Upload Music</span>
                        <span className="block text-[10px] text-zinc-500">Add singles or albums</span>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </div>
              <div className="p-6 bg-white/2 border-t border-white/5 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-fuchsia-400 animate-pulse" />
                <span>Rolyang Creator Workspace</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: CONTRIBUTOR STUDIO DASHBOARD
  // ==========================================
  if (role === 'contributor') {
    // 1. Fetch count of lyric submissions by this contributor
    let approvedCount = 0;
    let pendingCount = 0;
    
    if (userId) {
      const { count: countApproved } = await supabaseAdmin
        .from('lyric_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userId)
        .eq('status', 'approved');
      approvedCount = countApproved || 0;

      const { count: countPending } = await supabaseAdmin
        .from('lyric_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('submitted_by', userId)
        .eq('status', 'pending');
      pendingCount = countPending || 0;
    }

    return (
      <div className="w-full py-8 px-6">


        {/* Contributor Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-3xl">
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Approved Contributions</CardTitle>
              <CheckCircle2 className="h-5 h-5 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{approvedCount}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Pending Review</CardTitle>
              <Clock className="h-5 h-5 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-white/10 shadow-xl py-12 flex flex-col items-center justify-center text-center max-w-3xl">
          <Languages className="w-12 h-12 text-fuchsia-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white mb-2">Start Translating Lyrics</h3>
          <p className="text-zinc-400 max-w-sm mb-6 text-sm">
            Select a song from the library in the lyrics section to start writing translations or sync timings.
          </p>
          <Link href="/lyrics">
            <Button className="btn-gradient border-0 text-white font-semibold cursor-pointer">
              Open Lyrics Editor
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: ADMIN GLOBAL DASHBOARD (Default)
  // ==========================================
  const { data: authUsersRes, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
  const usersCount = authUsersError ? 0 : (authUsersRes?.users?.length || 0);
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

  // Fetch recent contributors
  const { data: recentContributorsObj } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, created_at')
    .eq('role', 'contributor')
    .order('created_at', { ascending: false })
    .limit(4);
  const recentContributors = recentContributorsObj || [];

  return (
    <div className="w-full py-8 px-6">


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
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-white">{usersCount}</div>
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

        {/* Right Column: Recent Artists & Contributors (Tabbed Card) */}
        <div className="lg:col-span-1 space-y-6">
          <AdminCreatorsCard artists={recentArtists} contributors={recentContributors} />
        </div>

      </div>
    </div>
  );
}
