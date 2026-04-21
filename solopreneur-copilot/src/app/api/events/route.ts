import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"

// 从请求头解析 API Key，验证合法性并返回 userId
async function verifyApiKey(req: Request): Promise<{ userId: string; keyId: string } | null> {
  const auth = req.headers.get("authorization") ?? ""
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!key) return null

  const apiKey = await prisma.apiKey.findUnique({ where: { key } })
  if (!apiKey) return null

  // 更新最后使用时间（异步，不阻塞响应）
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

  return { userId: apiKey.userId, keyId: apiKey.id }
}

// POST /api/events — iOS App 上报用户行为事件
export async function POST(req: Request) {
  const auth = await verifyApiKey(req)
  if (!auth) {
    return NextResponse.json({ error: "无效的 API Key" }, { status: 401 })
  }

  const body = await req.json()
  const { projectId, deviceId, eventId, eventName, params, appVersion, osVersion, occurredAt } = body

  if (!projectId || !deviceId || !eventId || !eventName) {
    return NextResponse.json(
      { error: "projectId、deviceId、eventId、eventName 均为必填" },
      { status: 400 }
    )
  }

  // 验证 projectId 属于该用户
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: auth.userId },
  })
  if (!project) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 })
  }

  const event = await prisma.appEvent.create({
    data: {
      projectId,
      deviceId,
      eventId,
      eventName,
      params: params ?? {},
      appVersion: appVersion ?? null,
      osVersion: osVersion ?? null,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    },
  })

  return NextResponse.json({ id: event.id }, { status: 201 })
}
