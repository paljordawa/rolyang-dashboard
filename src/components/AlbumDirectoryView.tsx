"use client";
import React, { useState } from 'react';
import { Disc3, LayoutGrid, List, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  year: string | null;
  artist_name?: string; // Passed from join
}

export default function AlbumDirectoryView({ albums }: { albums: Album[] }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-white/10 rounded-lg bg-black/40 text-zinc-400">
        <Disc3 className="w-8 h-8 text-zinc-400 mb-3" />
        <h3 className="text-lg font-semibold text-white">No albums found</h3>
        <p className="text-sm mb-4">Your database is currently empty.</p>
        <a href="/upload">
          <Button size="sm">Upload First Release</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-2 mb-6 shadow-xl">
        <div className="text-sm font-medium text-zinc-400 px-3">
          Showing {albums.length} releases
        </div>
        
        <div className="flex items-center bg-white/10 p-1 rounded-md border border-white/10">
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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 px-6 py-3 border-b border-white/10 bg-black/40 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="w-10">Cover</div>
            <div>Album Title</div>
            <div>Artist</div>
            <div className="w-20 text-right">Year</div>
            <div className="w-10"></div>
          </div>
          <div className="divide-y divide-zinc-100">
            {albums.map((album) => (
              <a key={album.id} href={`/albums/${album.id}`} className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 px-6 py-3 hover:bg-black/40 transition-colors group">
                <div className="w-10 h-10 rounded overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <Disc3 className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-fuchsia-400 transition-colors truncate">
                  {album.title}
                </div>
                <div className="text-sm text-zinc-400 truncate">
                  {album.artist_name || 'Unknown Artist'}
                </div>
                <div className="w-20 text-right text-sm text-zinc-400">
                  {album.year || '--'}
                </div>
                <div className="w-10 flex justify-end" onClick={e => e.preventDefault()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.location.href = `/albums/${album.id}`}>
                        View Tracklist
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Album
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {albums.map((album) => (
            <a key={album.id} href={`/albums/${album.id}`} className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-3 hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col">
              <div className="w-full aspect-square rounded overflow-hidden bg-white/10 border border-zinc-100 shadow-xl mb-3 flex items-center justify-center relative">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Disc3 className="w-8 h-8 text-zinc-400" />
                )}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-fuchsia-400 transition-colors line-clamp-1 w-full" title={album.title}>{album.title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{album.artist_name || 'Unknown'}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


