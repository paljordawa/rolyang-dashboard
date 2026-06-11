'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image as ImageIcon, Plus, Trash2, Loader2, GripVertical, Power, Link as LinkIcon, Save } from 'lucide-react';
import { createBanner, updateBanner, deleteBanner } from '@/app/actions';
import { supabase } from '@/lib/supabase';

// dnd-kit for reordering
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBannerItem({ 
  banner, 
  onUpdate, 
  onDelete 
}: { 
  banner: any; 
  onUpdate: (id: string, updates: any) => void; 
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(banner.title);
  const [editLink, setEditLink] = useState(banner.link_url || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onUpdate(banner.id, { title: editTitle, link_url: editLink });
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
          <div className="space-y-2">
            <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-black/40 border-white/10 h-8" placeholder="Banner Title" />
            <div className="flex gap-2">
              <Input value={editLink} onChange={e => setEditLink(e.target.value)} className="bg-black/40 border-white/10 h-8 text-xs" placeholder="https://..." />
              <Button size="sm" onClick={handleSave} disabled={loading} className="h-8 bg-indigo-500 hover:bg-indigo-600 text-white">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className={`font-semibold truncate ${banner.is_active ? 'text-white' : 'text-zinc-500'}`}>{banner.title}</h3>
            {banner.link_url && (
              <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 truncate">
                <LinkIcon className="w-3 h-3" /> {banner.link_url}
              </a>
            )}
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

export default function BannerManagerClient({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Banner Form
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

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
      
      const newBanner = {
        title,
        link_url: linkUrl || undefined,
        image_url: urlData.publicUrl,
        is_active: true,
        sort_order: banners.length
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
        <Card className="glass-card border-white/10 shadow-xl overflow-hidden">
          <div className="bg-black/40 p-4 border-b border-white/10">
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
              <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/40 border-white/10" placeholder="e.g. New Single Out Now!" />
            </div>

            <div className="space-y-2">
              <Label>Link URL (Optional)</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="bg-black/40 border-white/10" placeholder="https://..." />
            </div>

            <Button onClick={handleCreate} disabled={loading || !title || !file} className="w-full btn-gradient border-0 mt-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              Publish Banner
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Manage Banners */}
      <div className="lg:col-span-2">
        <Card className="glass-card border-white/10 shadow-xl h-full flex flex-col">
          <div className="bg-black/40 p-4 border-b border-white/10 flex justify-between items-center">
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
