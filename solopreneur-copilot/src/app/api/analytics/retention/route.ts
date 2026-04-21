import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// GET /api/analytics/retention?projectId=xxx&cohorts=30
// 返回近 N 天每日新增设备的 D1/D7/D30 留存率
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const cohorts = Math.min(parseInt(searchParams.get("cohorts") ?? "30"), 60)

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  // 拉取足够长时间范围的事件（需要多 30 天来计算最旧队列的 D30）
  const since = new Date()
  since.setDate(since.getDate() - cohorts - 30)
  since.setHours(0, 0, 0, 0)

  const events = await prisma.appEvent.findMany({
    where: { projectId, occurredAt: { gte: since } },
    select: { deviceId: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  })

  // 记录每个设备的首次出现日期（安装日期）
  const firstSeenMap = new Map<string, string>()
  // 记录每个设备出现过的所有日期
  const activeDatesMap = new Map<string, Set<string>>()

  for (const e of events) {
    const day = e.occurredAt.toISOString().slice(0, 10)
    if (!firstSeenMap.has(e.deviceId)) firstSeenMap.set(e.deviceId, day)
    if (!activeDatesMap.has(e.deviceId)) activeDatesMap.set(e.deviceId, new Set())
    activeDatesMap.get(e.deviceId)!.add(day)
  }

  // 按安装日期分组
  const cohortMap = new Map<string, string[]>()
  for (const [deviceId, firstDay] of firstSeenMap.entries()) {
    if (!cohortMap.has(firstDay)) cohortMap.set(firstDay, [])
    cohortMap.get(firstDay)!.push(deviceId)
  }

  const today = new Date().toISOString().slice(0, 10)

  // 生成近 cohorts 天的队列数据
  const result = []
  for (let i = cohorts - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const cohortDate = d.toISOString().slice(0, 10)

    const devices = cohortMap.get(cohortDate) ?? []
    const newUsers = devices.length

    const calcRetention = (offsetDays: number): number | null => {
      const targetDate = new Date(cohortDate)
      targetDate.setDate(targetDate.getDate() + offsetDays)
      const targetDay = targetDate.toISOString().slice(0, 10)
      // 目标日期还没到，返回 null
      if (targetDay > today) return null
      if (newUsers === 0) return null
      const retained = devices.filter((id) => activeDatesMap.get(id)?.has(targetDay)).length
      return Math.round((retained / newUsers) * 100)
    }

    result.push({
      cohortDate,
      newUsers,
      d1: calcRetention(1),
      d7: calcRetention(7),
      d30: calcRetention(30),
    })
  }

  return NextResponse.json(result)
}
