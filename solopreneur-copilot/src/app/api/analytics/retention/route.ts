import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange, buildDateList, toLocalDateStr } from "@/lib/analytics/dateRange"
import { assertProjectAccess } from "@/lib/analytics/assertProjectAccess"

// GET /api/analytics/retention?projectId=xxx&range=7d&version=all
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const range = searchParams.get("range") ?? "7d"
  const version = searchParams.get("version") ?? "all"

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const access = await assertProjectAccess(projectId, session.user.id)
  if (!access.ok) return access.response

  const { start, end } = parseDateRange(range)
  const cohortDates = new Set(buildDateList(start, end))

  const allEvents = await prisma.appEvent.findMany({
    where: { projectId },
    select: { deviceId: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  })

  const firstSeenMap = new Map<string, string>()
  for (const e of allEvents) {
    const day = toLocalDateStr(e.occurredAt)
    if (!firstSeenMap.has(e.deviceId)) firstSeenMap.set(e.deviceId, day)
  }

  const rangeEvents = await prisma.appEvent.findMany({
    where: {
      projectId,
      occurredAt: { gte: start, lte: end },
      ...(version !== "all" ? { appVersion: version } : {}),
    },
    select: { deviceId: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  })

  const activeDatesMap = new Map<string, Set<string>>()
  for (const e of rangeEvents) {
    const day = toLocalDateStr(e.occurredAt)
    if (!activeDatesMap.has(e.deviceId)) activeDatesMap.set(e.deviceId, new Set())
    activeDatesMap.get(e.deviceId)!.add(day)
  }

  const cohortMap = new Map<string, string[]>()
  for (const [deviceId, firstDay] of firstSeenMap.entries()) {
    if (!cohortMap.has(firstDay)) cohortMap.set(firstDay, [])
    cohortMap.get(firstDay)!.push(deviceId)
  }

  const today = toLocalDateStr(new Date())

  const result = []
  for (const cohortDate of [...cohortDates].sort()) {
    const devices = cohortMap.get(cohortDate) ?? []
    const newUsers = devices.length

    const calcRetention = (offsetDays: number): number | null => {
      const targetDate = new Date(cohortDate)
      targetDate.setDate(targetDate.getDate() + offsetDays)
      const targetDay = toLocalDateStr(targetDate)
      if (targetDay > today) return null
      if (newUsers === 0) return null
      const retained = devices.filter((id) => activeDatesMap.get(id)?.has(targetDay)).length
      return Math.round((retained / newUsers) * 100)
    }

    result.push({
      cohortDate,
      newUsers,
      d1: calcRetention(1),
      d3: calcRetention(3),
      d7: calcRetention(7),
      d30: calcRetention(30),
    })
  }

  return NextResponse.json(result)
}
