"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, CheckCircle2, User, Camera, Upload, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { updateProfile } from './actions';

interface ProfileFormProps {
  initialProfile: {
    name: string;
    bio: string;
    imageUrl: string;
  };
  role: string;
  success?: string;
  error?: string;
}

export default function ProfileForm({ initialProfile, role, success, error }: ProfileFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialProfile.imageUrl);
  const [fileName, setFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset loading state when the initialProfile changes (meaning page reloaded / revalidated)
  useEffect(() => {
    setIsSubmitting(false);
  }, [initialProfile]);

  const showError = (message: string) => {
    setErrorModalMessage(message);
    setErrorModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file (JPEG, PNG, WebP).');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        showError(`The selected image is ${(file.size / (1024 * 1024)).toFixed(2)}MB, which exceeds the 1MB size limit. Please choose a smaller image or compress it before uploading.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Clean up previous object URL if any
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const file = fileInputRef.current?.files?.[0];
    if (file && file.size > 1 * 1024 * 1024) {
      e.preventDefault();
      showError('The selected profile picture exceeds the 1MB size limit. Please choose a smaller image under 1MB.');
      return;
    }
    setIsSubmitting(true);
  };

  return (
    <>
      <Card className="glass-card border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500" />
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <User className="w-5 h-5 text-violet-400" />
            {role === 'artist' ? 'Artist Profile Information' : 'Contributor Profile Settings'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {role === 'artist' 
              ? 'Update your public artist page details. Your bio and avatar will sync to the music player.' 
              : 'Configure your contributor credentials and workspace details.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-6 border-emerald-500/30 bg-emerald-500/5 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/5 text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form action={updateProfile} onSubmit={handleSubmit} className="space-y-6">
            {/* Keep the original image URL in case they don't upload a new one */}
            <input type="hidden" name="currentAvatarUrl" value={initialProfile.imageUrl} />

            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-white/5 pb-6">
              <div 
                onClick={triggerFileInput}
                className="w-28 h-28 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 shrink-0 flex items-center justify-center relative group cursor-pointer hover:border-violet-500/50 transition-all duration-300"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt={initialProfile.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-violet-500/10 text-violet-300 text-3xl font-extrabold capitalize">
                    {initialProfile.name.charAt(0)}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity duration-300 backdrop-blur-xs">
                  <Camera className="w-6 h-6 text-white" />
                  <span className="text-[10px] font-semibold text-white tracking-wider uppercase">Change</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-3">
                <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-violet-400" /> Profile Picture
                </Label>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    onClick={triggerFileInput} 
                    variant="outline" 
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 px-4"
                  >
                    Choose Image File
                  </Button>
                  {fileName && (
                    <span className="text-xs text-zinc-400 truncate max-w-[200px]">{fileName}</span>
                  )}
                </div>
                <input
                  type="file"
                  id="avatarFile"
                  name="avatarFile"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <span className="text-[11px] text-zinc-500 block leading-normal">
                  Supports JPEG, PNG, or WebP. Recommend square aspect ratio, max <strong className="text-zinc-400">1MB</strong>.
                </span>
              </div>
            </div>

            {/* Display / Stage Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-zinc-300">
                {role === 'artist' ? 'Stage Name / Band Name' : 'Display Name'}
              </Label>
              <Input
                id="displayName"
                name="displayName"
                required
                defaultValue={initialProfile.name}
                placeholder="e.g., Tenzin Dawa"
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 h-11"
              />
            </div>

            {/* Biography (Only for Artists) */}
            {role === 'artist' && (
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-zinc-300">Biography</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  required
                  defaultValue={initialProfile.bio}
                  placeholder="Write a short summary about your musical history, instruments, and style..."
                  rows={6}
                  className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 btn-gradient border-0 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Save Profile Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* User Friendly Error Dialog Popup */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="glass-card border-white/10 text-white max-w-md bg-zinc-950/90 backdrop-blur-xl">
          <DialogHeader className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">Upload Blocked</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-1 leading-relaxed">
              {errorModalMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button 
              type="button" 
              onClick={() => setErrorModalOpen(false)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 cursor-pointer"
            >
              Okay, Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
