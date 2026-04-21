import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// 生成可读分享码：4位大写字母 + - + 4位数字，如 QXMN-2847
function generateShareCode(): string {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join("")
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `${letters}-${digits}`
}

// GET /api/shares?projectId=xxx — 查询该项目的所有分享记录
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const shares = await prisma.projectShare.findMany({
    where: { projectId, revokedAt: null },
    include: {
      guestUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(shares)
}

// POST /api/shares — 为项目生成新的分享码
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  // 生成唯一分享码（重试避免碰撞）
  let shareCode = ""
  for (let i = 0; i < 10; i++) {
    const code = generateShareCode()
    const exists = await prisma.projectShare.findUnique({ where: { shareCode: code } })
    if (!exists) { shareCode = code; break }
  }
  if (!shareCode) return NextResponse.json({ error: "生成失败，请重试" }, { status: 500 })

  const share = await prisma.projectShare.create({
    data: {
      projectId,
      ownerUserId: session.user.id,
      shareCode,
    },
  })

  return NextResponse.json(share, { status: 201 })
}
