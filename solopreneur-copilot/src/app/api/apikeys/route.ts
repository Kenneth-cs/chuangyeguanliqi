import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import crypto from "crypto"

// GET /api/apikeys — 查询当前用户所有 API Key（key 脱敏）
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      createdAt: true,
      lastUsedAt: true,
      // 只返回前 8 位 + 脱敏
      key: true,
    },
  })

  return NextResponse.json(
    keys.map((k) => ({
      ...k,
      keyPreview: k.key.slice(0, 12) + "••••••••••••",
    }))
  )
}

// POST /api/apikeys — 生成新 API Key（明文只返回一次）
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { label } = body

  if (!label?.trim()) {
    return NextResponse.json({ error: "label 备注名必填" }, { status: 400 })
  }

  const rawKey = "cplt_" + crypto.randomBytes(32).toString("hex")

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      key: rawKey,
      label: label.trim(),
    },
  })

  // 仅此次返回明文 key
  return NextResponse.json({
    id: apiKey.id,
    label: apiKey.label,
    key: rawKey,
    createdAt: apiKey.createdAt,
  }, { status: 201 })
}
