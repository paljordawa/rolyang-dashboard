"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createArtist, updateArtist, deleteStorageFile } from '../app/actions';
import { User, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ArtistForm({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [artistName, setArtistName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setArtistName(initialData.name || '');
      setBio(initialData.bio || '');
      if (initialData.image_url) {
        setExistingImageUrl(initialData.image_url);
        setProfilePreviewUrl(initialData.image_url);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!profileImage) {
      if (!existingImageUrl) setProfilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profileImage);
    setProfilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImage, existingImageUrl]);

  const toSlug = (str: string) => str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');

  const handleUploadFile = async (file: File, path: string): Promise<string> => {
    const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true });
    if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName) {
      setError('Please provide an artist name.');
      return;
    }

    if (!profileImage && !existingImageUrl) {
      setError('Please provide a profile image.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const artistSlug = isEditing ? initialData.id : toSlug(artistName);
      let imageUrl = existingImageUrl;
      
      // If uploading a new image
      if (profileImage) {
        const ext = profileImage.name.split('.').pop();
        const newImagePath = `artists/${artistSlug}/profile_${Date.now()}.${ext}`;
        imageUrl = await handleUploadFile(profileImage, newImagePath);

        // Delete the old image if replacing
        if (existingImageUrl) {
          try {
            const urlObj = new URL(existingImageUrl);
            const pathParts = urlObj.pathname.split('/media/');
            if (pathParts.length > 1) {
              const oldPath = pathParts[1];
              await deleteStorageFile('media', oldPath);
            }
          } catch (e) {
            console.warn("Failed to parse and delete old image:", e);
          }
        }
      }

      const payload = {
        name: artistName,
        bio: bio,
        image_url: imageUrl as string,
      };

      if (isEditing) {
        await updateArtist(artistSlug, payload);
      } else {
        await createArtist({
          id: artistSlug,
          followers: '0',
          ...payload
        });
      }

      setSuccess(true);
      if (!isEditing) {
        setArtistName('');
        setBio('');
        setProfileImage(null);
        setExistingImageUrl(null);
        setProfilePreviewUrl(null);
      }
    } catch (err: any) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">


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
          <AlertDescription className="text-green-700">
            {isEditing ? 'Artist profile updated successfully!' : <>Artist created successfully! You can now <a href="/upload" className="underline font-medium">upload a release</a> for them.</>}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="shadow-xl border-white/10 glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-zinc-400" />
              Artist Profile
            </CardTitle>
            <CardDescription>Enter the public profile details for this artist.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="shrink-0 flex flex-col">
                <Label className="mb-2">Profile Image {!isEditing && <span className="text-red-500">*</span>}</Label>
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-white/10 rounded-full bg-black/40 hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden group">
                  {profilePreviewUrl ? (
                    <>
                      <img src={profilePreviewUrl} alt="Profile Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-2">
                        <span className="text-white text-xs font-medium">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                      <span className="text-xs font-medium text-zinc-300 block">Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setProfileImage(e.target.files[0]);
                    }
                  }} />
                </label>
              </div>
              
              <div className="flex-1 space-y-5 flex flex-col justify-center">
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist Name <span className="text-red-500">*</span></Label>
                  <Input id="artistName" value={artistName} onChange={e => setArtistName(e.target.value)} required placeholder="e.g. The Weeknd" className="bg-black/40" />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="bio">Biography</Label>
              <Textarea 
                id="bio" 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Write a short biography about the artist..." 
                className="bg-black/40 min-h-[120px]" 
              />
            </div>
            
          </CardContent>
          <CardFooter className="pt-6 border-t border-white/10 bg-black/20 rounded-b-xl flex justify-end">
            <Button type="submit" disabled={loading} size="lg" className="min-w-[160px] btn-gradient border-0">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (isEditing ? 'Update Artist' : 'Create Artist')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}


