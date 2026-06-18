"use client";
import React, { useState } from 'react';
import { Users, LayoutGrid, List, MoreVertical, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Artist {
  id: string;
  name: string;
  image_url: string | null;
  followers: string | null;
  total_albums?: number;
  total_singles?: number;
  followers_count?: number;
}

export default function ArtistDirectoryView({ artists }: { artists: Artist[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Defaulting to list for maximum compactness
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (artists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-white/10 rounded-lg bg-black/40 text-zinc-400">
        <Users className="w-8 h-8 text-zinc-400 mb-3" />
        <h3 className="text-lg font-semibold text-white">No artists found</h3>
        <p className="text-sm mb-4">Your database is currently empty.</p>
        <a href="/artists/new">
          <Button size="sm">Add First Artist</Button>
        </a>
      </div>
    );
  }

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredArtists.length / pageSize);
  const paginatedArtists = filteredArtists.slice(
    (currentPage - 1) * pageSize,
    (currentPage - 1) * pageSize + pageSize
  );

  return (
    <div className="w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-2 mb-6 shadow-xl flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <Input
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black/45 border-white/10 text-white placeholder:text-zinc-650 focus-visible:ring-violet-500 h-10 pl-9 w-full"
            />
          </div>
          <div className="text-sm font-medium text-zinc-400 px-1 shrink-0">
            Showing {filteredArtists.length} {filteredArtists.length === 1 ? 'artist' : 'artists'}
          </div>
        </div>
        
        <div className="flex items-center bg-white/10 p-1 rounded-md border border-white/10 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center justify-center px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${
              viewMode === 'list' 
                ? 'bg-black/20 backdrop-blur-md text-white shadow-xl' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center justify-center px-3 py-1.5 rounded-sm text-sm font-medium transition-all ${
              viewMode === 'grid' 
                ? 'bg-black/20 backdrop-blur-md text-white shadow-xl' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Grid
          </button>
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[240px] border border-dashed border-white/10 rounded-lg bg-black/40 text-zinc-400">
          <Users className="w-8 h-8 text-zinc-500 mb-2 opacity-50" />
          <p className="text-sm">No artists match "{searchQuery}"</p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden">
              <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-3 border-b border-white/10 bg-black/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <div className="w-10">Image</div>
                <div>Artist Name</div>
                <div className="text-right">Albums</div>
                <div className="text-right">Singles</div>
                <div className="text-right">Followers</div>
                <div className="w-10"></div>
              </div>
              <div className="divide-y divide-white/10">
                {paginatedArtists.map((artist) => {
                  const parseFollowers = (str: string | null | undefined) => {
                    if (!str) return 0;
                    return parseInt(str.replace(/,/g, '')) || 0;
                  };
                  const displayFollowers = artist.followers_count && artist.followers_count > 0 
                    ? artist.followers_count 
                    : parseFollowers(artist.followers);

                  return (
                    <a key={artist.id} href={`/artists/${artist.id}`} className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-3.5 hover:bg-white/5 transition-colors group">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                        {artist.image_url ? (
                          <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-white group-hover:text-fuchsia-400 transition-colors">
                        {artist.name}
                      </div>
                      <div className="text-right text-sm text-zinc-400 tabular-nums">
                        {artist.total_albums || 0}
                      </div>
                      <div className="text-right text-sm text-zinc-400 tabular-nums">
                        {artist.total_singles || 0}
                      </div>
                      <div className="text-right text-sm text-zinc-400 tabular-nums">
                        {displayFollowers.toLocaleString()}
                      </div>
                      <div className="w-10 flex justify-end" onClick={e => e.preventDefault()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.location.href = `/artists/${artist.id}`}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {paginatedArtists.map((artist) => {
                const parseFollowers = (str: string | null | undefined) => {
                  if (!str) return 0;
                  return parseInt(str.replace(/,/g, '')) || 0;
                };
                const displayFollowers = artist.followers_count && artist.followers_count > 0 
                  ? artist.followers_count 
                  : parseFollowers(artist.followers);

                return (
                  <a key={artist.id} href={`/artists/${artist.id}`} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-zinc-50 shadow-xl mb-3 flex items-center justify-center shrink-0 relative">
                      {artist.image_url ? (
                        <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-zinc-400" />
                      )}
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-full pointer-events-none"></div>
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-fuchsia-400 transition-colors line-clamp-1 w-full">{artist.name}</h3>
                    <p className="text-xs text-zinc-300 mt-1">{displayFollowers.toLocaleString()} followers</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{artist.total_albums || 0} albums • {artist.total_singles || 0} singles</p>
                  </a>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 p-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <span className="text-xs text-zinc-400">
                Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-white">
                  {Math.min(currentPage * pageSize, filteredArtists.length)}
                </strong>{" "}
                of <strong className="text-white">{filteredArtists.length}</strong> artists
              </span>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs border-white/10 text-zinc-400 hover:text-white cursor-pointer"
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
                      className={`h-8 w-8 text-xs p-0 cursor-pointer ${page === currentPage ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border-white/10 text-zinc-400 hover:text-white'}`}
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
                  className="h-8 text-xs border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
