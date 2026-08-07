import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { id, username, email } = await req.json()

  if (!id || !username || !email) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    const user = await prisma.user.create({
      data: { id, username, email },
    })
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 })
  }
}