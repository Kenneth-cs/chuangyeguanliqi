import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// GET /api/analytics/events?projectId=xxx&days=7
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 90)

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const events = await prisma.appEvent.findMany({
    where: { projectId, occurredAt: { gte: since } },
    select: { eventId: true, eventName: true, deviceId: true, appVersion: true },
  })

  // 按 eventId 聚合：总次数 + 触发设备数 + 版本分布
  const statsMap = new Map<string, {
    eventId: string; eventName: string; count: number
    devices: Set<string>; versions: Map<string, number>
  }>()
  for (const e of events) {
    if (!statsMap.has(e.eventId)) {
      statsMap.set(e.eventId, { eventId: e.eventId, eventName: e.eventName, count: 0, devices: new Set(), versions: new Map() })
    }
    const s = statsMap.get(e.eventId)!
    s.count++
    s.devices.add(e.deviceId)
    if (e.appVersion) {
      s.versions.set(e.appVersion, (s.versions.get(e.appVersion) ?? 0) + 1)
    }
  }

  const result = Array.from(statsMap.values())
    .map(({ eventId, eventName, count, devices, versions }) => ({
      eventId,
      eventName,
      count,
      deviceCount: devices.size,
      // 版本分布，如 {"1.0.0": 120, "1.1.0": 340}
      versionBreakdown: Object.fromEntries(versions),
    }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json(result)
}
