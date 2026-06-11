"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createAlbum, createTracks } from '../app/actions';
import { Upload, Music, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ListMusic, GripVertical, Trash2, AlignLeft, ChevronsUpDown, Check, Plus, PlusCircle, Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import WaveSurfer from 'wavesurfer.js';

// dnd-kit imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Artist {
  id: string;
  name: string;
  image_url: string;
}

interface TrackItem {
  id: string;
  file: File | null;
  title: string;
  genre: string;
  color: string;
  lyricsText: string;
  durationString: string | null;
  durationSeconds: number;
}

function SortableTrackRow({ track, index, onUpdate, onFileSelected, onRemove }: { track: TrackItem, index: number, onUpdate: (id: string, field: keyof TrackItem, value: any) => void, onFileSelected: (id: string, file: File) => void, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef.current && track.file) {
      const url = URL.createObjectURL(track.file);
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#d4d4d8', // zinc-300
        progressColor: '#6366f1', // indigo-500
        cursorColor: '#4f46e5',
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
        height: 36,
        url: url
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));

      return () => {
        wavesurfer.current?.destroy();
        URL.revokeObjectURL(url);
      };
    }
  }, [track.file]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 bg-black/20 backdrop-blur-md border rounded-xl ${isDragging ? 'border-indigo-400 shadow-md ring-1 ring-indigo-200' : 'border-white/10 shadow-xl hover:border-white/20 transition-colors'}`}>
      
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-300 shrink-0">
        <GripVertical className="w-5 h-5" />
      </div>
      
      {/* 1. Title */}
      <Input 
        value={track.title} 
        onChange={(e) => onUpdate(track.id, 'title', e.target.value)} 
        className="h-10 text-sm font-medium border-white/10 shadow-none focus-visible:ring-1 w-48 shrink-0" 
        placeholder="Track Title"
      />
      
      {/* 2. Genre (Tag Input) */}
      <div 
        className="flex items-center gap-1 flex-wrap h-auto min-h-[40px] px-2 py-1 text-sm border border-white/10 rounded-md bg-black/20 backdrop-blur-md focus-within:ring-1 focus-within:ring-ring w-48 shrink-0"
        onClick={() => document.getElementById(`genre-input-${track.id}`)?.focus()}
      >
        {track.genre.split(',').map(g => g.trim()).filter(Boolean).map((genreTag, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-purple-100 text-purple-950 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {genreTag}
            <button 
              type="button" 
              className="text-purple-400 hover:text-purple-700 focus:outline-none font-bold text-sm leading-none ml-0.5"
              onClick={(e) => {
                e.stopPropagation();
                const newGenres = track.genre.split(',').map(g => g.trim()).filter(g => g !== genreTag);
                onUpdate(track.id, 'genre', newGenres.join(', '));
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input 
          id={`genre-input-${track.id}`}
          type="text"
          className="flex-1 min-w-[60px] outline-none bg-transparent border-none p-0 text-sm focus:ring-0"
          placeholder={track.genre ? "" : "Genre"}
          list="genre-options"
          autoComplete="off"
          onKeyDown={(e) => {
            if (e.key === ',' || e.key === 'Enter') {
              e.preventDefault();
              const val = e.currentTarget.value.trim().replace(/,/g, '');
              if (val) {
                const currentGenres = track.genre ? track.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
                if (!currentGenres.includes(val) && currentGenres.length < 3) {
                  onUpdate(track.id, 'genre', currentGenres.concat(val).join(', '));
                } else if (currentGenres.length >= 3) {
                  alert("Maximum 3 genres allowed per track.");
                }
                e.currentTarget.value = '';
              }
            } else if (e.key === 'Backspace' && e.currentTarget.value === '') {
              // Remove last tag on backspace
              const currentGenres = track.genre ? track.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
              if (currentGenres.length > 0) {
                currentGenres.pop();
                onUpdate(track.id, 'genre', currentGenres.join(', '));
              }
            }
          }}
          onBlur={(e) => {
            const val = e.currentTarget.value.trim().replace(/,/g, '');
            if (val) {
              const currentGenres = track.genre ? track.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
              if (!currentGenres.includes(val) && currentGenres.length < 3) {
                onUpdate(track.id, 'genre', currentGenres.concat(val).join(', '));
              }
              e.currentTarget.value = '';
            }
          }}
          onChange={(e) => {
            if (e.target.value.includes(',')) {
              const val = e.target.value.trim().replace(/,/g, '');
              if (val) {
                const currentGenres = track.genre ? track.genre.split(',').map(g => g.trim()).filter(Boolean) : [];
                if (!currentGenres.includes(val) && currentGenres.length < 3) {
                  onUpdate(track.id, 'genre', currentGenres.concat(val).join(', '));
                } else if (currentGenres.length >= 3) {
                  alert("Maximum 3 genres allowed per track.");
                }
              }
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* 3. Lyrics (Dialog) */}
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant={track.lyricsText ? "secondary" : "outline"} className="h-10 px-4 shrink-0 shadow-none">
            Lyrics
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lyrics & Details</DialogTitle>
            <DialogDescription>
              Edit the advanced metadata for "{track.title || `Track ${index + 1}`}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme Color</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center border border-white/10 rounded-md overflow-hidden bg-black/40 w-28">
                  <input 
                    type="color" 
                    value={track.color}
                    onChange={(e) => onUpdate(track.id, 'color', e.target.value)}
                    className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer ml-[-4px]" 
                  />
                  <span className="text-sm text-zinc-300 uppercase flex-1 pr-3 text-right">{track.color}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Lyrics (LRC)</Label>
              </div>
              <Textarea 
                value={track.lyricsText}
                onChange={(e) => onUpdate(track.id, 'lyricsText', e.target.value)}
                placeholder="[00:12.50] I'm a starboy..."
                className="min-h-[160px] text-sm resize-y font-mono bg-black/40/50"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Duration */}
      <div className="flex flex-col items-center justify-center w-14 shrink-0 text-center">
        <span className="text-xs font-semibold text-zinc-700">{track.durationString || '--:--'}</span>
        <RefreshCw className="w-3 h-3 text-zinc-400 mt-0.5" />
      </div>

      {/* 5. Track File Button */}
      <label className="cursor-pointer shrink-0">
        <div className={`h-10 px-4 flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${track.file ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-indigo-700 hover:bg-indigo-100' : 'bg-black/20 backdrop-blur-md border-white/10 text-zinc-700 hover:bg-black/40 shadow-xl'}`}>
          <Music className="w-4 h-4 mr-2" />
          {track.file ? 'Change File' : 'Track File'}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
          if (e.target.files && e.target.files[0]) onFileSelected(track.id, e.target.files[0]);
        }} />
      </label>

      {/* 6. Play Button & Visualizer */}
      <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/10 rounded-lg p-2 min-w-[200px]">
        {track.file ? (
          <>
            <button type="button" onClick={togglePlay} className="w-8 h-8 rounded-full btn-gradient border-0 text-white flex items-center justify-center  shrink-0 shadow-xl">
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <div ref={waveformRef} className="flex-1 h-9 cursor-pointer" />
          </>
        ) : (
          <div className="w-full text-center text-xs text-zinc-400 font-medium tracking-wide uppercase">
            Preview Visualizer
          </div>
        )}
      </div>

      {/* Trash */}
      <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-red-500 hover:bg-red-50 shrink-0" onClick={() => onRemove(track.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistComboboxOpen, setArtistComboboxOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  
  const [albumTitle, setAlbumTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  // Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const [tracks, setTracks] = useState<TrackItem[]>([
    {
      id: crypto.randomUUID(),
      file: null,
      title: '',
      genre: '',
      color: '#4f46e5',
      lyricsText: '',
      durationString: null,
      durationSeconds: 0
    }
  ]);

  const [genres, setGenres] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: artistData, error: artistError } = await supabase.from('artists').select('id, name, image_url').order('name');
      if (artistData && !artistError) {
        setArtists(artistData);
        setSearchResults(artistData);
      }
      const { data: genreData } = await supabase.from('genres').select('id, name').order('name');
      if (genreData) {
        setGenres(genreData);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults(artists);
        return;
      }
      setIsSearching(true);
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, image_url')
        .ilike('name', `%${searchQuery}%`)
        .order('name')
        .limit(10);
      
      if (data && !error) {
        setSearchResults(data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, artists]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toSlug = (str: string) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
  const cleanFilename = (filename: string) => filename.replace(/^(?:\d+[\s.-]+)?(.+?)\.\w+$/, '$1').trim();

  const parseLyrics = (rawText: string) => {
    if (!rawText || !rawText.trim()) return null;
    const lines = rawText.split('\n');
    const syncedLyrics = [];
    const lrcRegex = /^\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
  
    let hasTimestamps = false;
  
    for (const line of lines) {
      const match = line.match(lrcRegex);
      if (match) {
        hasTimestamps = true;
        const minutes = parseInt(match[1], 10);
        const seconds = parseFloat(match[2]);
        syncedLyrics.push({
          time: (minutes * 60) + seconds,
          text: match[3].trim()
        });
      }
    }
  
    if (hasTimestamps) return { type: 'synced', lines: syncedLyrics };
    return { type: 'plain', text: rawText.trim() };
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio();
      
      let resolved = false;

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoad);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(objectUrl);
      };

      const onLoad = () => {
        if (resolved) return;
        resolved = true;
        resolve(Math.round(audio.duration) || 0);
        cleanup();
      };

      const onError = () => {
        if (resolved) return;
        resolved = true;
        resolve(0);
        cleanup();
      };

      audio.addEventListener('loadedmetadata', onLoad);
      audio.addEventListener('error', onError);
      
      // Fallback timeout in case events never fire
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(0);
          cleanup();
        }
      }, 1000);

      audio.src = objectUrl;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addNewEmptyTrackRow = () => {
    setTracks(prev => [...prev, {
      id: crypto.randomUUID(),
      file: null,
      title: '',
      genre: '',
      color: '#3b82f6',
      lyricsText: '',
      durationString: null,
      durationSeconds: 0
    }]);
  };

  const handleFileSelectedForTrack = async (id: string, file: File) => {
    const dur = await getAudioDuration(file);
    const mins = Math.floor(dur / 60);
    const secs = dur % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const cleanTitle = cleanFilename(file.name);

    setTracks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          file,
          durationSeconds: dur,
          durationString: durStr,
          title: t.title || cleanTitle 
        };
      }
      return t;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateTrackField = (id: string, field: keyof TrackItem, value: any) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleUploadFile = async (file: File, path: string): Promise<string> => {
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId || !albumTitle || !coverFile || tracks.length === 0) {
      setError('Please select an artist, fill out required fields, upload a cover, and add tracks.');
      return;
    }

    const missingFiles = tracks.some(t => !t.file);
    if (missingFiles) {
      setError('Please select an audio file for all tracks in the list.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const artistSlug = selectedArtistId;
      const albumSlug = `${artistSlug}-${toSlug(albumTitle)}`;
      const folderPath = `${artistSlug}/${releaseYear ? `${releaseYear}-` : ''}${toSlug(albumTitle)}`;

      const coverExt = coverFile.name.split('.').pop();
      const coverUrl = await handleUploadFile(coverFile, `${folderPath}/cover.${coverExt}`);

      await createAlbum({
        id: albumSlug,
        title: albumTitle,
        artist_id: artistSlug,
        year: releaseYear || null,
        cover_url: coverUrl
      });

      const tracksToInsert = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const file = track.file as File;
        
        const trackNum = i + 1;
        const trackSlug = `${albumSlug}-t${trackNum}`;
        const audioUrl = await handleUploadFile(file, `${folderPath}/${trackNum}-${file.name}`);

        const parsedLyrics = parseLyrics(track.lyricsText);

        const trackGenreIds: string[] = [];
        if (track.genre) {
          const names = track.genre.split(',').map(g => g.trim()).filter(Boolean);
          names.forEach(name => {
            const found = genres.find(g => g.name.toLowerCase() === name.toLowerCase());
            if (found) {
              trackGenreIds.push(found.id);
            }
          });
        }

        tracksToInsert.push({
          id: trackSlug,
          title: track.title, 
          artist_id: artistSlug,
          album_id: albumSlug,
          duration: track.durationSeconds,
          genre_ids: trackGenreIds, 
          audio_url: audioUrl,
          color: track.color, 
          lyrics: parsedLyrics 
        });
      }

      await createTracks(tracksToInsert);
      

      setSuccess(true);
      setAlbumTitle(''); setReleaseYear('');
      setCoverFile(null); setTracks([]);
    } catch (err: any) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Upload New Release</h1>
        <p className="text-zinc-400 mt-2 text-lg">Select an artist and upload their new album or single directly to the database.</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-900">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
          <AlertDescription className="text-green-700">Successfully uploaded and processed all media! The tracks are now live.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Left Column: Metadata */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 shadow-xl border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ListMusic className="w-5 h-5 text-zinc-400" />
                Release Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 pt-0">
              
              <div className="space-y-5">
                <div className="space-y-2 flex flex-col relative" ref={dropdownRef}>
                  <Label>Artist <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input 
                      placeholder="Type artist name to search..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedArtistId('');
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="bg-black/40/50 w-full"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      </div>
                    )}
                  </div>
                  
                  {showDropdown && searchQuery.trim() !== '' && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <div className="py-1">
                          {searchResults.map((artist) => (
                            <button
                              key={artist.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center justify-between"
                              onClick={() => {
                                setSelectedArtistId(artist.id);
                                setSearchQuery(artist.name);
                                setShowDropdown(false);
                              }}
                            >
                              <span>{artist.name}</span>
                              {selectedArtistId === artist.id && <Check className="w-4 h-4 text-fuchsia-400" />}
                            </button>
                          ))}
                        </div>
                      ) : !isSearching ? (
                        <div className="px-4 py-6 text-center text-sm text-zinc-400">
                          No artist found matching "{searchQuery}".
                          <a href="/artists/new" className="block mt-2 text-fuchsia-400 hover:underline font-medium">
                            <Plus className="w-4 h-4 inline mr-1" />
                            Create new artist
                          </a>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="albumTitle">Album Title <span className="text-red-500">*</span></Label>
                  <Input id="albumTitle" value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} required placeholder="e.g. Starboy" className="bg-black/40/50" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="releaseYear">Release Year</Label>
                  <Input id="releaseYear" value={releaseYear} onChange={e => setReleaseYear(e.target.value)} placeholder="e.g. 2016" className="bg-black/40/50" />
                </div>
              </div>

              <div className="space-y-2 flex flex-col h-full">
                <Label className="mb-2 block">Cover Art <span className="text-red-500">*</span></Label>
                <label className="flex-1 flex flex-col items-center justify-center min-h-[260px] border-2 border-dashed border-white/10 rounded-xl bg-black/40 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden group">
                  {coverPreviewUrl ? (
                    <>
                      <img src={coverPreviewUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Change Cover</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                      <span className="text-sm font-medium text-zinc-300 block mb-1">Upload Cover</span>
                      <span className="text-xs text-zinc-400 block">JPG, PNG, WEBP</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setCoverFile(e.target.files[0]);
                    }
                  }} />
                </label>
              </div>
              
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tracklist */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-1 shadow-xl border-white/10 flex flex-col bg-black/40/30">
            <CardHeader className="pb-4 bg-black/20 backdrop-blur-md rounded-t-xl border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Music className="w-5 h-5 text-zinc-400" />
                    Tracklist
                  </CardTitle>
                  <CardDescription className="mt-1">Add rows, pick audio files, and edit metadata inline.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-6">
              
              <div className="flex flex-col">
                {/* Wireframe Header Guide */}
                <div className="flex items-center gap-3 px-3 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <div className="w-5 shrink-0" />
                  <div className="w-48 shrink-0">Title</div>
                  <div className="w-48 shrink-0">Genre</div>
                  <div className="w-[84px] shrink-0 text-center">Lyrics</div>
                  <div className="w-14 shrink-0 text-center">Dur</div>
                  <div className="w-[124px] shrink-0 text-center">Track File</div>
                  <div className="flex-1 min-w-[200px]">Preview Visualizer</div>
                  <div className="w-8 shrink-0" />
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {tracks.map((track, index) => (
                        <SortableTrackRow 
                          key={track.id} 
                          track={track} 
                          index={index} 
                          onUpdate={updateTrackField}
                          onFileSelected={handleFileSelectedForTrack}
                          onRemove={removeTrack}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="mt-5 border-t border-dashed border-white/10 pt-5 flex justify-center">
                  <Button type="button" onClick={addNewEmptyTrackRow} variant="outline" className="border-dashed border-white/20 text-zinc-700 hover:text-indigo-700 hover:bg-fuchsia-500/10 w-full max-w-[300px]">
                    <PlusCircle className="w-4 h-4 mr-2" /> + Add more Track
                  </Button>
                </div>
              </div>

            </CardContent>
            <CardFooter className="pt-6 border-t border-white/10 bg-black/20 backdrop-blur-md mt-auto rounded-b-xl flex justify-between items-center">
              <div className="text-sm text-zinc-400 font-medium">
                {tracks.length} track{tracks.length === 1 ? '' : 's'} ready for upload
              </div>
              <Button type="submit" disabled={loading} size="lg" className="min-w-[180px] shadow-xl btn-gradient border-0  text-white font-semibold text-base">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : 'Upload Release'}
              </Button>
            </CardFooter>
          </Card>
        </div>

      </form>

      <datalist id="genre-options">
        {genres.map((g, idx) => (
          <option key={idx} value={g.name} />
        ))}
      </datalist>
    </div>
  );
}


