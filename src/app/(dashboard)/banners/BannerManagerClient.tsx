'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image as ImageIcon, Plus, Trash2, Loader2, GripVertical, Power, Link as LinkIcon, Save, CalendarDays } from 'lucide-react';
import { createBanner, updateBanner, deleteBanner } from '@/app/actions';
import { supabase } from '@/lib/supabase';
import { DateTimePicker } from '@/components/ui/DateTimePicker';

// dnd-kit for reordering
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to parse stored banner link format
const parseLinkUrl = (url: string | null | undefined) => {
  if (!url) return { type: 'none', value: '' };
  if (url.startsWith('track:')) return { type: 'track', value: url.substring(6) };
  if (url.startsWith('artist:')) return { type: 'artist', value: url.substring(7) };
  if (url.startsWith('album:')) return { type: 'album', value: url.substring(6) };
  if (url.startsWith('playlist:')) return { type: 'playlist', value: url.substring(9) };
  return { type: 'external', value: url };
};

// Helper to serialize selected inputs to database format
const serializeLinkUrl = (type: string, value: string) => {
  if (type === 'none' || !value) return null;
  if (type === 'external') return value;
  return `${type}:${value}`;
};

// Component to render link badges or external links in list view
const renderLinkInfo = (
  linkUrl: string | null | undefined, 
  artists: any[], 
  albums: any[], 
  tracks: any[], 
  playlists: any[]
) => {
  if (!linkUrl) return null;
  const parsed = parseLinkUrl(linkUrl);
  if (parsed.type === 'external') {
    return (
      <a 
        href={parsed.value} 
        target="_blank" 
        rel="noreferrer" 
        className="text-xs text-indigo-400 hover:underline flex items-center gap-1 truncate w-fit"
      >
        <LinkIcon className="w-3 h-3 shrink-0" /> {parsed.value}
      </a>
    );
  }
  
  let label = '';
  if (parsed.type === 'track') {
    const item = tracks.find(t => t.id === parsed.value);
    label = item ? `Song: ${item.title}` : `Song ID: ${parsed.value}`;
  } else if (parsed.type === 'artist') {
    const item = artists.find(a => a.id === parsed.value);
    label = item ? `Artist: ${item.name}` : `Artist ID: ${parsed.value}`;
  } else if (parsed.type === 'album') {
    const item = albums.find(al => al.id === parsed.value);
    label = item ? `Album: ${item.title}` : `Album ID: ${parsed.value}`;
  } else if (parsed.type === 'playlist') {
    const item = playlists.find(p => p.id === parsed.value);
    label = item ? `Playlist: ${item.name}` : `Playlist ID: ${parsed.value}`;
  }

  return (
    <span className="text-xs text-indigo-400 flex items-center gap-1 truncate font-medium bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full w-fit">
      <LinkIcon className="w-3 h-3 shrink-0" /> {label}
    </span>
  );
};

// Reusable selector for configuring banner links
function LinkSelector({
  type,
  value,
  setType,
  setValue,
  artists,
  albums,
  tracks,
  playlists
}: {
  type: string;
  value: string;
  setType: (t: string) => void;
  setValue: (v: string) => void;
  artists: any[];
  albums: any[];
  tracks: any[];
  playlists: any[];
}) {
  const artistMap = React.useMemo(() => {
    return new Map(artists.map(a => [a.id, a.name]));
  }, [artists]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1">
          <label className="text-[10px] text-zinc-400 block mb-1">Link Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setValue('');
            }}
            className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="none">None</option>
            <option value="external">URL</option>
            <option value="track">Song</option>
            <option value="artist">Artist</option>
            <option value="album">Album</option>
            <option value="playlist">Playlist</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-[10px] text-zinc-400 block mb-1">Target Action</label>
          {type === 'none' && (
            <input
              disabled
              value="No click action configured"
              className="w-full h-8 text-xs bg-black/20 border border-white/5 text-zinc-600 rounded px-2 cursor-not-allowed"
            />
          )}
          {type === 'external' && (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://..."
              className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
            />
          )}
          {type === 'track' && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select a Song --</option>
              {tracks.map((t) => {
                const artistName = artistMap.get(t.artist_id) || 'Unknown Artist';
                return (
                  <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                    {t.title} (by {artistName})
                  </option>
                );
              })}
            </select>
          )}
          {type === 'artist' && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select an Artist --</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id} className="bg-zinc-950 text-white">
                  {a.name}
                </option>
              ))}
            </select>
          )}
          {type === 'album' && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select an Album --</option>
              {albums.map((al) => {
                const artistName = artistMap.get(al.artist_id) || 'Unknown Artist';
                return (
                  <option key={al.id} value={al.id} className="bg-zinc-950 text-white">
                    {al.title} (by {artistName})
                  </option>
                );
              })}
            </select>
          )}
          {type === 'playlist' && (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-8 text-xs bg-black/40 border border-white/10 text-white rounded px-2 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Select a Playlist --</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-950 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableBannerItem({ 
  banner, 
  onUpdate, 
  onDelete,
  artists,
  albums,
  tracks,
  playlists
}: { 
  banner: any; 
  onUpdate: (id: string, updates: any) => void; 
  onDelete: (id: string) => void;
  artists: any[];
  albums: any[];
  tracks: any[];
  playlists: any[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(banner.title);
  
  // Parse existing link data
  const initialParsed = parseLinkUrl(banner.link_url);
  const [editLinkType, setEditLinkType] = useState(initialParsed.type);
  const [editLinkValue, setEditLinkValue] = useState(initialParsed.value);
  
  const [editStartDate, setEditStartDate] = useState<string | null>(banner.start_date || null);
  const [editEndDate, setEditEndDate] = useState<string | null>(banner.end_date || null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const finalLink = serializeLinkUrl(editLinkType, editLinkValue);
    await onUpdate(banner.id, { 
      title: editTitle, 
      link_url: finalLink,
      start_date: editStartDate,
      end_date: editEndDate
    });
    setIsEditing(false);
    setLoading(false);
  };

  const toggleActive = async () => {
    setLoading(true);
    await onUpdate(banner.id, { is_active: !banner.is_active });
    setLoading(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all ${isDragging ? 'bg-indigo-900/40 border-indigo-500 shadow-2xl scale-[1.02]' : 'bg-black/40 border-white/10 hover:bg-white/5'}`}>
      
      {/* Drag Handle & Image */}
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-white p-2">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="w-48 h-24 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/60 relative">
          <img src={banner.image_url} alt={banner.title} className={`w-full h-full object-cover transition-opacity ${!banner.is_active ? 'opacity-40 grayscale' : ''}`} />
          {!banner.is_active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">INACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-zinc-400">Banner Title</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-black/40 border-white/10 h-8" placeholder="Banner Title" />
            </div>

            <LinkSelector 
              type={editLinkType}
              value={editLinkValue}
              setType={setEditLinkType}
              setValue={setEditLinkValue}
              artists={artists}
              albums={albums}
              tracks={tracks}
              playlists={playlists}
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <DateTimePicker 
                label="Start Date"
                value={editStartDate}
                onChange={setEditStartDate}
                placeholder="Always active"
              />
              <DateTimePicker 
                label="End Date"
                value={editEndDate}
                onChange={setEditEndDate}
                placeholder="No end date"
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" onClick={() => setIsEditing(false)} variant="outline" className="h-8 border-white/10 text-zinc-400">Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={loading} className="h-8 bg-indigo-500 hover:bg-indigo-600 text-white">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className={`font-semibold truncate ${banner.is_active ? 'text-white' : 'text-zinc-500'}`}>{banner.title}</h3>
            {renderLinkInfo(banner.link_url, artists, albums, tracks, playlists)}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="font-semibold text-indigo-400">{banner.click_count || 0}</span> clicks
              </span>
              {(banner.start_date || banner.end_date) && (
                <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/5 text-zinc-400">
                  <CalendarDays className="w-3 h-3 text-zinc-500" />
                  {banner.start_date ? new Date(banner.start_date).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', hour12: false}) : 'Always'} 
                  {' → '} 
                  {banner.end_date ? new Date(banner.end_date).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', hour12: false}) : 'Forever'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:flex-col md:justify-center shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleActive}
          disabled={loading}
          className={`h-8 w-8 p-0 border-white/10 ${banner.is_active ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/10'}`}
        >
          <Power className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => !isEditing && setIsEditing(true)}
          disabled={isEditing || loading}
          className="h-8 w-8 p-0 border-white/10 text-zinc-400 hover:text-white"
        >
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDelete(banner.id)}
          disabled={loading}
          className="h-8 w-8 p-0 border-white/10 text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BannerManagerClient({ 
  initialBanners,
  artists = [],
  albums = [],
  tracks = [],
  playlists = []
}: { 
  initialBanners: any[];
  artists?: any[];
  albums?: any[];
  tracks?: any[];
  playlists?: any[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Banner Form States
  const [title, setTitle] = useState('');
  const [linkType, setLinkType] = useState('none');
  const [linkValue, setLinkValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over?.id);
      
      const newItems = arrayMove(banners, oldIndex, newIndex);
      setBanners(newItems);

      // Save new sort order in background
      try {
        await Promise.all(newItems.map((b, idx) => updateBanner(b.id, { sort_order: idx })));
      } catch (err) {
        console.error("Failed to update sort order");
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      setError("Title and Image are required.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Upload image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(`banners/${fileName}`, file);
      if (uploadError) throw new Error(uploadError.message);
      
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(`banners/${fileName}`);
      
      const finalLink = serializeLinkUrl(linkType, linkValue);

      const newBanner = {
        title,
        link_url: finalLink || undefined,
        image_url: urlData.publicUrl,
        is_active: true,
        sort_order: banners.length,
        start_date: startDate,
        end_date: endDate
      };

      await createBanner(newBanner);
      
      // We don't have the UUID until reload, but we can do a hard refresh or optimistic
      window.location.reload();
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await updateBanner(id, updates);
      setBanners(banners.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteBanner(id);
      setBanners(banners.filter(b => b.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Add Banner */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="glass-card border-white/10 shadow-xl">
          <div className="bg-black/40 p-4 border-b border-white/10 rounded-t-xl">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Add New Banner
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Image (Aspect Ratio 2:1 recommended)</Label>
              {preview ? (
                <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border border-white/10">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setFile(null); setPreview(''); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-[2/1] border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition bg-black/20">
                  <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                  <span className="text-sm text-zinc-400">Click to upload image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreview(URL.createObjectURL(f));
                    }
                  }} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Banner Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/40 border-white/10 font-medium" placeholder="e.g. New Single Out Now!" />
            </div>

            <LinkSelector 
              type={linkType}
              value={linkValue}
              setType={setLinkType}
              setValue={setLinkValue}
              artists={artists}
              albums={albums}
              tracks={tracks}
              playlists={playlists}
            />

            <div className="grid grid-cols-2 gap-2">
              <DateTimePicker 
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Immediately"
              />
              <DateTimePicker 
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Forever"
              />
            </div>

            <Button onClick={handleCreate} disabled={loading || !title || !file} className="w-full btn-gradient border-0 mt-4 cursor-pointer font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              Publish Banner
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Manage Banners */}
      <div className="lg:col-span-2">
        <Card className="glass-card border-white/10 shadow-xl h-full flex flex-col">
          <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center rounded-t-xl">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-400" /> Active Banners
            </h2>
            <span className="text-xs font-medium text-zinc-400 bg-black/40 px-2 py-1 rounded-full border border-white/5">
              Drag to reorder
            </span>
          </div>
          
          <CardContent className="p-4 flex-1">
            {banners.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {banners.map((banner) => (
                      <SortableBannerItem 
                        key={banner.id} 
                        banner={banner} 
                        onUpdate={handleUpdate} 
                        onDelete={handleDelete} 
                        artists={artists}
                        albums={albums}
                        tracks={tracks}
                        playlists={playlists}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <ImageIcon className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-1">No banners yet</h3>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Upload your first banner on the left to highlight content on the app.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
