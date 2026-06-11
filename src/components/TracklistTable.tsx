import React from 'react';
import { Play, MoreHorizontal, Pencil, Trash2, Clock, AlignLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Track {
  id: string;
  title: string;
  genre: string;
  duration: number;
  lyrics: any;
  color: string;
}

export default function TracklistTable({ tracks }: { tracks: Track[] }) {
  
  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50">
        <p className="text-zinc-500 text-sm">No tracks found in this album.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-[3rem_1fr_120px_80px_60px] gap-4 px-4 py-3 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        <div className="text-center">#</div>
        <div>Title</div>
        <div>Genre</div>
        <div className="flex justify-center"><Clock className="w-4 h-4" /></div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-zinc-100">
        {tracks.map((track, index) => (
          <div key={track.id} className="grid grid-cols-[3rem_1fr_120px_80px_60px] gap-4 px-4 py-3 items-center hover:bg-zinc-50 transition-colors group">
            
            <div className="text-center relative flex justify-center">
              <span className="text-zinc-500 text-sm font-medium group-hover:opacity-0 transition-opacity">{index + 1}</span>
              <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-4 h-4 text-zinc-900 fill-zinc-900" />
              </button>
            </div>
            
            <div className="min-w-0">
              <div className="font-semibold text-sm text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">{track.title}</div>
              {track.lyrics && (
                <div className="flex items-center text-[10px] uppercase tracking-widest font-bold text-zinc-400 mt-0.5">
                  <AlignLeft className="w-3 h-3 mr-1" /> Lyrics Available
                </div>
              )}
            </div>
            
            <div className="text-sm text-zinc-500 truncate">
              {track.genre || '--'}
            </div>
            
            <div className="text-sm text-zinc-500 font-medium tabular-nums text-center">
              {formatDuration(track.duration)}
            </div>
            
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Track
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Track
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
