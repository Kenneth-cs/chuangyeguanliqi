import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange } from "@/lib/analytics/dateRange"

// GET /api/analytics/params?projectId=xxx&eventId=xxx&range=7d&version=all
// 返回指定事件的所有 params 字段值分布，字符串类型做频次统计，数字类型做均值+区间分布
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const eventId = searchParams.get("eventId")
  const range = searchParams.get("range") ?? "7d"
  const version = searchParams.get("version") ?? "all"

  if (!projectId || !eventId) return NextResponse.json({ error: "projectId 和 eventId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const { start, end } = parseDateRange(range)

  const events = await prisma.appEvent.findMany({
    where: {
      projectId,
      eventId,
      occurredAt: { gte: start, lte: end },
      ...(version !== "all" ? { appVersion: version } : {}),
    },
    select: { eventName: true, params: true },
  })

  if (events.length === 0) {
    return NextResponse.json({ eventId, eventName: eventId, totalCount: 0, params: [] })
  }

  const eventName = events[0].eventName || eventId

  // 收集所有 params key 及其 value
  const keyValueMap = new Map<string, (string | number)[]>()
  for (const e of events) {
    if (!e.params || typeof e.params !== "object" || Array.isArray(e.params)) continue
    const params = e.params as Record<string, unknown>
    for (const [key, val] of Object.entries(params)) {
      if (!keyValueMap.has(key)) keyValueMap.set(key, [])
      if (typeof val === "string" || typeof val === "number") {
        keyValueMap.get(key)!.push(val)
      } else if (typeof val === "boolean") {
        keyValueMap.get(key)!.push(String(val))
      }
    }
  }

  const paramResults = []

  for (const [key, values] of keyValueMap.entries()) {
    if (values.length === 0) continue

    // 用前 20 个 value 样本判断是否为数字类型
    const sample = values.slice(0, 20)
    const isNumeric = sample.length > 0 && sample.every(v =>
      typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(Number(v)))
    )

    if (isNumeric) {
      const nums = values.map(v => Number(v)).filter(n => !isNaN(n))
      const avg = Math.round(nums.reduce((s, n) => s + n, 0) / nums.length)
      const max = Math.max(...nums)
      const min = Math.min(...nums)

      // 按四分位数自动划分区间
      const sorted = [...nums].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q2 = sorted[Math.floor(sorted.length * 0.5)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]

      const buckets = [
        { label: `< ${Math.round(q1)}`, count: nums.filter(n => n < q1).length },
        { label: `${Math.round(q1)}–${Math.round(q2)}`, count: nums.filter(n => n >= q1 && n < q2).length },
        { label: `${Math.round(q2)}–${Math.round(q3)}`, count: nums.filter(n => n >= q2 && n < q3).length },
        { label: `≥ ${Math.round(q3)}`, count: nums.filter(n => n >= q3).length },
      ].map(b => ({ ...b, ratio: Math.round((b.count / nums.length) * 100) }))

      paramResults.push({
        key,
        type: "number" as const,
        stats: { avg, max, min, total: nums.length },
        distribution: buckets,
      })
    } else {
      // 字符串频次分布
      const countMap = new Map<string, number>()
      for (const v of values) {
        const s = String(v)
        countMap.set(s, (countMap.get(s) ?? 0) + 1)
      }
      const total = values.length
      const distribution = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20) // 最多展示 20 个不同值
        .map(([value, count]) => ({ value, count, ratio: Math.round((count / total) * 100) }))

      paramResults.push({
        key,
        type: "string" as const,
        total,
        distribution,
      })
    }
  }

  return NextResponse.json({
    eventId,
    eventName,
    totalCount: events.length,
    params: paramResults,
  })
}
