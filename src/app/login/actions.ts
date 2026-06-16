'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/server'

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return redirect('/login?message=Admin password not configured in environment variables.')
  }

  if (password !== adminPassword) {
    return redirect('/login?message=Incorrect Master Password.')
  }

  const cookieStore = await cookies()
  cookieStore.set('rolyang_admin_session', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return redirect('/login?message=Email and password are required.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const inviteCode = formData.get('inviteCode') as string
  const stageName = formData.get('stageName') as string
  
  if (!email || !password) {
    return redirect('/login?message=Email and password are required.')
  }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  let userRole = 'listener'
  let codeData: any = null

  // 1. Verify invite code if provided
  if (inviteCode) {
    const { data, error: codeErr } = await adminSupabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode.trim())
      .eq('is_used', false)
      .single()

    if (codeErr || !data) {
      return redirect('/login?message=Invalid or already used invite code.')
    }
    
    codeData = data
    userRole = data.role

    if (userRole === 'artist' && !stageName) {
      return redirect('/login?message=Stage name is required for artist registration.')
    }
  }

  // 2. Register user in auth.users
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: userRole,
        stage_name: userRole === 'artist' ? stageName : email.split('@')[0],
      }
    }
  })

  if (signUpErr) {
    return redirect(`/login?message=${encodeURIComponent(signUpErr.message)}`)
  }

  const user = signUpData?.user

  // 3. Post-Signup Operations for Invite Codes
  if (user && codeData) {
    try {
      // Mark code as used
      await adminSupabase
        .from('invite_codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('code', codeData.code)

      // Create log
      await adminSupabase.from('admin_audit_logs').insert({
        action_type: 'signup_with_invite_code',
        target_id: user.id,
        details: `User ${email} registered with invite code ${codeData.code} bypassing moderation as role ${userRole}.`,
      })

      // Artist-specific setup
      if (userRole === 'artist') {
        const cleanSlug = stageName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const artistSlug = `${cleanSlug}-${Math.random().toString(36).substring(2, 6)}`;

        // Create artist profile
        await adminSupabase.from('artists').insert({
          id: artistSlug,
          name: stageName,
          bio: 'This artist registered using an invite code. Welcome to Rolyang Studio!',
          image_url: '',
          followers: '0',
        })

        // Update auth metadata
        await adminSupabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            artist_id: artistSlug,
          }
        })

        // Update user_profiles mapping
        await adminSupabase
          .from('user_profiles')
          .update({
            role: 'artist',
            artist_id: artistSlug,
          })
          .eq('id', user.id)
      } else if (userRole === 'contributor') {
        // Update user_profiles mapping for contributor
        await adminSupabase
          .from('user_profiles')
          .update({
            role: 'contributor',
          })
          .eq('id', user.id)
      }
    } catch (e: any) {
      console.error('Error during invite code onboarding:', e)
    }
  }

  return redirect('/login?message=Signup successful! You can now log in or check your email if confirmation is enabled.')
}

export async function logout() {
  const cookieStore = await cookies()
  
  // 1. Delete admin master session cookie
  cookieStore.delete('rolyang_admin_session')
  
  // 2. Sign out of Supabase session
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    // Ignore if client couldn't be loaded or no session exists
  }
  
  revalidatePath('/', 'layout')
  redirect('/login')
}

