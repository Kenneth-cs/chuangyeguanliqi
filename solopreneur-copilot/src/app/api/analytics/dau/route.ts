import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { toLocalDateStr } from "@/lib/analytics/dateRange"

// GET /api/analytics/dau?projectId=xxx&days=30
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const days = Math.min(parseInt(searchParams.get("days") ?? "30"), 90)

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  // 按天聚合 distinct deviceId 数量
  const events = await prisma.appEvent.findMany({
    where: { projectId, occurredAt: { gte: since } },
    select: { deviceId: true, occurredAt: true },
  })

  // 按日期分组统计 distinct deviceId
  const dayMap = new Map<string, Set<string>>()
  for (const e of events) {
    const day = toLocalDateStr(e.occurredAt)
    if (!dayMap.has(day)) dayMap.set(day, new Set())
    dayMap.get(day)!.add(e.deviceId)
  }

  // 填充完整日期序列（无数据的日期 DAU = 0）
  const result: { date: string; dau: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = toLocalDateStr(d)
    result.push({ date: dateStr, dau: dayMap.get(dateStr)?.size ?? 0 })
  }

  return NextResponse.json(result)
}
