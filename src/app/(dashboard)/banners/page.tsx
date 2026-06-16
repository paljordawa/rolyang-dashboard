import { supabaseAdmin } from '@/lib/supabase';
import BannerManagerClient from './BannerManagerClient';

export default async function BannersPage() {
  // Parallel fetch banners and all reference catalogs to map internal linking targets
  const [bannersRes, artistsRes, albumsRes, tracksRes, playlistsRes] = await Promise.all([
    supabaseAdmin
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('artists')
      .select('id, name')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('albums')
      .select('id, title, artist_id')
      .order('title', { ascending: true }),
    supabaseAdmin
      .from('tracks')
      .select('id, title, artist_id')
      .order('title', { ascending: true }),
    supabaseAdmin
      .from('playlists')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  const banners = bannersRes.error ? [] : (bannersRes.data || []);
  const artists = artistsRes.error ? [] : (artistsRes.data || []);
  const albums = albumsRes.error ? [] : (albumsRes.data || []);
  const tracks = tracksRes.error ? [] : (tracksRes.data || []);
  const playlists = playlistsRes.error ? [] : (playlistsRes.data || []);

  return (
    <div className="w-full py-10 px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Featured <span className="text-gradient">Banners</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Manage the promotional banners that appear at the top of the main music app.
        </p>
      </div>

      <BannerManagerClient 
        initialBanners={banners} 
        artists={artists}
        albums={albums}
        tracks={tracks}
        playlists={playlists}
      />
    </div>
  );
}

