import { supabaseAdmin } from '@/lib/supabase';
import BannerManagerClient from './BannerManagerClient';

export default async function BannersPage() {
  const { data: bannersObj, error } = await supabaseAdmin
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
    
  const banners = error ? [] : (bannersObj || []);

  return (
    <div className="max-w-6xl mx-auto py-10 px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Featured <span className="text-gradient">Banners</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Manage the promotional banners that appear at the top of the main music app.
        </p>
      </div>

      <BannerManagerClient initialBanners={banners} />
    </div>
  );
}
