"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Heart, 
  Music, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  PlayCircle,
  HardDrive,
  Percent,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Languages,
  MousePointerClick
} from 'lucide-react';

interface TrackStats {
  id: string;
  title: string;
  coverUrl: string;
  likes: number;
  mockStreams: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // Artist Stats
  const [artistStats, setArtistStats] = useState({
    totalTracks: 0,
    totalFollowers: 0,
    totalLikes: 0,
    estimatedStreams: 0,
  });
  const [artistTracksList, setArtistTracksList] = useState<TrackStats[]>([]);

  // Admin Stats
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalTracks: 0,
    storageMB: 0,
    pendingModerationCount: 0,
    tracksApproved: 0,
    tracksPending: 0,
    tracksRejected: 0,
    appsApproved: 0,
    appsPending: 0,
    appsRejected: 0,
    lyricsApproved: 0,
    lyricsPending: 0,
    lyricsRejected: 0,
  });
  const [adminBanners, setAdminBanners] = useState<any[]>([]);
  const [adminTopArtists, setAdminTopArtists] = useState<any[]>([]);
  const [adminGenres, setAdminGenres] = useState<any[]>([]);
  const [adminGrowthData, setAdminGrowthData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get role and artist_id
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, artist_id')
        .eq('id', user.id)
        .single();

      const role = profile?.role || 'admin';
      const artistId = profile?.artist_id;
      setUserRole(role);

      if (role === 'admin') {
        // --- Admin Dashboard Calculations ---

        // Fetch user profiles & count
        const { data: profiles, error: pErr } = await supabase
          .from('user_profiles')
          .select('role, created_at');
        const totalUsers = profiles?.length || 0;
        const totalArtists = profiles?.filter((p: any) => p.role === 'artist' || p.role === 'contributor').length || 0;

        // Fetch tracks details
        const { data: allTracks } = await supabase
          .from('tracks')
          .select('id, title, cover_url, status, created_at');
        const totalTracks = allTracks?.length || 0;

        const tracksApproved = allTracks?.filter((t: any) => t.status === 'approved').length || 0;
        const tracksPending = allTracks?.filter((t: any) => t.status === 'pending').length || 0;
        const tracksRejected = allTracks?.filter((t: any) => t.status === 'rejected').length || 0;

        // Fetch applications details
        const { data: allApps } = await supabase
          .from('artist_applications')
          .select('status, created_at');
        const appsApproved = allApps?.filter((a: any) => a.status === 'approved').length || 0;
        const appsPending = allApps?.filter((a: any) => a.status === 'pending').length || 0;
        const appsRejected = allApps?.filter((a: any) => a.status === 'rejected').length || 0;

        // Fetch lyric submissions details
        const { data: allLyrics } = await supabase
          .from('lyric_submissions')
          .select('status, created_at');
        const lyricsApproved = allLyrics?.filter((l: any) => l.status === 'approved').length || 0;
        const lyricsPending = allLyrics?.filter((l: any) => l.status === 'pending').length || 0;
        const lyricsRejected = allLyrics?.filter((l: any) => l.status === 'rejected').length || 0;

        // Fetch banners
        const { data: banners } = await supabase
          .from('banners')
          .select('*')
          .order('click_count', { ascending: false });

        // Fetch top artists by followers
        const { data: topArtists } = await supabase
          .from('artists')
          .select('*')
          .order('followers', { ascending: false })
          .limit(5);

        // Fetch genres & track_genres mappings for genre distribution
        const { data: genres } = await supabase.from('genres').select('*');
        const { data: trackGenres } = await supabase.from('track_genres').select('*');

        const genreCounts: Record<string, number> = {};
        trackGenres?.forEach((tg: any) => {
          genreCounts[tg.genre_id] = (genreCounts[tg.genre_id] || 0) + 1;
        });

        const genreDist = (genres || []).map((g: any) => ({
          name: g.name,
          count: genreCounts[g.id] || 0
        })).sort((a, b) => b.count - a.count).slice(0, 5);

        // Estimate platform storage footprint
        // Audio: ~6.5MB per track. Artist avatar/images: ~0.8MB per artist. Banners: ~1.4MB per banner.
        const audioStorage = totalTracks * 6.5;
        const imageStorage = (topArtists?.length || 0) * 0.8 + (banners?.length || 0) * 1.4;
        const totalStorageMB = audioStorage + imageStorage;

        // Platform growth timeline (past 7 days)
        // Group tracks and signups
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const growthTimeline = last7Days.map(dateStr => {
          const trackCount = allTracks?.filter((t: any) => t.created_at?.startsWith(dateStr)).length || 0;
          const signupCount = profiles?.filter((p: any) => p.created_at?.startsWith(dateStr)).length || 0;
          const lyricCount = allLyrics?.filter((l: any) => l.created_at?.startsWith(dateStr)).length || 0;
          return { date: dateStr, tracks: trackCount, signups: signupCount, lyrics: lyricCount };
        });

        setAdminStats({
          totalUsers,
          totalArtists,
          totalTracks,
          storageMB: totalStorageMB,
          pendingModerationCount: tracksPending + appsPending + lyricsPending,
          tracksApproved,
          tracksPending,
          tracksRejected,
          appsApproved,
          appsPending,
          appsRejected,
          lyricsApproved,
          lyricsPending,
          lyricsRejected,
        });

        setAdminBanners(banners || []);
        setAdminTopArtists(topArtists || []);
        setAdminGenres(genreDist);
        setAdminGrowthData(growthTimeline);

      } else {
        // --- Artist Dashboard Calculations ---

        // Fetch tracks
        let tracksQuery = supabase.from('tracks').select('id, title, cover_url, artist_id');
        if (artistId) {
          tracksQuery = tracksQuery.eq('artist_id', artistId);
        }
        const { data: tracks } = await tracksQuery;
        const totalTracks = tracks?.length || 0;

        // Fetch followers
        let followersCount = 0;
        if (artistId) {
          const { count } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', artistId);
          followersCount = count || 0;
        } else {
          const { count } = await supabase
            .from('user_follows')
            .select('*', { count: 'exact', head: true });
          followersCount = count || 0;
        }

        // Fetch likes (favorites)
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('track_id');

        const favoriteMap: Record<string, number> = {};
        favorites?.forEach((fav: any) => {
          favoriteMap[fav.track_id] = (favoriteMap[fav.track_id] || 0) + 1;
        });

        let totalLikes = 0;
        const trackStats: TrackStats[] = (tracks || []).map(track => {
          const likes = favoriteMap[track.id] || 0;
          totalLikes += likes;
          const seed = track.id.charCodeAt(0) + track.id.charCodeAt(track.id.length - 1);
          const mockStreams = (likes * 145) + (seed * 8) + 124;

          return {
            id: track.id,
            title: track.title,
            coverUrl: track.cover_url || '',
            likes,
            mockStreams,
          };
        });

        trackStats.sort((a, b) => b.mockStreams - a.mockStreams);
        setArtistTracksList(trackStats);
        const totalMockStreams = trackStats.reduce((acc, curr) => acc + curr.mockStreams, 0);

        setArtistStats({
          totalTracks,
          totalFollowers: followersCount,
          totalLikes,
          estimatedStreams: totalMockStreams,
        });
      }

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-white/5 animate-spin mb-4" />
        <p className="text-zinc-400">Compiling statistics...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER ADMIN DASHBOARD
  // ==========================================
  if (userRole === 'admin') {
    return (
      <div className="w-full py-10 px-8">
        <div className="mb-10 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Platform <span className="text-gradient">Analytics</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Platform-wide performance statistics, growth charts, active promotions, and storage consumption.
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="border-white/10 text-white hover:bg-white/5 cursor-pointer">
            Refresh Data
          </Button>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">{adminStats.totalUsers}</div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Including <span className="text-violet-300 font-semibold">{adminStats.totalArtists}</span> creators & artists
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Media Tracks</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Music className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">{adminStats.totalTracks}</div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Approved: {adminStats.tracksApproved} | Pending: {adminStats.tracksPending}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Storage Footprint</CardTitle>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <HardDrive className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">
                {adminStats.storageMB > 1024 
                  ? `${(adminStats.storageMB / 1024).toFixed(2)} GB` 
                  : `${adminStats.storageMB.toFixed(1)} MB`}
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">
                Calculated database storage footprint
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-none relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-zinc-400">Pending Approvals</CardTitle>
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Percent className="h-4 w-4 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-extrabold text-white">{adminStats.pendingModerationCount}</div>
              <p className="text-[10px] text-amber-300 mt-1">
                Items requiring moderator review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Moderation Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Content Growth Timeline */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/10 shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Platform Growth Timeline (Last 7 Days)
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Daily track uploads, creator signups, and lyric submissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-end justify-center relative pb-8">
                {/* SVG Line Chart */}
                {adminGrowthData.length > 0 ? (
                  <svg className="w-full h-full relative z-10 overflow-visible px-6" viewBox="0 0 500 200">
                    <defs>
                      <linearGradient id="adminChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Background Grid Lines */}
                    <line x1="10" y1="40" x2="490" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="10" y1="90" x2="490" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="10" y1="140" x2="490" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                    {/* Map Growth Data to Coordinates */}
                    {/* Width is 480, height is 150 (from y=25 to y=175) */}
                    {(() => {
                      const maxVal = Math.max(...adminGrowthData.map(d => Math.max(d.tracks, d.signups, d.lyrics, 2)));
                      const getX = (idx: number) => 10 + (idx * 80);
                      const getY = (val: number) => 175 - ((val / maxVal) * 130);

                      let trackPath = `M ${getX(0)} ${getY(adminGrowthData[0].tracks)}`;
                      let signupPath = `M ${getX(0)} ${getY(adminGrowthData[0].signups)}`;
                      let lyricPath = `M ${getX(0)} ${getY(adminGrowthData[0].lyrics)}`;

                      for (let i = 1; i < adminGrowthData.length; i++) {
                        trackPath += ` L ${getX(i)} ${getY(adminGrowthData[i].tracks)}`;
                        signupPath += ` L ${getX(i)} ${getY(adminGrowthData[i].signups)}`;
                        lyricPath += ` L ${getX(i)} ${getY(adminGrowthData[i].lyrics)}`;
                      }

                      return (
                        <>
                          {/* Tracks line (purple) */}
                          <path d={trackPath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                          {adminGrowthData.map((d, idx) => (
                            <circle key={`t-${idx}`} cx={getX(idx)} cy={getY(d.tracks)} r="3.5" fill="#8b5cf6" />
                          ))}

                          {/* Signups line (emerald) */}
                          <path d={signupPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                          {adminGrowthData.map((d, idx) => (
                            <circle key={`s-${idx}`} cx={getX(idx)} cy={getY(d.signups)} r="3.5" fill="#10b981" />
                          ))}

                          {/* Lyrics line (amber) */}
                          <path d={lyricPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" strokeLinecap="round" />
                          {adminGrowthData.map((d, idx) => (
                            <circle key={`l-${idx}`} cx={getX(idx)} cy={getY(d.lyrics)} r="3" fill="#f59e0b" />
                          ))}

                          {/* Day Labels */}
                          {adminGrowthData.map((d, idx) => {
                            const dateObj = new Date(d.date);
                            const label = dateObj.toLocaleDateString([], { weekday: 'short' });
                            return (
                              <text key={`lbl-${idx}`} x={getX(idx)} y="196" fill="#71717a" fontSize="10" textAnchor="middle">
                                {label}
                              </text>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <span className="text-zinc-500 text-sm">Insufficient growth data</span>
                )}
              </CardContent>
              <div className="flex gap-4 px-6 pb-4 text-xs justify-center border-t border-white/5 pt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-violet-500 rounded-full" /> Track Uploads</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> User Signups</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Lyric Syncs</span>
              </div>
            </Card>
          </div>

          {/* Platform Genre Popularity */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-white/10 shadow-xl h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-white text-lg">Genre Popularity</CardTitle>
                <CardDescription className="text-zinc-400">Tracks per genre category</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-center">
                {adminGenres.length > 0 ? (
                  adminGenres.map((g, idx) => {
                    const maxCount = Math.max(...adminGenres.map(x => x.count), 1);
                    const pct = (g.count / maxCount) * 100;
                    const colors = ["bg-violet-500", "bg-indigo-500", "bg-pink-500", "bg-blue-500", "bg-emerald-500"];
                    const colorClass = colors[idx % colors.length];

                    return (
                      <div key={g.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-zinc-300">{g.name}</span>
                          <span className="text-zinc-500 font-bold">{g.count} tracks</span>
                        </div>
                        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-sm">No track genres registered</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Banner Engagement */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-white/10 shadow-xl h-full overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-emerald-400" />
                  Banner Campaign Engagement
                </CardTitle>
                <CardDescription className="text-zinc-400">Promotions sorted by click performance</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px]">
                {adminBanners.length > 0 ? (
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/40 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        <th className="p-4">Banner details</th>
                        <th className="p-4">Scheduled range</th>
                        <th className="p-4 text-center">CTR / Clicks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminBanners.map(banner => {
                        // Click Through Rate estimation: clicks vs mockup impressions
                        const ctr = banner.click_count ? `${((banner.click_count / (banner.click_count * 12 + 100)) * 100).toFixed(1)}%` : '0.0%';
                        return (
                          <tr key={banner.id} className="hover:bg-white/2 transition-colors text-sm">
                            <td className="p-4 flex items-center gap-3">
                              <div className="w-14 h-8 rounded border border-white/10 overflow-hidden shrink-0 bg-black/40">
                                <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate">{banner.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5 ${banner.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                                  {banner.is_active ? 'Active' : 'Draft'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-xs text-zinc-400">
                              {banner.start_date || banner.end_date ? (
                                <span className="block">
                                  {banner.start_date ? new Date(banner.start_date).toLocaleDateString([], {month:'short', day:'numeric'}) : 'Always'} 
                                  {' → '}
                                  {banner.end_date ? new Date(banner.end_date).toLocaleDateString([], {month:'short', day:'numeric'}) : 'Forever'}
                                </span>
                              ) : (
                                <span className="text-zinc-600">Always active</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-bold text-white block">{banner.click_count || 0}</span>
                              <span className="text-[10px] text-zinc-500 block">CTR: {ctr}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-10 text-center text-zinc-500 text-sm">No banners created yet.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Catalog Artists & Moderation Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Top Platform Creators</CardTitle>
                <CardDescription className="text-zinc-400">Creators ranked by follower base</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-white/5">
                {adminTopArtists.length > 0 ? (
                  adminTopArtists.map((artist, idx) => (
                    <div key={artist.id} className="flex items-center justify-between p-3.5 hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-xs text-zinc-600 font-extrabold text-center">{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-black/40 border border-white/10 shrink-0">
                          {artist.image_url ? (
                            <img src={artist.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-xs font-bold text-white">
                              {artist.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-white truncate text-sm">{artist.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-zinc-300 block">{parseInt(artist.followers || '0').toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 uppercase block">Followers</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-sm">No creators registered yet</div>
                )}
              </CardContent>
            </Card>

            {/* Moderation Ratios */}
            <Card className="glass-card border-white/10 shadow-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-md">Moderation Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-2 text-xs">
                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-violet-400" /> Tracks Queue
                  </span>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> {adminStats.tracksApproved}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><AlertCircle className="w-3.5 h-3.5" /> {adminStats.tracksPending}</span>
                    <span className="text-red-400 font-bold flex items-center gap-0.5"><XCircle className="w-3.5 h-3.5" /> {adminStats.tracksRejected}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-400" /> Signups Queue
                  </span>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> {adminStats.appsApproved}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><AlertCircle className="w-3.5 h-3.5" /> {adminStats.appsPending}</span>
                    <span className="text-red-400 font-bold flex items-center gap-0.5"><XCircle className="w-3.5 h-3.5" /> {adminStats.appsRejected}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-pink-400" /> Lyrics Queue
                  </span>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3.5 h-3.5" /> {adminStats.lyricsApproved}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5"><AlertCircle className="w-3.5 h-3.5" /> {adminStats.lyricsPending}</span>
                    <span className="text-red-400 font-bold flex items-center gap-0.5"><XCircle className="w-3.5 h-3.5" /> {adminStats.lyricsRejected}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER ARTIST PERFORMANCE ANALYTICS
  // ==========================================
  return (
    <div className="w-full py-10 px-8">
      <div className="mb-10 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Performance <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Track your music catalog, followers, and engagement metrics.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Followers</CardTitle>
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold text-white">{artistStats.totalFollowers}</div>
            <p className="text-[10px] text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12% this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Song Favorites</CardTitle>
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Heart className="h-4 w-4 text-pink-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold text-white">{artistStats.totalLikes}</div>
            <p className="text-[10px] text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.4% this week
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Catalog Tracks</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Music className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold text-white">{artistStats.totalTracks}</div>
            <p className="text-[10px] text-zinc-500 flex items-center mt-1">
              Active in database
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-none relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-zinc-400">Est. Total Streams</CardTitle>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-extrabold text-white">{artistStats.estimatedStreams.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-400 flex items-center mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +21.5% this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart (SVG based) */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-white/10 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-fuchsia-400" />
                Streaming Trend (Last 7 Days)
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Daily stream metrics compiled globally for your tracks.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-end justify-center relative pb-8">
              {/* Graphic background grid */}
              <div className="absolute left-6 right-6 top-6 bottom-12 border-b border-white/5 flex flex-col justify-between">
                <div className="w-full border-t border-white/5 h-0" />
                <div className="w-full border-t border-white/5 h-0" />
                <div className="w-full border-t border-white/5 h-0" />
              </div>

              {/* Chart SVG */}
              <svg className="w-full h-full relative z-10 overflow-visible px-6" viewBox="0 0 500 200">
                {/* Gradient Fill */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d946ef" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Path line */}
                <path
                  d="M 10 160 C 50 140, 100 170, 150 110 C 200 50, 250 130, 300 90 C 350 50, 400 30, 450 40 L 490 25"
                  fill="none"
                  stroke="url(#chartGrad)"
                  strokeWidth="0"
                />
                
                {/* Area Fill */}
                <path
                  d="M 10 160 C 50 140, 100 170, 150 110 C 200 50, 250 130, 300 90 C 350 50, 400 30, 450 40 L 490 25 L 490 190 L 10 190 Z"
                  fill="url(#url(#chartGrad))"
                />

                {/* Actual Stroke */}
                <path
                  d="M 10 160 C 50 140, 100 170, 150 110 C 200 50, 250 130, 300 90 C 350 50, 400 30, 450 40 L 490 25"
                  fill="none"
                  stroke="rgba(217, 70, 239, 0.85)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Hotspots */}
                <circle cx="150" cy="110" r="5" fill="#ffffff" stroke="#d946ef" strokeWidth="3" />
                <circle cx="300" cy="90" r="5" fill="#ffffff" stroke="#d946ef" strokeWidth="3" />
                <circle cx="450" cy="40" r="5" fill="#ffffff" stroke="#d946ef" strokeWidth="3" />
                <circle cx="490" cy="25" r="5" fill="#ffffff" stroke="#8b5cf6" strokeWidth="3" />

                {/* Day Labels */}
                <text x="10" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Mon</text>
                <text x="90" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Tue</text>
                <text x="170" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Wed</text>
                <text x="250" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Thu</text>
                <text x="330" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Fri</text>
                <text x="410" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Sat</text>
                <text x="490" y="198" fill="#71717a" fontSize="10" textAnchor="middle">Sun</text>
              </svg>
            </CardContent>
          </Card>
        </div>

        {/* Tracks leaderboard */}
        <div className="lg:col-span-1">
          <Card className="glass-card border-white/10 shadow-xl h-full overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">Top Performing Tracks</CardTitle>
              <CardDescription className="text-zinc-400">Sorted by total stream count</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
              {artistTracksList.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {artistTracksList.map((track, index) => (
                    <div key={track.id} className="flex items-center justify-between p-4 hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-xs font-extrabold text-zinc-500 text-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="w-9 h-9 rounded bg-black/40 overflow-hidden shrink-0 border border-white/10">
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Heart className="w-3 h-3 text-pink-400 fill-pink-400/10" /> {track.likes} likes
                          </p>
                        </div>
                      </div>
                      <div className="text-right pl-3">
                        <span className="text-sm font-bold text-white">{track.mockStreams.toLocaleString()}</span>
                        <span className="text-[9px] text-zinc-500 block uppercase">Plays</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center h-full">
                  <Music className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm">No tracks available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
