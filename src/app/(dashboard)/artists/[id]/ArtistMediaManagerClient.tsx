'use client';
 
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Disc3, Music, Trash2, Edit, Loader2, Image as ImageIcon, Users, Save } from 'lucide-react';
import Link from 'next/link';
import { deleteAlbum, deleteTrack, updateTrackAction, updateArtistProfileAction } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export default function ArtistMediaManagerClient({ 
  artistId, 
  userId,
  artistName,
  artistBio,
  artistImageUrl,
  artistFollowers = '0',
  initialAlbums, 
  initialTracks,
  genres = []
}: { 
  artistId: string; 
  userId?: string;
  artistName?: string;
  artistBio?: string;
  artistImageUrl?: string;
  artistFollowers?: string;
  initialAlbums: any[]; 
  initialTracks: any[]; 
  genres?: { id: string; name: string }[];
}) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [tracks, setTracks] = useState(initialTracks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const singles = tracks.filter(t => !t.album_id);
  const [activeTab, setActiveTab] = useState<'albums' | 'singles'>('albums');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all');

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedAlbumFilter === 'all') return matchesSearch;
    if (selectedAlbumFilter === 'singles') return matchesSearch && !track.album_id;
    return matchesSearch && track.album_id === selectedAlbumFilter;
  });

  // Profile fields state
  const [artistNameState, setArtistNameState] = useState(artistName || '');
  const [artistBioState, setArtistBioState] = useState(artistBio || '');
  const [artistImageUrlState, setArtistImageUrlState] = useState(artistImageUrl || '');

  // Edit Profile inline state
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editArtistName, setEditArtistName] = useState(artistName || '');
  const [editArtistBio, setEditArtistBio] = useState(artistBio || '');
  const [editArtistImageUrl, setEditArtistImageUrl] = useState(artistImageUrl || '');
  const [editArtistImageFile, setEditArtistImageFile] = useState<File | null>(null);
  const [editArtistImagePreview, setEditArtistImagePreview] = useState<string | null>(artistImageUrl || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!editArtistImageFile) return;
    const url = URL.createObjectURL(editArtistImageFile);
    setEditArtistImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editArtistImageFile]);

  const handleStartInlineEdit = () => {
    setEditArtistName(artistNameState);
    setEditArtistBio(artistBioState);
    setEditArtistImageUrl(artistImageUrlState);
    setEditArtistImageFile(null);
    setEditArtistImagePreview(artistImageUrlState);
    setIsEditingInline(true);
  };

  const handleSaveProfile = async () => {
    if (!editArtistName.trim()) {
      alert("Artist name is required.");
      return;
    }

    setIsSavingProfile(true);
    setError(null);

    try {
      let finalImageUrl = artistImageUrlState;

      // 1. Upload new image if selected
      if (editArtistImageFile) {
        const fileExt = editArtistImageFile.name.split('.').pop() || 'jpg';
        const filePath = `artists/${artistId}/profile_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, editArtistImageFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Failed to upload profile picture: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // 2. Call Server Action
      await updateArtistProfileAction(artistId, userId!, editArtistName, editArtistBio, finalImageUrl);

      // 3. Update local states
      setArtistNameState(editArtistName);
      setArtistBioState(editArtistBio);
      setArtistImageUrlState(finalImageUrl);

      setIsEditingInline(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Edit Track State
  const [editingTrack, setEditingTrack] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editGenreIds, setEditGenreIds] = useState<string[]>([]);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editCoverFile) {
      return;
    }
    const url = URL.createObjectURL(editCoverFile);
    setEditCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editCoverFile]);

  const handleEditClick = (track: any) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditYear(track.year || '');
    setEditColor(track.color || '#4f46e5');
    setEditGenreIds(track.track_genres ? track.track_genres.map((tg: any) => tg.genre_id) : []);
    setEditCoverFile(null);
    setEditCoverPreview(track.cover_url || '');
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    if (!editTitle.trim()) {
      alert("Track title is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let coverUrl = editingTrack.cover_url;

      // Upload new cover file if provided (only for singles)
      if (editCoverFile && !editingTrack.album_id) {
        const coverExt = editCoverFile.name.split('.').pop();
        const folderPath = `artists/${artistId}/${editYear ? `${editYear}-` : ''}singles`;
        const coverPath = `${folderPath}/${editingTrack.id}-cover.${coverExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(coverPath, editCoverFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Failed to upload cover art: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(coverPath);
        
        coverUrl = publicUrlData.publicUrl;
      }

      // Track updates
      const trackUpdates: any = {
        title: editTitle,
        color: editColor
      };

      if (!editingTrack.album_id) {
        trackUpdates.year = editYear || null;
        trackUpdates.cover_url = coverUrl;
      }

      // Run Server Action
      await updateTrackAction(editingTrack.id, trackUpdates, editGenreIds);

      // Update local state
      setTracks(tracks.map(t => {
        if (t.id === editingTrack.id) {
          return {
            ...t,
            title: editTitle,
            color: editColor,
            year: !editingTrack.album_id ? editYear : t.year,
            cover_url: coverUrl,
            track_genres: editGenreIds.map(gId => ({ genre_id: gId }))
          };
        }
        return t;
      }));

      // Close modal
      setEditingTrack(null);
    } catch (err: any) {
      setError(err.message || "Failed to update track");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenreToggle = (genreId: string) => {
    setEditGenreIds(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId].slice(0, 3) // maximum 3 genres
    );
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault(); // Prevent navigating to album
    if (!confirm(`Are you sure you want to delete the album "${title}"?`)) return;
    
    setLoadingId(id);
    setError(null);
    try {
      await deleteAlbum(id);
      setAlbums(albums.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingId(null);
  };

  const handleDeleteTrack = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the track "${title}"?`)) return;
    
    setLoadingId(id);
    setError(null);
    try {
      await deleteTrack(id);
      setTracks(tracks.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Header */}
      {userId && (
        <>
          <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl mb-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden">
            
            {/* Small Profile Image (with overlay upload in inline edit mode) */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-white/10 shrink-0 bg-white/10 flex items-center justify-center z-10 group">
              {isEditingInline ? (
                <>
                  {editArtistImagePreview ? (
                    <img src={editArtistImagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-zinc-300" />
                  )}
                  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="w-5 h-5 text-white mb-1" />
                    <span className="text-[9px] text-white font-semibold uppercase tracking-wider text-center">Change</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditArtistImageFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </>
              ) : (
                <>
                  {artistImageUrlState ? (
                    <img src={artistImageUrlState} alt={artistNameState} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-zinc-300" />
                  )}
                </>
              )}
            </div>
            
            <div className="flex-1 min-w-0 relative z-10 space-y-2 w-full">
              {isEditingInline ? (
                <>
                  <div className="flex items-center gap-3">
                    <Input
                      value={editArtistName}
                      onChange={(e) => setEditArtistName(e.target.value)}
                      placeholder="Artist Name"
                      className="h-9 text-lg font-bold bg-white/5 border-white/10 text-white focus-visible:ring-violet-500 max-w-[280px]"
                      required
                    />
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-white/10">
                      {artistFollowers ? parseInt(artistFollowers).toLocaleString() : '0'} Followers
                    </span>
                  </div>
                  <Input
                    value={editArtistBio}
                    onChange={(e) => setEditArtistBio(e.target.value)}
                    placeholder="Short artist biography..."
                    className="h-9 text-xs bg-white/5 border-white/10 text-zinc-300 focus-visible:ring-violet-500 w-full max-w-xl"
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold tracking-tight text-white truncate">{artistNameState}</h2>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-400 border border-white/10">
                      {artistFollowers ? parseInt(artistFollowers).toLocaleString() : '0'} Followers
                    </span>
                  </div>
                  
                  {artistBioState ? (
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-4xl line-clamp-2">
                      {artistBioState}
                    </p>
                  ) : (
                    <p className="text-zinc-400 text-sm italic">No biography provided.</p>
                  )}
                </>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2 relative z-10 w-full md:w-auto">
              {isEditingInline ? (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditingInline(false)}
                    disabled={isSavingProfile}
                    className="w-full md:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full md:w-auto btn-gradient border-0 text-white font-semibold flex items-center gap-1.5 text-xs h-9 px-4"
                  >
                    {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleStartInlineEdit}
                    className="w-full md:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-colors h-9 px-4"
                  >
                    Edit Profile
                  </Button>
                  <Link href="/upload" className="w-full md:w-auto">
                    <Button size="sm" className="w-full btn-gradient border-0 h-9 px-4">
                      <Music className="w-4 h-4 mr-2" /> Upload Release
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Faint background tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-50 pointer-events-none opacity-5" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/25 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white mb-1">{tracks?.length || 0}</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Tracks</span>
            </div>
            <div className="bg-black/25 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white mb-1">{albums?.length || 0}</span>
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Total Albums</span>
            </div>
          </div>
        </>
      )}

      {/* Discography Sections with Tabs */}
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-white/10">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('albums')}
              className={`text-base font-bold pb-3 border-b-2 transition-all -mb-[1px] cursor-pointer ${
                activeTab === 'albums'
                  ? 'border-fuchsia-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Albums ({albums.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('singles')}
              className={`text-base font-bold pb-3 border-b-2 transition-all -mb-[1px] cursor-pointer ${
                activeTab === 'singles'
                  ? 'border-fuchsia-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Singles ({singles.length})
            </button>
          </div>
        </div>

        {activeTab === 'albums' ? (
          <div>
            {albums.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album: any) => (
                  <Link key={album.id} href={`/albums/${album.id}`} className="group block relative">
                    <Card className="h-full shadow-xl hover:shadow-md transition-all border-white/10 group-hover:border-indigo-300 overflow-hidden bg-black/20 backdrop-blur-md">
                      <CardContent className="p-3 flex flex-col h-full relative">
                        <div className="aspect-square rounded flex items-center justify-center relative overflow-hidden mb-3 bg-white/10 border border-zinc-100">
                          {album.cover_url ? (
                            <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <Disc3 className="w-8 h-8 text-zinc-300" />
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-indigo-600 transition-colors" title={album.title}>{album.title}</h3>
                        <div className="flex items-center text-xs font-medium text-zinc-400 mt-1">
                          {album.year || 'Unknown'}
                        </div>

                        {/* Quick Actions overlay */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 border-0 text-white shadow-lg"
                            onClick={(e) => handleDeleteAlbum(e, album.id, album.title)}
                            disabled={loadingId === album.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-400">
                <Disc3 className="w-8 h-8 text-zinc-300 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No albums yet</h3>
                <p className="text-xs mb-4 text-zinc-400">This artist has no albums.</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {singles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {singles.map((single: any) => (
                  <div key={single.id} className="group block relative">
                    <Card className="h-full shadow-xl transition-all border-white/10 hover:border-indigo-300 overflow-hidden bg-black/20 backdrop-blur-md">
                      <CardContent className="p-3 flex flex-col h-full relative">
                        <div className="aspect-square rounded flex items-center justify-center relative overflow-hidden mb-3 bg-white/10 border border-zinc-100">
                          {single.cover_url ? (
                            <img src={single.cover_url} alt={single.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <Music className="w-8 h-8 text-zinc-300" />
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-indigo-600 transition-colors" title={single.title}>{single.title}</h3>
                        <div className="flex items-center text-xs font-medium text-zinc-400 mt-1">
                          {single.year || 'Unknown'}
                        </div>

                        {/* Quick Actions overlay */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg"
                            onClick={() => handleEditClick(single)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 bg-red-500/80 hover:bg-red-600 border-0 text-white shadow-lg"
                            onClick={() => handleDeleteTrack(single.id, single.title)}
                            disabled={loadingId === single.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-400">
                <Music className="w-8 h-8 text-zinc-300 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No singles yet</h3>
                <p className="text-xs mb-4 text-zinc-400">This artist has no singles.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tracks Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-white/10 pb-2 gap-4">
          <h2 className="text-lg font-bold tracking-tight text-white">All Tracks</h2>
          <span className="text-sm text-zinc-400">
            {searchQuery || selectedAlbumFilter !== 'all' ? (
              <span>Showing {filteredTracks.length} of {tracks.length} tracks</span>
            ) : (
              <span>{tracks.length} Tracks</span>
            )}
          </span>
        </div>

        {tracks.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by track title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500 h-10 text-sm"
              />
            </div>
            <div className="w-full sm:w-60">
              <select
                value={selectedAlbumFilter}
                onChange={(e) => setSelectedAlbumFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
              >
                <option value="all" className="bg-zinc-950">All Releases</option>
                <option value="singles" className="bg-zinc-950">Singles Only</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id} className="bg-zinc-950">
                    {album.title} (Album)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tracks.length > 0 ? (
          filteredTracks.length > 0 ? (
            <Card className="glass-card border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 uppercase bg-black/40">
                    <tr>
                      <th className="px-6 py-4 font-medium">Title</th>
                      <th className="px-6 py-4 font-medium">Release / Album</th>
                      <th className="px-6 py-4 font-medium text-right pr-12">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTracks.map((track: any) => {
                      const album = albums.find(a => a.id === track.album_id);
                      const coverUrl = track.cover_url || album?.cover_url;
                      return (
                        <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                              {coverUrl ? (
                                <img src={coverUrl} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                            {track.title}
                          </td>
                          <td className="px-6 py-4 text-zinc-300">
                            {album ? (
                              <Link href={`/albums/${album.id}`} className="hover:underline hover:text-indigo-400 transition-colors">
                                {album.title} (Album)
                              </Link>
                            ) : (
                              <span className="text-zinc-500 font-medium">Single</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2 pr-12">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditClick(track)}
                              className="h-8 w-8 p-0 border-white/10 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteTrack(track.id, track.title)}
                              disabled={loadingId === track.id}
                              className="h-8 w-8 p-0 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-400">
              <Music className="w-8 h-8 text-zinc-300 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">No matching tracks</h3>
              <p className="text-xs text-zinc-400">Try adjusting your search query or release filter.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-400">
            <Music className="w-8 h-8 text-zinc-300 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No tracks yet</h3>
            <p className="text-xs mb-4 text-zinc-400">This artist has no tracks.</p>
          </div>
        )}
      </div>

      {/* Edit Track Dialog */}
      {editingTrack && (
        <Dialog open={!!editingTrack} onOpenChange={(open) => !open && setEditingTrack(null)}>
          <DialogContent className="sm:max-w-[500px] bg-zinc-950 text-white border border-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Track Metadata</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Update details for "{editingTrack.title}"
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveTrack} className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="trackTitle" className="text-sm font-semibold text-zinc-300">Track Title</Label>
                <Input
                  id="trackTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-black/40 border-white/10 text-white focus-visible:ring-violet-500"
                  required
                />
              </div>

              {/* Year (Singles only) */}
              {!editingTrack.album_id && (
                <div className="space-y-2">
                  <Label htmlFor="trackYear" className="text-sm font-semibold text-zinc-300">Release Year</Label>
                  <Input
                    id="trackYear"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-violet-500"
                  />
                </div>
              )}

              {/* Cover Art (Singles only) */}
              {!editingTrack.album_id && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-zinc-300">Cover Art</Label>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {editCoverPreview ? (
                        <img src={editCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <Label className="cursor-pointer">
                      <div className="px-4 py-2 border border-white/15 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-zinc-300">
                        Choose Image
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setEditCoverFile(e.target.files[0]);
                          }
                        }}
                      />
                    </Label>
                  </div>
                </div>
              )}

              {/* Genres */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-300 block mb-1">
                  Genres (Select up to 3)
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-black/45 border border-white/10 rounded-lg">
                  {genres.map((genre: any) => {
                    const isSelected = editGenreIds.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleGenreToggle(genre.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                            : 'bg-transparent border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {genre.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Color */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-300 block">Theme Color</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center border border-white/10 rounded-md overflow-hidden bg-black/40 w-28">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer ml-[-4px]"
                    />
                    <span className="text-sm text-zinc-300 uppercase flex-1 pr-3 text-right">{editColor}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingTrack(null)}
                  className="text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="btn-gradient border-0 text-white font-semibold flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
}
