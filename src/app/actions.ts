"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createArtist(artistData: {
  id: string;
  name: string;
  bio: string;
  image_url: string;
  followers: string;
}) {
  const { error } = await supabaseAdmin.from("artists").insert(artistData);
  
  if (error) {
    throw new Error(error.message);
  }
  
  return { success: true };
}

// ==========================================
// Banners
// ==========================================

export async function createBanner(bannerData: { title: string; image_url: string; link_url?: string; is_active?: boolean; sort_order?: number }) {
  const { error } = await supabaseAdmin.from('banners').insert(bannerData);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/banners');
  return { success: true };
}

export async function updateBanner(id: string, updates: Partial<{ title: string; image_url: string; link_url: string; is_active: boolean; sort_order: number }>) {
  const { error } = await supabaseAdmin.from('banners').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/banners');
  return { success: true };
}

export async function deleteBanner(id: string) {
  const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/banners');
  return { success: true };
}

export async function createAlbum(albumData: any) {
  const { error } = await supabaseAdmin.from("albums").upsert(albumData);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createTracks(tracksData: any[]) {
  // Separate track fields from genre_ids
  const cleanTracks = tracksData.map((t) => {
    const { genre_ids, ...trackFields } = t;
    return trackFields;
  });

  const { error: trackError } = await supabaseAdmin.from("tracks").upsert(cleanTracks);
  if (trackError) throw new Error(trackError.message);

  // Prepare track_genres links
  const trackGenresToInsert: { track_id: string, genre_id: string }[] = [];
  tracksData.forEach(t => {
    if (t.genre_ids && Array.isArray(t.genre_ids)) {
      t.genre_ids.forEach((gId: string) => {
        trackGenresToInsert.push({ track_id: t.id, genre_id: gId });
      });
    }
  });

  if (trackGenresToInsert.length > 0) {
    const { error: genreError } = await supabaseAdmin.from("track_genres").upsert(trackGenresToInsert, { onConflict: 'track_id,genre_id' });
    if (genreError) throw new Error(genreError.message);
  }

  return { success: true };
}

export async function updateArtist(id: string, artistData: any) {
  const { error } = await supabaseAdmin.from("artists").update(artistData).eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteStorageFile(bucket: string, path: string) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createGenre(genreData: { id: string, name: string }) {
  const { error } = await supabaseAdmin.from("genres").insert(genreData);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteGenre(id: string) {
  const { error } = await supabaseAdmin.from("genres").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function deleteAlbum(id: string) {
  const { error } = await supabaseAdmin.from("albums").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/albums");
  return { success: true };
}

export async function deleteTrack(id: string) {
  const { error } = await supabaseAdmin.from("tracks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tracks");
  return { success: true };
}

// ==========================================
// Users Management
// ==========================================

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/users");
  return { success: true };
}

export async function updateUserTier(id: string, tier: 'free' | 'paid') {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: { tier }
  });
  if (error) throw new Error(error.message);
  revalidatePath("/users");
  return { success: true };
}
