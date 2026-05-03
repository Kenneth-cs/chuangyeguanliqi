import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { toLocalDateStr } from "@/lib/analytics/dateRange"
import * as XLSX from "xlsx"

// POST /api/analytics/export
// 请求体: { projectId, startDate, endDate, sheets: ["events", "daily", "retention"] }
// 返回: .xlsx 文件流
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const body = await req.json()
  const { projectId, startDate, endDate, sheets = ["events", "daily", "retention"] } = body

  if (!projectId || !startDate || !endDate) {
    return NextResponse.json({ error: "projectId、startDate、endDate 必填" }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T23:59:59.999Z`)

  const wb = XLSX.utils.book_new()

  // ── Sheet 1: 事件流水 ─────────────────────────────────────
  if (sheets.includes("events")) {
    const rawEvents = await prisma.appEvent.findMany({
      where: { projectId, occurredAt: { gte: start, lte: end } },
      orderBy: { occurredAt: "asc" },
      select: {
        occurredAt: true,
        deviceId: true,
        eventName: true,
        eventId: true,
        params: true,
        appVersion: true,
        osVersion: true,
      },
    })

    // 收集所有 params key（动态列）
    const allParamKeys = new Set<string>()
    for (const e of rawEvents) {
      if (e.params && typeof e.params === "object" && !Array.isArray(e.params)) {
        for (const k of Object.keys(e.params as Record<string, unknown>)) {
          allParamKeys.add(k)
        }
      }
    }
    const paramKeys = [...allParamKeys].sort()

    const eventsRows = rawEvents.map(e => {
      const params = (e.params as Record<string, unknown>) ?? {}
      const row: Record<string, string | number> = {
        日期: toLocalDateStr(e.occurredAt),
        时间: e.occurredAt.toISOString().slice(11, 19),
        设备ID: e.deviceId,
        事件名称: e.eventName,
        事件ID: e.eventId,
        App版本: e.appVersion ?? "",
        OS版本: e.osVersion ?? "",
      }
      for (const k of paramKeys) {
        const v = params[k]
        row[`params.${k}`] = v !== undefined && v !== null ? String(v) : ""
      }
      return row
    })

    const ws1 = XLSX.utils.json_to_sheet(eventsRows.length > 0 ? eventsRows : [{ 提示: "所选日期范围内暂无事件数据" }])
    XLSX.utils.book_append_sheet(wb, ws1, "事件流水")
  }

  // ── Sheet 2: 每日汇总 ─────────────────────────────────────
  if (sheets.includes("daily")) {
    // 生成日期列表
    const dateList: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      dateList.push(toLocalDateStr(cur))
      cur.setDate(cur.getDate() + 1)
    }

    const dailyEvents = await prisma.appEvent.findMany({
      where: { projectId, occurredAt: { gte: start, lte: end } },
      select: { deviceId: true, eventId: true, occurredAt: true },
    })

    // 首次出现日期映射（全项目范围）
    const allFirst = await prisma.appEvent.findMany({
      where: { projectId },
      select: { deviceId: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    })
    const firstSeenMap = new Map<string, string>()
    for (const e of allFirst) {
      if (!firstSeenMap.has(e.deviceId)) {
        firstSeenMap.set(e.deviceId, toLocalDateStr(e.occurredAt))
      }
    }

    type DayBucket = { devices: Set<string>; newDevices: Set<string>; totalEvents: number }
    const dayMap = new Map<string, DayBucket>()
    for (const d of dateList) {
      dayMap.set(d, { devices: new Set(), newDevices: new Set(), totalEvents: 0 })
    }

    for (const e of dailyEvents) {
      const day = toLocalDateStr(e.occurredAt)
      if (!dayMap.has(day)) continue
      const b = dayMap.get(day)!
      b.devices.add(e.deviceId)
      b.totalEvents++
    }
    for (const [deviceId, firstDay] of firstSeenMap.entries()) {
      if (dayMap.has(firstDay)) {
        dayMap.get(firstDay)!.newDevices.add(deviceId)
      }
    }

    const dailyRows = dateList.map(date => {
      const b = dayMap.get(date)!
      return {
        日期: date,
        DAU: b.devices.size,
        新增用户: b.newDevices.size,
        事件总次数: b.totalEvents,
      }
    })

    const ws2 = XLSX.utils.json_to_sheet(dailyRows)
    XLSX.utils.book_append_sheet(wb, ws2, "每日汇总")
  }

  // ── Sheet 3: 留存矩阵 ─────────────────────────────────────
  if (sheets.includes("retention")) {
    const allRetentionEvents = await prisma.appEvent.findMany({
      where: { projectId },
      select: { deviceId: true, occurredAt: true },
      orderBy: { occurredAt: "asc" },
    })

    const firstSeenMap = new Map<string, string>()
    for (const e of allRetentionEvents) {
      const day = toLocalDateStr(e.occurredAt)
      if (!firstSeenMap.has(e.deviceId)) firstSeenMap.set(e.deviceId, day)
    }

    // 按安装日分组
    const cohortMap = new Map<string, Set<string>>()
    for (const [deviceId, firstDay] of firstSeenMap.entries()) {
      if (!cohortMap.has(firstDay)) cohortMap.set(firstDay, new Set())
      cohortMap.get(firstDay)!.add(deviceId)
    }

    // 每个设备活跃的日期集合
    const deviceActiveDays = new Map<string, Set<string>>()
    for (const e of allRetentionEvents) {
      const day = toLocalDateStr(e.occurredAt)
      if (!deviceActiveDays.has(e.deviceId)) deviceActiveDays.set(e.deviceId, new Set())
      deviceActiveDays.get(e.deviceId)!.add(day)
    }

    function addDays(dateStr: string, n: number): string {
      const [y, m, d] = dateStr.split("-").map(Number)
      const dt = new Date(y, m - 1, d)
      dt.setDate(dt.getDate() + n)
      return toLocalDateStr(dt)
    }

    function retentionRate(cohortDate: string, devices: Set<string>, dayOffset: number): number | null {
      const targetDay = addDays(cohortDate, dayOffset)
      const today = toLocalDateStr(new Date())
      if (targetDay > today) return null
      const retained = [...devices].filter(d => deviceActiveDays.get(d)?.has(targetDay)).length
      return devices.size > 0 ? Math.round((retained / devices.size) * 100) : null
    }

    const retentionRows = [...cohortMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cohortDate, devices]) => ({
        安装日期: cohortDate,
        新增设备: devices.size,
        "D1 次日留存": retentionRate(cohortDate, devices, 1) !== null ? `${retentionRate(cohortDate, devices, 1)}%` : "—",
        "D3 三日留存": retentionRate(cohortDate, devices, 3) !== null ? `${retentionRate(cohortDate, devices, 3)}%` : "—",
        "D7 七日留存": retentionRate(cohortDate, devices, 7) !== null ? `${retentionRate(cohortDate, devices, 7)}%` : "—",
        "D30 次月留存": retentionRate(cohortDate, devices, 30) !== null ? `${retentionRate(cohortDate, devices, 30)}%` : "—",
      }))

    const ws3 = XLSX.utils.json_to_sheet(retentionRows.length > 0 ? retentionRows : [{ 提示: "暂无留存数据" }])
    XLSX.utils.book_append_sheet(wb, ws3, "留存矩阵")
  }

  // 生成 buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

  const fileName = `${project.name}_${startDate}_${endDate}.xlsx`
    .replace(/[^\w\u4e00-\u9fa5._-]/g, "_")

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
