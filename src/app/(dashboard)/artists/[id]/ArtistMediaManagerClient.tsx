'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Disc3, Music, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { deleteAlbum, deleteTrack } from '@/app/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ArtistMediaManagerClient({ 
  artistId, 
  initialAlbums, 
  initialTracks 
}: { 
  artistId: string; 
  initialAlbums: any[]; 
  initialTracks: any[]; 
}) {
  const [albums, setAlbums] = useState(initialAlbums);
  const [tracks, setTracks] = useState(initialTracks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

      {/* Albums Section */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h2 className="text-lg font-bold tracking-tight text-white">Discography (Albums)</h2>
          <span className="text-sm text-zinc-400">{albums.length} Releases</span>
        </div>

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

      {/* Tracks Section */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h2 className="text-lg font-bold tracking-tight text-white">All Tracks</h2>
          <span className="text-sm text-zinc-400">{tracks.length} Tracks</span>
        </div>

        {tracks.length > 0 ? (
          <Card className="glass-card border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-400 uppercase bg-black/40">
                  <tr>
                    <th className="px-6 py-4 font-medium">Title</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tracks.map((track: any) => (
                    <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                          <Music className="w-4 h-4 text-zinc-400" />
                        </div>
                        {track.title}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteTrack(track.id, track.title)}
                          disabled={loadingId === track.id}
                          className="h-8 w-8 p-0 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-black/40 text-zinc-400">
            <Music className="w-8 h-8 text-zinc-300 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No tracks yet</h3>
            <p className="text-xs mb-4 text-zinc-400">This artist has no tracks.</p>
          </div>
        )}
      </div>

    </div>
  );
}
