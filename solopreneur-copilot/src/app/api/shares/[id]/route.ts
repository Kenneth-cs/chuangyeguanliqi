import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// DELETE /api/shares/[id] — 撤销分享（写入 revokedAt，立即生效）
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params

  const share = await prisma.projectShare.findFirst({
    where: { id, ownerUserId: session.user.id, revokedAt: null },
  })
  if (!share) return NextResponse.json({ error: "分享记录不存在" }, { status: 404 })

  await prisma.projectShare.update({
    where: { id },
    data: { revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
