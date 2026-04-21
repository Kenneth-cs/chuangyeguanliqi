import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// POST /api/shares/join — 输入分享码加入项目
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { shareCode } = await req.json()
  if (!shareCode?.trim()) return NextResponse.json({ error: "分享码不能为空" }, { status: 400 })

  const share = await prisma.projectShare.findUnique({
    where: { shareCode: shareCode.trim().toUpperCase() },
    include: { project: { select: { id: true, name: true, userId: true } } },
  })

  if (!share || share.revokedAt) {
    return NextResponse.json({ error: "分享码无效或已过期" }, { status: 404 })
  }

  // 不能加入自己的项目
  if (share.project.userId === session.user.id) {
    return NextResponse.json({ error: "这是你自己的项目" }, { status: 400 })
  }

  // 已经加入过了
  if (share.guestUserId === session.user.id) {
    return NextResponse.json({ error: "你已经加入了该项目" }, { status: 400 })
  }

  // 分享码已被其他人使用
  if (share.guestUserId && share.guestUserId !== session.user.id) {
    return NextResponse.json({ error: "该分享码已被使用，请联系项目拥有者生成新的" }, { status: 400 })
  }

  await prisma.projectShare.update({
    where: { id: share.id },
    data: { guestUserId: session.user.id },
  })

  return NextResponse.json({
    projectId: share.project.id,
    projectName: share.project.name,
  })
}
