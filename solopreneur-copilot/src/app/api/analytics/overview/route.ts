import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange, buildDateList, toLocalDateStr } from "@/lib/analytics/dateRange"

// GET /api/analytics/overview?projectId=xxx&range=7d&version=all
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const range = searchParams.get("range") ?? "7d"
  const version = searchParams.get("version") ?? "all"
  const customStart = searchParams.get("startDate") ?? undefined
  const customEnd = searchParams.get("endDate") ?? undefined

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const { start, end } = parseDateRange(range, customStart, customEnd)
  const dateList = buildDateList(start, end)

  // 拉取时间范围内所有事件（按需过滤版本）
  const events = await prisma.appEvent.findMany({
    where: {
      projectId,
      occurredAt: { gte: start, lte: end },
      ...(version !== "all" ? { appVersion: version } : {}),
    },
    select: { deviceId: true, eventId: true, occurredAt: true },
  })

  // 获取所有曾触发 project_create_success 的设备（用于渗透率，不限时间范围）
  const projectCreators = new Set(
    (await prisma.appEvent.findMany({
      where: { projectId, eventId: "project_create_success" },
      select: { deviceId: true },
    })).map((e) => e.deviceId)
  )

  // 获取项目级别所有最早出现日期（用于判断新增用户，不限时间范围）
  const allFirstSeen = await prisma.appEvent.findMany({
    where: { projectId },
    select: { deviceId: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  })
  const firstSeenMap = new Map<string, string>()
  for (const e of allFirstSeen) {
    if (!firstSeenMap.has(e.deviceId)) {
      firstSeenMap.set(e.deviceId, toLocalDateStr(e.occurredAt))
    }
  }

  // 按日期分组
  type DayBucket = { devices: Set<string>; records: number; newDevices: Set<string> }
  const dayMap = new Map<string, DayBucket>()
  for (const d of dateList) {
    dayMap.set(d, { devices: new Set(), records: 0, newDevices: new Set() })
  }

  for (const e of events) {
    const day = toLocalDateStr(e.occurredAt)
    if (!dayMap.has(day)) continue
    const bucket = dayMap.get(day)!
    bucket.devices.add(e.deviceId)
    if (e.eventId === "record_submit_success") bucket.records++
  }

  // 标记新增用户（当日首次在整个项目中出现）
  for (const [deviceId, firstDay] of firstSeenMap.entries()) {
    if (dayMap.has(firstDay)) {
      dayMap.get(firstDay)!.newDevices.add(deviceId)
    }
  }

  // 同日记账的新用户（用于激活率）
  const recordDevicesByDay = new Map<string, Set<string>>()
  for (const e of events) {
    if (e.eventId !== "record_submit_success") continue
    const day = toLocalDateStr(e.occurredAt)
    if (!recordDevicesByDay.has(day)) recordDevicesByDay.set(day, new Set())
    recordDevicesByDay.get(day)!.add(e.deviceId)
  }

  const rows = dateList.map((date) => {
    const b = dayMap.get(date)!
    const dau = b.devices.size
    const newUsers = b.newDevices.size
    const records = b.records

    // 激活率：当日新用户中，同日记了第一笔账的比例
    const activatedNewUsers = newUsers > 0
      ? [...b.newDevices].filter((d) => recordDevicesByDay.get(date)?.has(d)).length
      : 0
    const activationRate = newUsers > 0 ? Math.round((activatedNewUsers / newUsers) * 100) : null

    // 核心渗透率：DAU 中曾创建过自定义项目的设备占比
    const penetratedUsers = dau > 0
      ? [...b.devices].filter((d) => projectCreators.has(d)).length
      : 0
    const penetrationRate = dau > 0 ? Math.round((penetratedUsers / dau) * 100) : null

    return { date, dau, newUsers, records, activationRate, penetrationRate }
  })

  return NextResponse.json(rows)
}
