'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

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

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('rolyang_admin_session')
  redirect('/login')
}
