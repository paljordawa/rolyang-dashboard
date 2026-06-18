'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Disc3, Music, GripVertical, Save, ArrowLeft, Image as ImageIcon, Loader2, Check, FileText, Sparkles, RotateCcw, Play, Pause, Edit, Clock } from 'lucide-react';
import { updateAlbumDetailsAction } from '@/app/actions';
import { supabase } from '@/lib/supabase';

// dnd-kit imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Genre {
  id: string;
  name: string;
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
  album_id: string;
  duration: number;
  color: string;
  audio_url: string;
  cover_url: string | null;
  lyrics: any;
  track_genres?: { genre_id: string }[];
  genre_ids?: string[];
}

interface Album {
  id: string;
  title: string;
  artist_id: string;
  year: string | null;
  cover_url: string;
}

interface AlbumDetailsClientProps {
  album: Album;
  initialTracks: Track[];
  genres: Genre[];
  artistId: string;
  userRole: string;
}

function SortableTrackRow({
  track,
  index,
  onUpdateTrack,
  onOpenLyrics,
  genres,
}: {
  track: Track;
  index: number;
  onUpdateTrack: (id: string, updates: Partial<Track>) => void;
  onOpenLyrics: (track: Track) => void;
  genres: Genre[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  const [openGenre, setOpenGenre] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const selectedGenreIds = track.genre_ids || [];

  const handleGenreToggle = (genreId: string) => {
    const current = [...selectedGenreIds];
    const exists = current.includes(genreId);
    let updated;
    if (exists) {
      updated = current.filter((id) => id !== genreId);
    } else {
      updated = [...current, genreId].slice(0, 3); // max 3
    }
    onUpdateTrack(track.id, { genre_ids: updated });
  };

  const hasLyrics = track.lyrics && ((Array.isArray(track.lyrics) && track.lyrics.length > 0) || (track.lyrics.type && (track.lyrics.text || track.lyrics.lines?.length)));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-black/25 backdrop-blur-md border rounded-xl ${
        isDragging
          ? 'border-violet-500 shadow-md ring-1 ring-violet-500/30'
          : 'border-white/10 shadow-xl hover:border-white/20 transition-colors'
      }`}
    >
      {/* Reorder Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-300 shrink-0 p-1">
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Index */}
      <div className="w-6 text-sm font-semibold text-zinc-500 text-center shrink-0">
        {index + 1}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <Input
          value={track.title}
          onChange={(e) => onUpdateTrack(track.id, { title: e.target.value })}
          className="h-10 text-sm font-medium border-white/10 shadow-none focus-visible:ring-violet-500 bg-black/30"
          placeholder="Track Title"
        />
      </div>

      {/* Genre Selector */}
      <Popover open={openGenre} onOpenChange={setOpenGenre}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-1 flex-wrap h-auto min-h-[40px] px-3 py-1.5 text-xs border border-white/10 rounded-md bg-black/30 cursor-pointer hover:bg-white/5 w-48 shrink-0">
            {selectedGenreIds.length > 0 ? (
              selectedGenreIds.map((gId) => {
                const genre = genres.find((g) => g.id === gId);
                return (
                  <span
                    key={gId}
                    className="flex items-center gap-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenreToggle(gId);
                    }}
                  >
                    {genre?.name || 'Genre'}
                    <span className="text-violet-400 hover:text-white font-bold ml-0.5">&times;</span>
                  </span>
                );
              })
            ) : (
              <span className="text-zinc-500 text-xs ml-1">Select Genres (Max 3)</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0 bg-zinc-950 border border-white/10 text-white" align="start">
          <Command className="bg-transparent text-white">
            <CommandInput placeholder="Search genre..." className="text-white placeholder:text-zinc-500" />
            <CommandList className="max-h-48 overflow-y-auto">
              <CommandEmpty className="text-zinc-500 text-xs p-2 text-center">No genre found.</CommandEmpty>
              <CommandGroup>
                {genres.map((genre) => {
                  const isSelected = selectedGenreIds.includes(genre.id);
                  return (
                    <CommandItem
                      key={genre.id}
                      value={genre.name}
                      onSelect={() => handleGenreToggle(genre.id)}
                      className="cursor-pointer hover:bg-white/10 py-1.5 px-3 text-xs flex justify-between items-center"
                    >
                      <span className="text-zinc-300">{genre.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-violet-400" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Theme Color Picker */}
      <div className="shrink-0 flex items-center border border-white/10 rounded-md overflow-hidden bg-black/30 h-10 w-24">
        <input
          type="color"
          value={track.color || '#4f46e5'}
          onChange={(e) => onUpdateTrack(track.id, { color: e.target.value })}
          className="w-8 h-10 p-0 border-0 bg-transparent cursor-pointer ml-[-4px]"
        />
        <span className="text-[10px] text-zinc-300 font-mono uppercase pr-2 ml-1 truncate w-14">{track.color || '#4f46e5'}</span>
      </div>

      {/* Lyrics button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOpenLyrics(track)}
        className={`h-10 px-3 border border-white/10 shrink-0 font-medium text-xs flex items-center gap-1.5 ${
          hasLyrics
            ? 'bg-fuchsia-500/25 border-fuchsia-500/50 text-fuchsia-300 hover:bg-fuchsia-500/30 hover:text-fuchsia-200'
            : 'bg-black/30 text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <FileText className="w-4 h-4" />
        {hasLyrics ? 'Lyrics' : 'Add Lyrics'}
      </Button>
    </div>
  );
}

export default function AlbumDetailsClient({
  album,
  initialTracks,
  genres,
  artistId,
  userRole,
}: AlbumDetailsClientProps) {
  const router = useRouter();

  // Sort initial tracks by their track index suffix
  const sortedTracks = React.useMemo(() => {
    return [...initialTracks].sort((a, b) => {
      const numA = parseInt(a.id.split('-t').pop() || '0');
      const numB = parseInt(b.id.split('-t').pop() || '0');
      return numA - numB;
    });
  }, [initialTracks]);

  // Main state
  const [albumTitle, setAlbumTitle] = useState(album.title);
  const [releaseYear, setReleaseYear] = useState(album.year || '');
  const [tracks, setTracks] = useState<Track[]>(() => {
    return sortedTracks.map(t => ({
      ...t,
      genre_ids: t.track_genres ? t.track_genres.map(tg => tg.genre_id) : []
    }));
  });

  // Cover image uploads
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(album.cover_url);

  // Lyrics dialog states
  const [editingLyricsTrack, setEditingLyricsTrack] = useState<Track | null>(null);
  const [rawLyricsText, setRawLyricsText] = useState('');
  const [translationLyricsText, setTranslationLyricsText] = useState('');
  const [activeInputTab, setActiveInputTab] = useState<'bo' | 'en'>('bo');
  const [lyricsState, setLyricsState] = useState<'input' | 'sync'>('input');
  const [lyricLines, setLyricLines] = useState<{ time: number; text: string; translation?: string }[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // References for spacebar syncing to avoid keydown re-binding issues
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTimeRef = useRef(0);
  const currentLineIndexRef = useRef(0);
  const lyricLinesRef = useRef<any[]>([]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    currentLineIndexRef.current = currentLineIndex;
  }, [currentLineIndex]);

  useEffect(() => {
    lyricLinesRef.current = lyricLines;
  }, [lyricLines]);

  const markTimestamp = () => {
    const lines = lyricLinesRef.current;
    const idx = currentLineIndexRef.current;
    const time = currentTimeRef.current;
    
    if (idx >= lines.length) return;
    const updated = [...lines];
    updated[idx].time = Math.round(time * 10) / 10;
    setLyricLines(updated);
    if (idx < lines.length - 1) {
      setCurrentLineIndex(idx + 1);
    }
  };

  // Spacebar handler for synchronization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingLyricsTrack && lyricsState === 'sync') {
        if (e.code === 'Space') {
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return;
          }
          e.preventDefault();
          markTimestamp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingLyricsTrack, lyricsState]);

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!coverFile) return;
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleUpdateTrack = (id: string, updates: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleOpenLyrics = (track: Track) => {
    setEditingLyricsTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setActiveInputTab('bo');

    let boText = '';
    let enText = '';
    let parsedLines: { time: number; text: string; translation?: string }[] = [];

    if (track.lyrics) {
      if (Array.isArray(track.lyrics)) {
        parsedLines = track.lyrics;
        boText = track.lyrics.map((l: any) => {
          if (l.time > 0) {
            const minutes = Math.floor(l.time / 60);
            const seconds = (l.time % 60).toFixed(2);
            const minStr = String(minutes).padStart(2, '0');
            const secStr = String(seconds).padStart(5, '0');
            return `[${minStr}:${secStr}]${l.text}`;
          }
          return l.text;
        }).join('\n');

        enText = track.lyrics.map((l: any) => l.translation || '').join('\n');
      } else if (track.lyrics.type === 'synced' && Array.isArray(track.lyrics.lines)) {
        parsedLines = track.lyrics.lines;
        boText = track.lyrics.lines.map((l: any) => {
          const minutes = Math.floor(l.time / 60);
          const seconds = (l.time % 60).toFixed(2);
          const minStr = String(minutes).padStart(2, '0');
          const secStr = String(seconds).padStart(5, '0');
          return `[${minStr}:${secStr}]${l.text}`;
        }).join('\n');

        enText = track.lyrics.lines.map((l: any) => l.translation || '').join('\n');
      } else if (track.lyrics.type === 'plain' && track.lyrics.text) {
        boText = track.lyrics.text;
        parsedLines = boText.split('\n').map(l => ({ time: -1, text: l.trim() })).filter(l => l.text.length > 0);
      }
    }

    setRawLyricsText(boText);
    setTranslationLyricsText(enText);

    // If we already have synced timestamps in the lyrics
    const hasSync = parsedLines.length > 0 && parsedLines.some(l => l.time > 0);
    if (hasSync) {
      setLyricLines(parsedLines);
      setLyricsState('sync');
      setCurrentLineIndex(0);
    } else {
      setLyricLines([]);
      setLyricsState('input');
      setCurrentLineIndex(0);
    }
  };

  const startSync = () => {
    // 1. Split Tibetan text into lines
    const boLinesRaw = rawLyricsText.split('\n');
    const boLines: { time: number; text: string }[] = [];
    const lrcRegex = /^\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\](.*)/;
    let hasTimestamps = false;

    for (const line of boLinesRaw) {
      const clean = line.trim();
      if (!clean) continue;
      const match = clean.match(lrcRegex);
      if (match) {
        hasTimestamps = true;
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        boLines.push({
          time: (minutes * 60) + seconds,
          text: match[3].trim(),
        });
      } else {
        boLines.push({
          time: -1,
          text: clean,
        });
      }
    }

    if (hasTimestamps) {
      boLines.sort((a, b) => a.time - b.time);
    }

    // 2. Split English translation text into lines
    const enLines = translationLyricsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // 3. Align them line-by-line
    const combinedLength = Math.max(boLines.length, enLines.length);
    const combined: { time: number; text: string; translation?: string }[] = [];

    for (let i = 0; i < combinedLength; i++) {
      combined.push({
        time: boLines[i] ? boLines[i].time : -1,
        text: boLines[i] ? boLines[i].text : '',
        translation: enLines[i] || '',
      });
    }

    setLyricLines(combined);
    setLyricsState('sync');
    setCurrentLineIndex(0);
  };

  const resetTimings = () => {
    setLyricLines(prev => prev.map(l => ({ ...l, time: -1 })));
    setCurrentLineIndex(0);
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const formatTime = (secs: number) => {
    if (secs < 0 || isNaN(secs)) return '--:--';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const adjustTimestamp = (index: number, val: string) => {
    const time = parseFloat(val);
    const updated = [...lyricLines];
    updated[index].time = isNaN(time) ? -1 : time;
    setLyricLines(updated);
  };

  const adjustText = (index: number, val: string) => {
    const updated = [...lyricLines];
    updated[index].text = val;
    setLyricLines(updated);
  };

  const adjustTranslation = (index: number, val: string) => {
    const updated = [...lyricLines];
    updated[index].translation = val;
    setLyricLines(updated);
  };

  const handleSaveLyrics = () => {
    if (!editingLyricsTrack) return;
    
    let finalLyrics = null;
    if (lyricsState === 'sync') {
      // Clean up lines: if some lines were left unsynced (-1), set to 0 to prevent crash in player
      const cleaned = lyricLines.map(l => ({
        time: l.time < 0 ? 0 : l.time,
        text: l.text,
        translation: l.translation || ''
      }));
      finalLyrics = cleaned;
    } else {
      // Just raw text parsing
      if (rawLyricsText.trim()) {
        const boLines = rawLyricsText.split('\n').map(line => {
          const cleanLine = line.trim();
          const lrcRegex = /^\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\](.*)/;
          const match = cleanLine.match(lrcRegex);
          if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            return {
              time: (minutes * 60) + seconds,
              text: match[3].trim()
            };
          }
          return {
            time: 0,
            text: cleanLine
          };
        }).filter(l => l.text.length > 0);

        const enLines = translationLyricsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const combinedLength = Math.max(boLines.length, enLines.length);
        const combined = [];

        for (let i = 0; i < combinedLength; i++) {
          combined.push({
            time: boLines[i] ? boLines[i].time : 0,
            text: boLines[i] ? boLines[i].text : '',
            translation: enLines[i] || '',
          });
        }
        finalLyrics = combined;
      }
    }

    handleUpdateTrack(editingLyricsTrack.id, { lyrics: finalLyrics });
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setEditingLyricsTrack(null);
  };

  const handleSaveAll = async () => {
    if (!albumTitle.trim()) {
      setError('Album Title is required.');
      return;
    }
    const emptyTrackTitle = tracks.some(t => !t.title.trim());
    if (emptyTrackTitle) {
      setError('All tracks must have a title.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let coverUrl = album.cover_url;

      // Upload cover file if a new one is selected
      if (coverFile) {
        const toSlug = (str: string) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
        const artistSlug = artistId;
        const albumSlug = toSlug(albumTitle);
        const folderPath = `artists/${artistSlug}/${releaseYear ? `${releaseYear}-` : ''}${albumSlug}`;
        const coverExt = coverFile.name.split('.').pop();
        const coverPath = `${folderPath}/cover.${coverExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(coverPath, coverFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Failed to upload cover art: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(coverPath);
        
        coverUrl = publicUrlData.publicUrl;
      }

      const albumUpdates = {
        title: albumTitle,
        year: releaseYear || null,
        cover_url: coverUrl,
      };

      // Prepare track update data in the correct index order
      const tracksUpdates = tracks.map((track) => ({
        title: track.title,
        color: track.color || '#4f46e5',
        lyrics: track.lyrics,
        audio_url: track.audio_url,
        duration: track.duration,
        genre_ids: track.genre_ids,
      }));

      // Call Server Action
      await updateAlbumDetailsAction(album.id, albumUpdates, tracksUpdates);

      setSuccess(true);
      setTimeout(() => {
        router.push('/discography');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full py-10 px-8 space-y-6 text-white">
      {/* Back button */}
      <div>
        <Button
          onClick={() => router.push('/discography')}
          variant="ghost"
          size="sm"
          className="text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discography
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 border-b border-white/10 pb-4">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="btn-gradient border-0 text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/25"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving Changes...' : 'Save All Changes'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> Album updated successfully! Redirecting...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="glass-card border-white/10 bg-black/20 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Album Information</CardTitle>
              <CardDescription className="text-zinc-500">Edit general details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Cover Art selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-zinc-300">Cover Art</Label>
                <div className="flex flex-col items-center gap-4 p-4 border border-dashed border-white/10 rounded-xl bg-black/40">
                  <div className="w-40 h-40 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative group">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-zinc-600" />
                    )}
                  </div>
                  <Label className="cursor-pointer w-full text-center">
                    <div className="w-full px-4 py-2 border border-white/15 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-sm font-semibold text-zinc-300">
                      Upload New Image
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCoverFile(e.target.files[0]);
                        }
                      }}
                    />
                  </Label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="albumTitle" className="text-sm font-semibold text-zinc-300">Album Title</Label>
                <Input
                  id="albumTitle"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="bg-black/40 border-white/10 text-white focus-visible:ring-violet-500"
                  required
                />
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="releaseYear" className="text-sm font-semibold text-zinc-300">Release Year</Label>
                <Input
                  id="releaseYear"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="bg-black/40 border-white/10 text-white focus-visible:ring-violet-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tracklist Drag-and-Drop */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="glass-card border-white/10 bg-black/20 backdrop-blur-md shadow-xl">
            <CardHeader className="flex flex-row justify-between items-center pb-4">
              <div>
                <CardTitle className="text-lg font-bold">Tracklist & Audio Order</CardTitle>
                <CardDescription className="text-zinc-500">Drag items to change track ordering</CardDescription>
              </div>
              <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-md font-semibold">
                {tracks.length} tracks
              </span>
            </CardHeader>
            <CardContent>
              {tracks.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {tracks.map((track, idx) => (
                        <SortableTrackRow
                          key={track.id}
                          track={track}
                          index={idx}
                          onUpdateTrack={handleUpdateTrack}
                          onOpenLyrics={handleOpenLyrics}
                          genres={genres}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
                  <Music className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  No songs in this album.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lyrics Editing Dialog */}
      {editingLyricsTrack && (
        <Dialog open={!!editingLyricsTrack} onOpenChange={(open) => {
          if (!open) {
            if (audioRef.current) audioRef.current.pause();
            setEditingLyricsTrack(null);
          }
        }}>
          <DialogContent className="sm:max-w-[850px] bg-zinc-950 text-white border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
                <FileText className="w-5 h-5 text-fuchsia-400" /> Lyrics & Translation Sync
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Synchronize lyrics and edit English translation for "<span className="text-white font-medium">{editingLyricsTrack.title}</span>"
              </DialogDescription>
            </DialogHeader>

            {/* Embedded Audio Playback Console */}
            <div className="bg-black/45 border border-white/10 rounded-xl overflow-hidden mb-2 shrink-0">
              <div className="p-4 flex items-center justify-between gap-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/50 shrink-0 border border-white/10 flex items-center justify-center">
                    {coverPreview ? (
                      <img src={coverPreview} alt={editingLyricsTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">Playback console</span>
                    <h3 className="font-bold text-sm text-white truncate mt-0.5">{editingLyricsTrack.title}</h3>
                  </div>
                </div>

                <audio
                  ref={(el) => {
                    audioRef.current = el;
                    if (el) {
                      el.onplay = () => setIsPlaying(true);
                      el.onpause = () => setIsPlaying(false);
                      el.ontimeupdate = () => setCurrentTime(el.currentTime);
                      el.ondurationchange = () => setDuration(el.duration);
                    }
                  }}
                  src={editingLyricsTrack.audio_url}
                />

                <Button
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) audioRef.current.pause();
                      else audioRef.current.play().catch(() => {});
                    }
                  }}
                  size="icon"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 border-0 text-white cursor-pointer shadow-md hover:opacity-90 active:scale-95 transition-transform"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </Button>
              </div>

              {/* Progress Slider */}
              <div className="px-4 py-2 bg-black/30 flex items-center gap-3 text-[10px] font-semibold text-zinc-500">
                <span>{formatTime(currentTime)}</span>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seekTo(percent * duration);
                  }}
                  className="flex-1 h-2 bg-white/5 hover:bg-white/10 rounded-full relative cursor-pointer group transition-colors"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div
                    className="absolute top-1/2 w-3 h-3 bg-white rounded-full -translate-y-1/2 -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Sync Workspace Content */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
              {lyricsState === 'input' ? (
                <div className="space-y-4 pt-1">
                  {/* Clean Tab Selector for Languages */}
                  <div className="flex border-b border-white/10 p-0.5 bg-black/40 rounded-lg max-w-[320px]">
                    <button
                      type="button"
                      onClick={() => setActiveInputTab('bo')}
                      className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeInputTab === 'bo'
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Tibetan Lyrics (བོད་ཡིག)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInputTab('en')}
                      className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeInputTab === 'en'
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      English Translation
                    </button>
                  </div>

                  <div className="p-3 bg-violet-500/5 border border-violet-500/15 rounded-lg text-[11px] text-violet-300 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                    <div>
                      {activeInputTab === 'bo' ? (
                        <span>
                          Paste the raw **Tibetan lyrics** below. Split each phrase with a new line. 
                          Timestamps like <code className="bg-black/50 px-1 py-0.5 rounded text-white font-mono">[01:23.45] text</code> will be parsed automatically.
                        </span>
                      ) : (
                        <span>
                          Paste the corresponding **English translation lines** below. 
                          Ensure they have the exact same line count as the Tibetan lyrics so they align perfectly!
                        </span>
                      )}
                    </div>
                  </div>

                  {activeInputTab === 'bo' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="rawLyricsText" className="text-xs font-semibold text-zinc-300">Tibetan Lyrics</Label>
                      <Textarea
                        id="rawLyricsText"
                        value={rawLyricsText}
                        onChange={(e) => setRawLyricsText(e.target.value)}
                        placeholder="Paste Tibetan lyrics here..."
                        rows={11}
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-700 focus-visible:ring-violet-500 font-mono text-sm leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="translationLyricsText" className="text-xs font-semibold text-zinc-300">English Translation</Label>
                      <Textarea
                        id="translationLyricsText"
                        value={translationLyricsText}
                        onChange={(e) => setTranslationLyricsText(e.target.value)}
                        placeholder="Enter translation lines here..."
                        rows={11}
                        className="bg-black/40 border-white/10 text-white placeholder:text-zinc-700 focus-visible:ring-violet-500 font-mono text-sm leading-relaxed"
                      />
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-4 flex flex-col h-full min-h-0 pt-1">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={resetTimings}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5 text-[11px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Clear Sync
                      </Button>
                      <Button
                        onClick={() => setLyricsState('input')}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5 text-[11px]"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Text
                      </Button>
                    </div>

                    <div className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                      <span>Press <strong>Spacebar</strong> to sync active line</span>
                    </div>
                  </div>

                  {/* Sync Line rows list */}
                  <div className="space-y-4 flex-1 min-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {lyricLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                          currentLineIndex === idx
                            ? 'bg-violet-600/10 border-violet-500/40 shadow-lg shadow-violet-500/5'
                            : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-black/30'
                        }`}
                      >
                        {/* Row Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              currentLineIndex === idx ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'
                            }`}>
                              Line {idx + 1}
                            </span>
                          </div>

                          {/* Controls & Timestamp */}
                          <div className="flex items-center gap-3">
                            {line.time >= 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => seekTo(line.time)}
                                className="h-7 text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-semibold p-1 gap-1"
                              >
                                <Play className="w-3 h-3 fill-current" /> Seek
                              </Button>
                            )}
                            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded px-2 h-7">
                              <span className="text-[10px] text-zinc-500 font-mono">Time:</span>
                              <input
                                type="number"
                                step="0.1"
                                value={line.time >= 0 ? line.time : ''}
                                onChange={(e) => adjustTimestamp(idx, e.target.value)}
                                placeholder="--:--"
                                className="w-12 text-center text-xs bg-transparent border-0 text-white font-mono focus:ring-0 p-0"
                              />
                            </div>
                            <div className="shrink-0 ml-1">
                              {line.time >= 0 ? (
                                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              ) : (
                                <div className="w-4.5 h-4.5 rounded-full bg-zinc-500/15 border border-white/5 flex items-center justify-center text-zinc-500 text-[9px] font-mono">
                                  -
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stacked Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Tibetan (བོད་ཡིག)</span>
                            <Input
                              value={line.text}
                              onChange={(e) => adjustText(idx, e.target.value)}
                              placeholder="Lyrics line text"
                              className="h-9 text-xs bg-black/30 border-white/5 focus-visible:border-white/10 text-white font-medium focus-visible:ring-violet-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">English Translation</span>
                            <Input
                              value={line.translation || ''}
                              onChange={(e) => adjustTranslation(idx, e.target.value)}
                              placeholder="Translation text"
                              className="h-9 text-xs bg-black/30 border-white/5 focus-visible:border-white/10 text-zinc-300 focus-visible:ring-violet-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Keyboard syncing control */}
                  <div className="flex justify-between items-center text-xs text-zinc-400 pt-1 shrink-0 bg-black/5 p-2 rounded border border-white/5">
                    <div>
                      {currentLineIndex < lyricLines.length ? (
                        <p>
                          Active: <strong className="text-white">{currentLineIndex + 1} / {lyricLines.length}</strong>
                        </p>
                      ) : (
                        <p className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" /> All lines synced!
                        </p>
                      )}
                    </div>
                    {currentLineIndex < lyricLines.length && (
                      <Button
                        type="button"
                        onClick={markTimestamp}
                        size="sm"
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold cursor-pointer text-xs h-8 px-4"
                      >
                        Mark Timestamp (Space)
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-white/5 pt-4 shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setEditingLyricsTrack(null);
                }}
                className="text-zinc-400 hover:text-white hover:bg-white/5 text-xs h-9"
              >
                Cancel
              </Button>
              {lyricsState === 'input' ? (
                <Button
                  onClick={startSync}
                  disabled={!rawLyricsText.trim()}
                  className="btn-gradient border-0 text-white font-semibold flex items-center gap-1.5 text-xs h-9 px-4"
                >
                  Continue to Synchronization &rarr;
                </Button>
              ) : (
                <Button
                  onClick={handleSaveLyrics}
                  className="btn-gradient border-0 text-white font-semibold flex items-center gap-1.5 text-xs h-9 px-4"
                >
                  <Save className="w-4 h-4" /> Apply Lyrics
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
