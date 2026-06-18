// src/app/(dashboard)/playlists/PlaylistManagerClient.tsx
"use client";

import React, { useState } from 'react';
import { ListMusic, Plus, Save, Trash2, ArrowUp, ArrowDown, Search, PlusCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { createPlaylistAction, updatePlaylistAction, deletePlaylistAction } from '@/app/actions';

interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  songs: string[];
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  duration: number;
}

interface Artist {
  id: string;
  name: string;
}

interface PlaylistManagerClientProps {
  initialPlaylists: Playlist[];
  allTracks: Track[];
  allArtists: Artist[];
}

export default function PlaylistManagerClient({ initialPlaylists, allTracks, allArtists }: PlaylistManagerClientProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    initialPlaylists.length > 0 ? initialPlaylists[0].id : null
  );
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // New playlist form state
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistCoverUrl, setNewPlaylistCoverUrl] = useState('');
  
  // Track adding dialog state
  const [isAddingTracks, setIsAddingTracks] = useState(false);
  const [trackSearchQuery, setTrackSearchQuery] = useState('');

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId) || null;

  // Map artists for easy access
  const artistMap = React.useMemo(() => {
    const map = new Map<string, string>();
    allArtists.forEach(a => map.set(a.id, a.name));
    return map;
  }, [allArtists]);

  // Handle Cover Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewPlaylist: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `playlist_${Date.now()}.${fileExt}`;
      const filePath = `playlists/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (isNewPlaylist) {
        setNewPlaylistCoverUrl(publicUrl);
      } else if (selectedPlaylist) {
        // Update local state directly for now, save when user clicks "Save Changes"
        setPlaylists(prev => prev.map(p => {
          if (p.id === selectedPlaylist.id) {
            return { ...p, cover_url: publicUrl };
          }
          return p;
        }));
      }
    } catch (err: any) {
      alert(`Error uploading image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Create Playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName) return;

    const id = newPlaylistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `playlist-${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      name: newPlaylistName,
      description: newPlaylistDescription,
      cover_url: newPlaylistCoverUrl || 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=1000',
      songs: []
    };

    try {
      setIsSaving(true);
      await createPlaylistAction(newPlaylist);
      setPlaylists(prev => [...prev, newPlaylist]);
      setSelectedPlaylistId(newPlaylist.id);
      setIsCreating(false);
      
      // Reset form
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistCoverUrl('');
    } catch (err: any) {
      alert(`Error creating playlist: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes to current playlist
  const handleSaveChanges = async () => {
    if (!selectedPlaylist) return;

    try {
      setIsSaving(true);
      await updatePlaylistAction(selectedPlaylist.id, {
        name: selectedPlaylist.name,
        description: selectedPlaylist.description,
        cover_url: selectedPlaylist.cover_url,
        songs: selectedPlaylist.songs
      });
      alert('Playlist updated successfully!');
    } catch (err: any) {
      alert(`Error updating playlist: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;

    try {
      setIsSaving(true);
      await deletePlaylistAction(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      if (selectedPlaylistId === id) {
        const remaining = playlists.filter(p => p.id !== id);
        setSelectedPlaylistId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      alert(`Error deleting playlist: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Update selected playlist fields locally
  const updateSelectedField = (field: keyof Playlist, value: any) => {
    if (!selectedPlaylistId) return;
    setPlaylists(prev => prev.map(p => {
      if (p.id === selectedPlaylistId) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  // Move Song Up
  const moveSongUp = (idx: number) => {
    if (!selectedPlaylist) return;
    if (idx === 0) return;
    const newSongs = [...selectedPlaylist.songs];
    const temp = newSongs[idx];
    newSongs[idx] = newSongs[idx - 1];
    newSongs[idx - 1] = temp;
    updateSelectedField('songs', newSongs);
  };

  // Move Song Down
  const moveSongDown = (idx: number) => {
    if (!selectedPlaylist) return;
    if (idx === selectedPlaylist.songs.length - 1) return;
    const newSongs = [...selectedPlaylist.songs];
    const temp = newSongs[idx];
    newSongs[idx] = newSongs[idx + 1];
    newSongs[idx + 1] = temp;
    updateSelectedField('songs', newSongs);
  };

  // Remove Song
  const removeSong = (trackId: string) => {
    if (!selectedPlaylist) return;
    const newSongs = selectedPlaylist.songs.filter(id => id !== trackId);
    updateSelectedField('songs', newSongs);
  };

  // Add Song
  const addSong = (trackId: string) => {
    if (!selectedPlaylist) return;
    if (selectedPlaylist.songs.includes(trackId)) return;
    const newSongs = [...selectedPlaylist.songs, trackId];
    updateSelectedField('songs', newSongs);
  };

  // Filter tracklist for search dialog
  const filteredTracks = allTracks.filter(track => {
    const matchSearch = track.title.toLowerCase().includes(trackSearchQuery.toLowerCase()) ||
      (artistMap.get(track.artist_id) || '').toLowerCase().includes(trackSearchQuery.toLowerCase());
    const notInPlaylist = selectedPlaylist ? !selectedPlaylist.songs.includes(track.id) : true;
    return matchSearch && notInPlaylist;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Playlists list */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 py-4 flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-white">Curated Playlists</CardTitle>
                <CardDescription className="text-zinc-400">Select a playlist to configure</CardDescription>
              </div>
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20 border border-white/10 shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Playlist
              </Button>
            </CardHeader>
            <CardContent className="p-3">
              {playlists.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No curated playlists found. Click "Create Playlist" to start.
                </div>
              ) : (
                <div className="space-y-1">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border ${selectedPlaylistId === playlist.id ? 'bg-white/10 border-white/15 text-white' : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                          <img src={playlist.cover_url} alt={playlist.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{playlist.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{playlist.songs.length} tracks</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Playlist Editor */}
        <div className="lg:col-span-2">
          {selectedPlaylist ? (
            <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl text-white">Curator Workspace</CardTitle>
                  <CardDescription className="text-zinc-400">Curating "{selectedPlaylist.name}"</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium border border-white/10 cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Playlist Info Panel */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Playlist Cover File Upload */}
                  <div className="md:col-span-1 flex flex-col items-center gap-3">
                    <div className="relative w-32 h-32 md:w-full md:aspect-square bg-zinc-800 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
                      <img src={selectedPlaylist.cover_url} alt="Cover Preview" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity duration-300">
                        <ImageIcon className="w-6 h-6 mb-1 text-zinc-300" />
                        Change Cover
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverUpload(e, false)}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name and Description Inputs */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="playlist-name" className="text-zinc-300">Playlist Name</Label>
                      <Input
                        id="playlist-name"
                        value={selectedPlaylist.name}
                        onChange={(e) => updateSelectedField('name', e.target.value)}
                        className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500"
                        placeholder="e.g. Lhasa Chill"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playlist-desc" className="text-zinc-300">Description</Label>
                      <Textarea
                        id="playlist-desc"
                        value={selectedPlaylist.description}
                        onChange={(e) => updateSelectedField('description', e.target.value)}
                        rows={3}
                        className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500 resize-none"
                        placeholder="Brief summary of the mood or genre..."
                      />
                    </div>
                  </div>
                </div>

                {/* Playlist Tracks List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-white">Tracks inside Playlist</h3>
                    <Button
                      onClick={() => setIsAddingTracks(true)}
                      variant="outline"
                      className="text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/10 cursor-pointer flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Tracks
                    </Button>
                  </div>

                  {selectedPlaylist.songs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-zinc-950/20 text-zinc-500 text-sm">
                      This playlist is currently empty. Click "Add Tracks" to populate it.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {selectedPlaylist.songs.map((songId, index) => {
                        const track = allTracks.find(t => t.id === songId);
                        if (!track) return null;
                        const artistName = artistMap.get(track.artist_id) || 'Unknown Artist';
                        
                        return (
                          <div
                            key={songId}
                            className="flex items-center justify-between p-3 bg-black/20 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-zinc-500 text-xs font-mono w-4 text-center">{index + 1}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-white truncate">{track.title}</p>
                                <p className="text-xs text-zinc-400 truncate">{artistName}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveSongUp(index)}
                                disabled={index === 0}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${index === 0 ? 'text-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                title="Move Up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveSongDown(index)}
                                disabled={index === selectedPlaylist.songs.length - 1}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${index === selectedPlaylist.songs.length - 1 ? 'text-zinc-700' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                title="Move Down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeSong(songId)}
                                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors ml-2 cursor-pointer"
                                title="Remove Track"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-12 bg-zinc-900/30 text-center min-h-[400px]">
              <ListMusic className="w-16 h-16 text-zinc-600 mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-zinc-400">No Playlist Selected</h3>
              <p className="text-zinc-500 max-w-xs mt-1 text-sm">Select a playlist from the left, or create a new one to start curating.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE PLAYLIST DIALOG */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-zinc-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Create Curated Playlist</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Set up a new public playlist category. You can add tracks after creation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePlaylist} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-zinc-300">Playlist Name</Label>
              <Input
                id="new-name"
                required
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500"
                placeholder="e.g. Nomadic Beats"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-desc" className="text-zinc-300">Description</Label>
              <Textarea
                id="new-desc"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                rows={3}
                className="bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500 resize-none"
                placeholder="Describe this playlist..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Playlist Cover</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 shrink-0">
                  {newPlaylistCoverUrl ? (
                    <img src={newPlaylistCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="new-cover"
                    className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-medium border border-white/10 hover:bg-white/5 text-zinc-300 cursor-pointer"
                  >
                    Upload Image
                  </Label>
                  <input
                    id="new-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCoverUpload(e, true)}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <p className="text-xs text-zinc-500">Square images are recommended</p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreating(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Playlist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD SONGS DIALOG */}
      <Dialog open={isAddingTracks} onOpenChange={setIsAddingTracks}>
        <DialogContent className="bg-zinc-900 border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Add Tracks to Playlist</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select tracks from the catalog to add to this playlist.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
              <Input
                value={trackSearchQuery}
                onChange={(e) => setTrackSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-950/40 border-white/10 text-white focus-visible:ring-violet-500"
                placeholder="Search by track title or artist..."
              />
            </div>

            {/* Track List */}
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
              {filteredTracks.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  {trackSearchQuery ? 'No matching tracks found.' : 'No available tracks to add.'}
                </div>
              ) : (
                filteredTracks.map(track => {
                  const artistName = artistMap.get(track.artist_id) || 'Unknown Artist';
                  return (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2.5 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{track.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{artistName}</p>
                      </div>
                      <Button
                        onClick={() => addSong(track.id)}
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                      >
                        Add
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsAddingTracks(false);
                setTrackSearchQuery('');
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white w-full cursor-pointer"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
