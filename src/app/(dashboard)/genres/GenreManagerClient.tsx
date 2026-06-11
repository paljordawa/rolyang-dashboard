"use client";
import React, { useState } from 'react';
import { createGenre, deleteGenre, updateGenre } from '@/app/actions';
import { Tags, Plus, Trash2, Search, Loader2, Disc3, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // We'll need this for track updates if we do them on client side

export default function GenreManagerClient({ initialGenres, allTracks }: { initialGenres: any[], allTracks: any[] }) {
  const [genres, setGenres] = useState(initialGenres);
  const [tracks, setTracks] = useState(allTracks);
  const [newGenreName, setNewGenreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);

  const toSlug = (str: string) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const getGenreUsageCount = (genreId: string) => {
    return tracks.filter(t => t.genre_ids && t.genre_ids.includes(genreId)).length;
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;

    setLoading(true);
    setError(null);

    const slug = toSlug(newGenreName);
    if (genres.find(g => g.id === slug)) {
      setError('Genre already exists.');
      setLoading(false);
      return;
    }

    try {
      const payload = { id: slug, name: newGenreName.trim() };
      await createGenre(payload);
      setGenres([...genres, payload].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGenreName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGenre = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the genre "${name}"? This will not delete the songs, but it will remove this genre from the filter options.`)) return;
    
    setLoading(true);
    try {
      await deleteGenre(id);
      setGenres(genres.filter(g => g.id !== id));
      if (selectedGenreId === id) setSelectedGenreId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('media').upload(`genres/${fileName}`, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(`genres/${fileName}`);
      const image_url = urlData.publicUrl;

      await updateGenre(id, { image_url });
      setGenres(genres.map(g => g.id === id ? { ...g, image_url } : g));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedGenre = genres.find(g => g.id === selectedGenreId);
  const filteredTracks = selectedGenre ? tracks.filter(t => t.genre_ids && t.genre_ids.includes(selectedGenre.id)) : tracks;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Genre List & Add Form */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
          <div className="bg-black/40 p-4 border-b border-white/10">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Tags className="w-4 h-4 text-indigo-400" /> All Genres
            </h2>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleAddGenre} className="flex gap-2 mb-6">
              <Input 
                value={newGenreName} 
                onChange={e => setNewGenreName(e.target.value)} 
                placeholder="New genre name..." 
                className="bg-black/40 border-white/10"
              />
              <Button type="submit" disabled={loading || !newGenreName.trim()} className="btn-gradient border-0 px-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mb-4 py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <button 
                onClick={() => setSelectedGenreId(null)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${!selectedGenreId ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="font-medium text-sm">All Tracks</span>
                <span className="text-xs bg-black/40 px-2 py-1 rounded-full">{tracks.length}</span>
              </button>

              {genres.length === 0 && (
                <div className="text-center py-6 text-sm text-zinc-500 italic">
                  No genres added yet.
                </div>
              )}

              {genres.map(genre => {
                const count = getGenreUsageCount(genre.id);
                const isSelected = selectedGenreId === genre.id;
                
                return (
                  <div key={genre.id} className="flex gap-2">
                    <button 
                      onClick={() => setSelectedGenreId(genre.id)}
                      className={`flex-1 flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        {genre.image_url ? (
                          <img src={genre.image_url} alt={genre.name} className="w-6 h-6 rounded-md object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                            <Tags className="w-3 h-3 text-zinc-500" />
                          </div>
                        )}
                        <span className="font-medium text-sm">{genre.name}</span>
                      </div>
                      <span className="text-xs bg-black/40 px-2 py-1 rounded-full">{count}</span>
                    </button>
                    
                    <div className="flex flex-col gap-1">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          disabled={loading}
                          className="bg-black/20 border-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 text-zinc-500 px-3 h-6 text-xs w-full justify-center"
                          title="Upload Image"
                        >
                          <ImagePlus className="w-3 h-3" />
                        </Button>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(genre.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={loading}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => handleDeleteGenre(genre.id, genre.name)}
                        disabled={loading}
                        className="bg-black/20 border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 text-zinc-500 px-3 h-6 text-xs w-full justify-center"
                        title="Delete Genre"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column: Track Filtering Results */}
      <div className="lg:col-span-2">
        <Card className="glass-card border-white/10 shadow-xl h-full flex flex-col">
          <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-pink-400" /> 
              {selectedGenre ? `Tracks in "${selectedGenre.name}"` : 'All Tracks'}
            </h2>
            <span className="text-xs font-medium text-zinc-400 bg-black/40 px-2 py-1 rounded-full border border-white/5">
              {filteredTracks.length} Results
            </span>
          </div>
          
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            {filteredTracks.length > 0 ? (
              <div className="overflow-y-auto max-h-[600px] custom-scrollbar p-2">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-zinc-400 uppercase bg-black/20 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">Track</th>
                      <th className="px-4 py-3 font-medium">Genres</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg">Artist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTracks.map(track => (
                      <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 font-medium text-white">
                          {track.title}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {track.genre_ids && track.genre_ids.length > 0 ? track.genre_ids.map((gId: string, i: number) => {
                              const genreName = genres.find(g => g.id === gId)?.name || gId;
                              const isMatch = selectedGenre && gId === selectedGenre.id;
                              return (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${isMatch ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-zinc-400'}`}>
                                  {genreName}
                                </span>
                              );
                            }) : <span className="text-zinc-600 text-xs italic">None</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          <Link href={`/artists/${track.artist_id}`} className="hover:text-indigo-400 hover:underline">
                            {track.artist_id}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Search className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-1">No tracks found</h3>
                <p className="text-zinc-500 text-sm max-w-sm">
                  {selectedGenre 
                    ? `There are no tracks currently tagged with "${selectedGenre.name}".` 
                    : "No tracks exist in the database yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
