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

export async function createBanner(bannerData: { 
  title: string; 
  image_url: string; 
  link_url?: string; 
  is_active?: boolean; 
  sort_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}) {
  const { error } = await supabaseAdmin.from('banners').insert(bannerData);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/banners');
  return { success: true };
}

export async function updateBanner(
  id: string, 
  updates: Partial<{ 
    title: string; 
    image_url: string; 
    link_url: string; 
    is_active: boolean; 
    sort_order: number;
    start_date?: string | null;
    end_date?: string | null;
    click_count?: number;
  }>
) {
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

export async function registerBannerClick(id: string) {
  const { data, error: selectErr } = await supabaseAdmin
    .from('banners')
    .select('click_count')
    .eq('id', id)
    .single();

  if (selectErr) throw new Error(selectErr.message);

  const { error: updateErr } = await supabaseAdmin
    .from('banners')
    .update({ click_count: (data?.click_count || 0) + 1 })
    .eq('id', id);

  if (updateErr) throw new Error(updateErr.message);

  revalidatePath('/');
  revalidatePath('/banners');
  return { success: true };
}

export async function getOrCreateCollaborativeArtist(artistIds: string[]): Promise<string> {
  if (!artistIds || artistIds.length === 0) {
    throw new Error("No artists provided");
  }
  if (artistIds.length === 1) {
    return artistIds[0];
  }
  
  // Deterministic collaborative artist ID
  const sortedIds = [...artistIds].sort();
  const resolvedId = `collab_${sortedIds.join('__')}`;
  
  // Check if exists
  const { data: existing } = await supabaseAdmin
    .from("artists")
    .select("id")
    .eq("id", resolvedId)
    .maybeSingle();
    
  if (existing) {
    return existing.id;
  }
  
  // Fetch individual artists
  const { data: individuals, error: fetchErr } = await supabaseAdmin
    .from("artists")
    .select("name, image_url")
    .in("id", artistIds);
    
  if (fetchErr || !individuals || individuals.length === 0) {
    throw new Error("Failed to fetch individual artists for collaboration");
  }
  
  // Format combined name
  const names = individuals.map((a: any) => a.name);
  let combinedName = "";
  if (names.length === 2) {
    combinedName = `${names[0]} & ${names[1]}`;
  } else if (names.length > 2) {
    combinedName = names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  } else {
    combinedName = names[0] || "Unknown Collaboration";
  }
  
  // Insert new collaborative artist
  const { error: insertErr } = await supabaseAdmin.from("artists").insert({
    id: resolvedId,
    name: combinedName,
    bio: `Collaborative profile for ${combinedName}.`,
    image_url: individuals[0]?.image_url || "",
    followers: "0",
    top_songs: []
  });
  
  if (insertErr) {
    throw new Error(`Failed to create collaborative artist: ${insertErr.message}`);
  }
  
  return resolvedId;
}

export async function createAlbum(albumData: any) {
  let resolvedArtistId = albumData.artist_id;
  if (Array.isArray(albumData.artist_ids)) {
    resolvedArtistId = await getOrCreateCollaborativeArtist(albumData.artist_ids);
  }
  
  const { artist_ids, ...cleanAlbumData } = albumData;
  cleanAlbumData.artist_id = resolvedArtistId;

  const { error } = await supabaseAdmin.from("albums").upsert(cleanAlbumData);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function createTracks(tracksData: any[]) {
  // Resolve artist_ids for each track if provided
  const processedTracks = [];
  for (const track of tracksData) {
    let resolvedArtistId = track.artist_id;
    if (Array.isArray(track.artist_ids)) {
      resolvedArtistId = await getOrCreateCollaborativeArtist(track.artist_ids);
    }
    
    const { artist_ids, ...trackFields } = track;
    trackFields.artist_id = resolvedArtistId;
    processedTracks.push(trackFields);
  }

  // Separate track fields from genre_ids
  const cleanTracks = processedTracks.map((t) => {
    const { genre_ids, ...trackFields } = t;
    return trackFields;
  });

  const { error: trackError } = await supabaseAdmin.from("tracks").upsert(cleanTracks);
  if (trackError) throw new Error(trackError.message);

  // Prepare track_genres links
  const trackGenresToInsert: { track_id: string, genre_id: string }[] = [];
  processedTracks.forEach((t, idx) => {
    const originalTrack = tracksData[idx];
    if (originalTrack.genre_ids && Array.isArray(originalTrack.genre_ids)) {
      originalTrack.genre_ids.forEach((gId: string) => {
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

export async function createGenre(genreData: { id: string, name: string, image_url?: string }) {
  const { error } = await supabaseAdmin.from("genres").insert(genreData);
  if (error) throw new Error(error.message);
  revalidatePath("/genres");
  return { success: true };
}

export async function updateGenre(id: string, genreData: { name?: string, image_url?: string }) {
  const { error } = await supabaseAdmin.from("genres").update(genreData).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/genres");
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

export async function updateTrackAction(trackId: string, trackData: any, genreIds?: string[]) {
  const { error } = await supabaseAdmin
    .from("tracks")
    .update(trackData)
    .eq("id", trackId);
  
  if (error) throw new Error(error.message);

  if (genreIds) {
    // Delete old genres first
    const { error: deleteErr } = await supabaseAdmin
      .from("track_genres")
      .delete()
      .eq("track_id", trackId);
    if (deleteErr) throw new Error(deleteErr.message);

    // Insert new ones
    if (genreIds.length > 0) {
      const inserts = genreIds.map(gId => ({ track_id: trackId, genre_id: gId }));
      const { error: genreErr } = await supabaseAdmin
        .from("track_genres")
        .insert(inserts);
      if (genreErr) throw new Error(genreErr.message);
    }
  }

  revalidatePath("/tracks");
  revalidatePath("/artists/[id]", "layout");
  revalidatePath("/discography", "layout");
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

export async function updateAlbumDetailsAction(
  albumId: string,
  albumUpdates: { title: string; year: string | null; cover_url: string },
  tracksData: {
    title: string;
    color: string;
    lyrics: any;
    audio_url: string;
    duration: number;
    genre_ids?: string[];
  }[]
) {
  // 1. Update album record
  const { error: albumErr } = await supabaseAdmin
    .from("albums")
    .update(albumUpdates)
    .eq("id", albumId);

  if (albumErr) throw new Error(`Failed to update album: ${albumErr.message}`);

  // 2. Update each track row sequentially by mapping new order to -t{num} IDs
  for (let i = 0; i < tracksData.length; i++) {
    const track = tracksData[i];
    const targetId = `${albumId}-t${i + 1}`;

    const trackUpdates: any = {
      title: track.title,
      color: track.color,
      lyrics: track.lyrics,
      audio_url: track.audio_url,
      duration: track.duration,
      cover_url: null, // Album tracks should have null cover_url to fallback to album cover
    };

    const { error: trackErr } = await supabaseAdmin
      .from("tracks")
      .update(trackUpdates)
      .eq("id", targetId);

    if (trackErr) throw new Error(`Failed to update track index ${i + 1}: ${trackErr.message}`);

    // Update genres for this track
    if (track.genre_ids) {
      const { error: deleteErr } = await supabaseAdmin
        .from("track_genres")
        .delete()
        .eq("track_id", targetId);

      if (deleteErr) throw new Error(`Failed to update genres: ${deleteErr.message}`);

      if (track.genre_ids.length > 0) {
        const inserts = track.genre_ids.map(gId => ({ track_id: targetId, genre_id: gId }));
        const { error: insertErr } = await supabaseAdmin
          .from("track_genres")
          .insert(inserts);

        if (insertErr) throw new Error(`Failed to insert genres: ${insertErr.message}`);
      }
    }
  }

  // 3. Revalidate Paths
  revalidatePath("/albums");
  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/discography");
  revalidatePath("/artists/[id]", "layout");
  return { success: true };
}

export async function updateArtistProfileAction(
  artistId: string,
  userId: string,
  displayName: string,
  bio: string,
  avatarUrl: string
) {
  // 1. Fetch current user metadata to preserve it
  const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userErr || !userData || !userData.user) {
    throw new Error(`Failed to fetch user metadata: ${userErr?.message || 'User not found'}`);
  }

  const currentMetadata = userData.user.user_metadata || {};

  // 2. Update the artists table
  const { error: artistErr } = await supabaseAdmin
    .from('artists')
    .update({
      name: displayName,
      bio: bio || '',
      image_url: avatarUrl || '',
    })
    .eq('id', artistId);

  if (artistErr) throw new Error(`Failed to update artist profile: ${artistErr.message}`);

  // 3. Update user metadata in auth.users
  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        ...currentMetadata,
        stage_name: displayName,
        avatar_url: avatarUrl || '',
      }
    }
  );

  if (authErr) throw new Error(`Failed to update user auth metadata: ${authErr.message}`);

  // 4. Revalidate Paths
  revalidatePath("/discography");
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/artists/[id]", "layout");

  return { success: true };
}

// ==========================================
// Playlists Curation
// ==========================================

export async function createPlaylistAction(playlistData: {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  songs: string[];
}) {
  const { error } = await supabaseAdmin.from("playlists").insert(playlistData);
  if (error) throw new Error(error.message);
  revalidatePath("/playlists");
  return { success: true };
}

export async function updatePlaylistAction(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    cover_url: string;
    songs: string[];
  }>
) {
  const { error } = await supabaseAdmin.from("playlists").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/playlists");
  return { success: true };
}

export async function deletePlaylistAction(id: string) {
  const { error } = await supabaseAdmin.from("playlists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/playlists");
  return { success: true };
}

// ==========================================
// Royalties & Payments
// ==========================================

export async function createRoyaltyPaymentAction(payoutData: {
  artist_id: string;
  amount: number;
  status: 'pending' | 'paid';
  period_start: string;
  period_end: string;
  stream_count: number;
  payout_date?: string | null;
}) {
  const { error } = await supabaseAdmin.from("royalty_payments").insert(payoutData);
  if (error) throw new Error(error.message);
  revalidatePath("/royalties");
  return { success: true };
}

export async function markRoyaltyPaidAction(id: string) {
  const { error } = await supabaseAdmin
    .from("royalty_payments")
    .update({ status: 'paid', payout_date: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/royalties");
  return { success: true };
}

// ==========================================
// Push Notifications & Broadcasts
// ==========================================

export async function sendNotificationAction(notificationData: {
  title: string;
  message: string;
  type: 'global' | 'direct';
  recipient_id?: string | null;
  status: 'sent';
}) {
  const { error } = await supabaseAdmin.from("system_notifications").insert(notificationData);
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
  return { success: true };
}

// ==========================================
// Content Disputes
// ==========================================

export async function updateDisputeStatusAction(
  id: string,
  updates: {
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    moderator_notes: string;
  }
) {
  const { error } = await supabaseAdmin
    .from("content_disputes")
    .update({
      status: updates.status,
      moderator_notes: updates.moderator_notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/disputes");
  return { success: true };
}

// ==========================================
// Track Stream Logging (Diagnostics & Telemetry)
// ==========================================

export async function logTrackPlayAction(trackPlayData: {
  track_id: string;
  listener_location: string;
  listener_id?: string | null;
}) {
  const { error } = await supabaseAdmin.from("track_plays").insert(trackPlayData);
  if (error) throw new Error(error.message);
  revalidatePath("/diagnostics");
  revalidatePath("/royalties");
  return { success: true };
}


