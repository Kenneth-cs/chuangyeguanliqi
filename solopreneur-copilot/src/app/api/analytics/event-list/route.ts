import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange } from "@/lib/analytics/dateRange"

// GET /api/analytics/event-list?projectId=xxx&range=7d&version=all
// 返回项目在时间范围内上报过的所有事件列表（按次数降序），供参数分析 Tab 下拉菜单使用
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const range = searchParams.get("range") ?? "7d"
  const version = searchParams.get("version") ?? "all"

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const { start, end } = parseDateRange(range)

  const events = await prisma.appEvent.findMany({
    where: {
      projectId,
      occurredAt: { gte: start, lte: end },
      ...(version !== "all" ? { appVersion: version } : {}),
    },
    select: { eventId: true, eventName: true },
  })

  // 按 eventId 聚合，eventName 取最新上报值（若无中文名则用 eventId 兜底）
  const countMap = new Map<string, { eventName: string; count: number }>()
  for (const e of events) {
    if (!countMap.has(e.eventId)) {
      countMap.set(e.eventId, { eventName: e.eventName || e.eventId, count: 0 })
    }
    countMap.get(e.eventId)!.count++
  }

  const result = [...countMap.entries()]
    .map(([eventId, { eventName, count }]) => ({ eventId, eventName, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json(result)
}
