'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateUsername(username: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const trimmed = username.trim()
  if (!trimmed) {
    return { error: 'Username tidak boleh kosong' }
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: trimmed,
      NOT: { id: user.id },
    },
  })

  if (existing) {
    return { error: 'Username sudah digunakan oleh pengguna lain' }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { username: trimmed },
  })

  revalidatePath('/profile')
  return { success: true }
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  })

  revalidatePath('/profile')
  return { success: true }
}