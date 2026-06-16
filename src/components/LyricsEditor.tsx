"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, RotateCcw, Save, Sparkles, Languages, Check, ArrowRight, Music, Clock, Settings, Search, Edit2 } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  audio_url: string;
  cover_url: string;
  lyrics: LyricLine[] | null;
  albums?: any;
}

function getTrackCover(track: Track | null): string | undefined {
  if (!track) return undefined;
  if (track.cover_url) return track.cover_url;
  if (!track.albums) return undefined;
  if (Array.isArray(track.albums)) {
    return track.albums[0]?.cover_url || undefined;
  }
  return track.albums.cover_url || undefined;
}

interface LyricLine {
  time: number; // in seconds
  text: string;
}

export default function LyricsEditor() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('listener');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor states
  const [lyricsText, setLyricsText] = useState('');
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [language, setLanguage] = useState<'bo' | 'en'>('bo');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audio elements
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Keypress event handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      markTimestamp();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lyricLines, currentLineIndex, currentTime]);

  useEffect(() => {
    // Fetch user role & tracks on mount
    const loadSessionAndData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch user profile to get role & artist_id
        let role = 'admin'; // fallback if no auth session but admin cookie is set
        let artistId = null;

        if (currentUser) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profile) {
            role = profile.role;
            artistId = profile.artist_id;
          }
        }
        setUserRole(role);

        // Fetch tracks joined with album cover art
        let query = supabase.from('tracks').select('id, title, artist_id, audio_url, cover_url, lyrics, albums(cover_url)');
        
        // If they are an artist, only show their own tracks
        if (role === 'artist' && artistId) {
          query = query.eq('artist_id', artistId);
        }

        const { data: tracksData, error } = await query;
        if (error) throw error;
        setTracks(tracksData || []);
      } catch (err: any) {
        console.error('Error loading session or tracks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessionAndData();
  }, []);

  const handleTrackSelect = (track: Track) => {
    // Reset player states
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    setSelectedTrack(track);
    setFeedback(null);
    setCurrentLineIndex(0);

    // Load lyrics
    if (track.lyrics && Array.isArray(track.lyrics) && track.lyrics.length > 0) {
      setLyricLines(track.lyrics);
      setLyricsText(track.lyrics.map(l => l.text).join('\n'));
    } else {
      setLyricLines([]);
      setLyricsText('');
    }
  };

  const parseRawLyrics = () => {
    if (!lyricsText.trim()) return;
    const lines = lyricsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const parsedLines = lines.map(line => ({ time: -1, text: line }));
    setLyricLines(parsedLines);
    setCurrentLineIndex(0);
    setFeedback(null);
  };

  const markTimestamp = () => {
    if (currentLineIndex >= lyricLines.length) return;

    const updatedLines = [...lyricLines];
    // Set time to 1 decimal place accuracy
    updatedLines[currentLineIndex].time = Math.round(currentTime * 10) / 10;
    setLyricLines(updatedLines);

    if (currentLineIndex < lyricLines.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
    }
  };

  const adjustTimestamp = (index: number, timeStr: string) => {
    const time = parseFloat(timeStr);
    if (isNaN(time)) return;
    const updatedLines = [...lyricLines];
    updatedLines[index].time = time;
    setLyricLines(updatedLines);
  };

  const adjustText = (index: number, text: string) => {
    const updatedLines = [...lyricLines];
    updatedLines[index].text = text;
    setLyricLines(updatedLines);
  };

  const resetTimings = () => {
    const updatedLines = lyricLines.map(line => ({ ...line, time: -1 }));
    setLyricLines(updatedLines);
    setCurrentLineIndex(0);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const submitLyrics = async () => {
    if (!selectedTrack) return;
    
    // Check if timings are set
    const hasUnsynced = lyricLines.some(line => line.time === -1);
    if (hasUnsynced) {
      setFeedback({ type: 'error', message: 'Please sync all lines of lyrics before saving.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (userRole === 'admin' || userRole === 'artist') {
        // Direct update
        const { error } = await supabase
          .from('tracks')
          .update({ lyrics: lyricLines })
          .eq('id', selectedTrack.id);

        if (error) throw error;
        
        // Update local list
        setTracks(tracks.map(t => t.id === selectedTrack.id ? { ...t, lyrics: lyricLines } : t));
        setFeedback({ type: 'success', message: 'Lyrics successfully saved to track!' });
      } else {
        // Contributor role: submit for approval
        const { error } = await supabase
          .from('lyric_submissions')
          .insert({
            track_id: selectedTrack.id,
            submitted_by: user?.id || null,
            language: language,
            lyrics: lyricLines,
            status: 'pending'
          });

        if (error) throw error;
        setFeedback({ type: 'success', message: 'Lyrics submitted for administrator review!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving lyrics.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    if (secs < 0) return '--:--';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const filteredTracks = tracks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-12 h-12 rounded-full border-4 border-t-violet-500 border-white/5 animate-spin mb-4" />
        <p className="text-zinc-400">Loading catalog...</p>
      </div>
    );
  }

  return (
    <div className="w-full py-10 px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          Lyrics & <span className="text-gradient">Translation Sync</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Supply line-by-line synchronized lyrics for the Rolyang audio player.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Track Selector */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card border-white/10 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Music Catalog</CardTitle>
              <CardDescription className="text-zinc-400">Select a song to synchronize</CardDescription>
              <div className="relative mt-2">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <Input
                  placeholder="Search tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-10 pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto divide-y divide-white/5">
              {filteredTracks.length > 0 ? (
                filteredTracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    className={`w-full text-left flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group ${selectedTrack?.id === track.id ? 'bg-white/5 border-l-2 border-fuchsia-500' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/45 shrink-0 border border-white/10">
                      {getTrackCover(track) ? (
                        <img src={getTrackCover(track)} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${selectedTrack?.id === track.id ? 'text-fuchsia-300' : 'text-white'}`}>{track.title}</p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist_id}</p>
                    </div>
                    {track.lyrics && track.lyrics.length > 0 ? (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Synced</span>
                    ) : (
                      <span className="text-[10px] bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-full border border-white/5">No Lyrics</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Music className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No tracks found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Editor panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTrack ? (
            <div className="space-y-6">
              {/* Audio Player Card */}
              <Card className="glass-card border-white/10 shadow-xl overflow-hidden relative">
                <div className="p-5 flex items-center gap-5 bg-black/20 border-b border-white/10">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/45 shrink-0 border border-white/10">
                    {getTrackCover(selectedTrack) ? (
                      <img src={getTrackCover(selectedTrack)} alt={selectedTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-violet-500/20 text-violet-400">
                        <Music className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs uppercase tracking-wider text-fuchsia-400 font-bold">Synchronizing Track</span>
                    <h2 className="text-xl font-bold text-white truncate">{selectedTrack.title}</h2>
                    <p className="text-zinc-400 text-sm truncate mt-0.5">{selectedTrack.artist_id}</p>
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
                    src={selectedTrack.audio_url}
                  />
                  
                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={togglePlay}
                      size="icon"
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:opacity-95 shadow-lg border-0 text-white cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-5 py-4 bg-black/35 flex items-center gap-4 text-xs font-semibold text-zinc-400">
                  <span>{formatTime(currentTime)}</span>
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percent = clickX / rect.width;
                      seekTo(percent * duration);
                    }}
                    className="flex-1 h-2 bg-white/10 hover:bg-white/15 rounded-full relative cursor-pointer group"
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" 
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                    <div 
                      className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow border -translate-y-1/2 -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span>{formatTime(duration)}</span>
                </div>
              </Card>

              {/* Sync Editor Panel */}
              {lyricLines.length === 0 ? (
                /* Paste Lyrics state */
                <Card className="glass-card border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Input Lyric Text</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Paste the lyrics below. Separate each phrase/line with a new line.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 mb-2">
                      <Button
                        onClick={() => setLanguage('bo')}
                        variant="outline"
                        className={`gap-2 ${language === 'bo' ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' : 'border-white/10 text-zinc-400'}`}
                      >
                        <Languages className="w-4 h-4" />
                        Tibetan (བོད་ཡིག)
                      </Button>
                      <Button
                        onClick={() => setLanguage('en')}
                        variant="outline"
                        className={`gap-2 ${language === 'en' ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' : 'border-white/10 text-zinc-400'}`}
                      >
                        <Languages className="w-4 h-4" />
                        English
                      </Button>
                    </div>

                    <Textarea
                      placeholder={language === 'bo' ? 'གླུ་གཞས་ཀྱི་ཚིག་རྣམས་འདིར་འབྲི་བར་གྱིས།\n(Paste Tibetan lyrics here...)' : 'Enter English translation lyrics here...'}
                      value={lyricsText}
                      onChange={(e) => setLyricsText(e.target.value)}
                      rows={12}
                      className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={parseRawLyrics} disabled={!lyricsText.trim()} className="btn-gradient border-0 text-white font-semibold">
                      Continue to Synchronization <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                /* Synchronization state */
                <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={resetTimings}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5"
                      >
                        <RotateCcw className="w-4 h-4" /> Clear Sync
                      </Button>
                      <Button
                        onClick={() => setLyricLines([])}
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white hover:bg-white/5 gap-1.5"
                      >
                        <Edit2 className="w-4 h-4" /> Edit Text
                      </Button>
                    </div>

                    {userRole === 'contributor' && (
                      <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <Languages className="w-4 h-4 text-fuchsia-400" />
                        <span className="text-zinc-400">Submitting in:</span>
                        <span className="text-white font-bold capitalize">{language === 'bo' ? 'Tibetan' : 'English'}</span>
                      </div>
                    )}

                    <div className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>Press <strong>Spacebar</strong> to sync next line</span>
                    </div>
                  </div>

                  {/* Sync Table */}
                  <CardContent className="p-0 max-h-[400px] overflow-y-auto divide-y divide-white/5">
                    {lyricLines.map((line, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-4 p-4 transition-colors ${currentLineIndex === idx ? 'bg-fuchsia-500/10 border-l-2 border-fuchsia-500' : 'hover:bg-white/2'}`}
                      >
                        <div className="w-8 text-xs font-bold text-zinc-500 text-center shrink-0">
                          {idx + 1}
                        </div>
                        
                        {/* Timestamp Input */}
                        <div className="w-24 shrink-0 flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={line.time >= 0 ? line.time : ''}
                            onChange={(e) => adjustTimestamp(idx, e.target.value)}
                            placeholder="--:--"
                            className="h-8 text-xs bg-black/40 border-white/10 text-center font-mono text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-violet-500"
                          />
                          {line.time >= 0 && (
                            <button 
                              onClick={() => seekTo(line.time)} 
                              className="text-[10px] text-fuchsia-400 hover:text-fuchsia-300 font-mono"
                              title="Jump here"
                            >
                              Play
                            </button>
                          )}
                        </div>

                        {/* Text input */}
                        <Input
                          value={line.text}
                          onChange={(e) => adjustText(idx, e.target.value)}
                          className="h-9 border-transparent hover:border-white/5 focus-visible:border-white/10 bg-transparent text-white font-medium focus-visible:ring-0 shadow-none px-1"
                        />

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {line.time >= 0 ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-500/10 border border-white/5 flex items-center justify-center text-zinc-500 text-[10px] font-mono">
                              -
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>

                  {/* Submit / Sync action footer */}
                  <CardFooter className="bg-black/25 p-4 border-t border-white/10 flex justify-between items-center gap-4 flex-wrap">
                    <div>
                      {currentLineIndex < lyricLines.length ? (
                        <p className="text-sm text-zinc-400">
                          Active line: <strong className="text-white">{currentLineIndex + 1} / {lyricLines.length}</strong>
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> All lines synchronized!
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {currentLineIndex < lyricLines.length ? (
                        <Button 
                          onClick={markTimestamp}
                          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold cursor-pointer"
                        >
                          Mark Timestamp (Space)
                        </Button>
                      ) : (
                        <Button
                          onClick={submitLyrics}
                          disabled={submitting}
                          className="btn-gradient border-0 text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/20 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          {submitting ? 'Saving...' : (userRole === 'admin' || userRole === 'artist' ? 'Save to Track' : 'Submit Lyrics')}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )}

              {feedback && (
                <Alert 
                  variant={feedback.type === 'error' ? 'destructive' : 'default'}
                  className={feedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-red-500/30 bg-red-500/5 text-red-300'}
                >
                  <AlertDescription>{feedback.message}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            /* Choose a track placeholder */
            <Card className="glass-card border-white/10 border-dashed shadow-xl py-24 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 animate-pulse">
                <Music className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">No Song Selected</h2>
              <p className="text-zinc-500 max-w-sm">
                Select a song from the library sidebar to start writing, synchronizing, or translating lyrics.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
