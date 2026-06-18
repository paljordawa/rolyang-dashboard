"use client";
import React, { useState, useEffect } from 'react';
import { createGenre, deleteGenre, updateGenre } from '@/app/actions';
import { Tags, Plus, Trash2, Search, Loader2, Disc3, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function GenreManagerClient({ initialGenres, allTracks }: { initialGenres: any[], allTracks: any[] }) {
  const [genres, setGenres] = useState(initialGenres);
  const [tracks, setTracks] = useState(allTracks);
  const [newGenreName, setNewGenreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);

  // Search & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  // Compute filtered tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenreId
      ? track.genre_ids && track.genre_ids.includes(selectedGenreId)
      : true;
    return matchesSearch && matchesGenre;
  });

  // Reset pagination when search or genre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenreId]);

  // Compute paginated tracks
  const totalPages = Math.ceil(filteredTracks.length / pageSize);
  const paginatedTracks = filteredTracks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Section: Genre Catalog Card */}
      <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
        <div className="bg-black/40 p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Tags className="w-4 h-4 text-indigo-400" /> Genre Catalog
          </h2>
          <form onSubmit={handleAddGenre} className="flex gap-2 w-full sm:w-auto">
            <Input 
              value={newGenreName} 
              onChange={e => setNewGenreName(e.target.value)} 
              placeholder="New genre name..." 
              className="bg-black/45 border-white/10 h-10 text-xs w-full sm:w-60 focus-visible:ring-violet-500"
            />
            <Button type="submit" disabled={loading || !newGenreName.trim()} className="btn-gradient border-0 px-4 h-10 text-xs flex items-center gap-1">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Genre
            </Button>
          </form>
        </div>
        
        <div className="p-4 bg-black/10">
          {error && (
            <Alert variant="destructive" className="mb-4 py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Horizontal scrollable genre list */}
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              onClick={() => setSelectedGenreId(null)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-left shrink-0 cursor-pointer ${!selectedGenreId ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100 font-semibold' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-xs font-semibold">All Tracks ({tracks.length})</span>
            </button>

            {genres.map(genre => {
              const count = getGenreUsageCount(genre.id);
              const isSelected = selectedGenreId === genre.id;
              
              return (
                <div key={genre.id} className="flex gap-2 items-center shrink-0">
                  <button 
                    onClick={() => setSelectedGenreId(genre.id)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all text-left cursor-pointer ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100 font-semibold' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {genre.image_url ? (
                      <img src={genre.image_url} alt={genre.name} className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
                        <Tags className="w-3 h-3 text-zinc-500" />
                      </div>
                    )}
                    <span className="text-xs font-semibold">{genre.name} ({count})</span>
                  </button>
                  
                  {/* Action buttons (only show when the genre is selected/active) */}
                  {isSelected && (
                    <div className="flex gap-1 bg-black/45 border border-white/10 p-1.5 rounded-lg h-10 items-center">
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={loading}
                          className="bg-black/20 border-0 hover:bg-emerald-500/20 hover:text-emerald-400 p-1.5 h-7 w-7 justify-center flex items-center"
                          title="Upload Image"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
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
                        size="sm"
                        onClick={() => handleDeleteGenre(genre.id, genre.name)}
                        disabled={loading}
                        className="bg-black/20 border-0 hover:bg-red-500/20 hover:text-red-400 p-1.5 h-7 w-7 justify-center flex items-center"
                        title="Delete Genre"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Bottom Section: Tracks List Table (Full-Width) */}
      <Card className="glass-card border-white/10 shadow-xl overflow-hidden flex flex-col">
        <div className="bg-black/40 p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Disc3 className="w-5 h-5 text-pink-400" /> 
            <h2 className="font-semibold text-white">
              {selectedGenre ? `Tracks in "${selectedGenre.name}"` : 'All Catalog Tracks'}
            </h2>
            <span className="text-xs font-medium text-zinc-400 bg-black/40 px-2.5 py-1 rounded-full border border-white/5">
              {filteredTracks.length} Results
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <Input
              type="text"
              placeholder="Search by track title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border-white/10 pl-9 pr-4 text-xs h-9 w-full focus-visible:ring-violet-500 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
        
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          {paginatedTracks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-black/40">
                  <tr>
                    <th className="px-6 py-4 font-medium">Track</th>
                    <th className="px-6 py-4 font-medium">Genres</th>
                    <th className="px-6 py-4 font-medium">Artist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTracks.map(track => (
                    <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white">
                        {track.title}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {track.genre_ids && track.genre_ids.length > 0 ? track.genre_ids.map((gId: string, i: number) => {
                            const genreName = genres.find(g => g.id === gId)?.name || gId;
                            const isMatch = selectedGenre && gId === selectedGenre.id;
                            return (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${isMatch ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/40 border-white/10 text-zinc-400'}`}>
                                {genreName}
                              </span>
                            );
                          }) : <span className="text-zinc-600 text-xs italic">None</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
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
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/5">
              <Search className="w-12 h-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-zinc-300 mb-1">No tracks found</h3>
              <p className="text-zinc-500 text-sm max-w-sm">
                Try adjusting your search criteria or selection in the catalog.
              </p>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/25">
            <span className="text-xs text-zinc-400">
              Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-white">
                {Math.min(currentPage * pageSize, filteredTracks.length)}
              </strong>{" "}
              of <strong className="text-white">{filteredTracks.length}</strong> tracks
            </span>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs border-white/10 text-zinc-400 hover:text-white"
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => {
                const shouldShow = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                if (!shouldShow) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="px-1.5 text-zinc-600 text-xs">...</span>;
                  }
                  return null;
                }
                
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 text-xs p-0 ${page === currentPage ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border-white/10 text-zinc-400 hover:text-white'}`}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs border-white/10 text-zinc-400 hover:text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
