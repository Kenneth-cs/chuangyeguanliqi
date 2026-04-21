import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// DELETE /api/apikeys/[id] — 删除 API Key
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!apiKey) return NextResponse.json({ error: "Key 不存在" }, { status: 404 })

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
