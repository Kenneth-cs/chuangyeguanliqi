import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange } from "@/lib/analytics/dateRange"

// GET /api/analytics/features?projectId=xxx&range=7d&version=all
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
  const baseWhere = {
    projectId,
    occurredAt: { gte: start, lte: end },
    ...(version !== "all" ? { appVersion: version } : {}),
  }

  const [projectEvents, recordEvents, reportEvents] = await Promise.all([
    prisma.appEvent.findMany({
      where: { ...baseWhere, eventId: "project_create_success" },
      select: { deviceId: true, params: true },
    }),
    prisma.appEvent.findMany({
      where: { ...baseWhere, eventId: "record_submit_success" },
      select: { deviceId: true, params: true },
    }),
    prisma.appEvent.findMany({
      where: { ...baseWhere, eventId: "analytics_click_report" },
      select: { deviceId: true },
    }),
  ])

  // ── 项目特征分布 ──────────────────────────────────────────
  const withBudget = projectEvents.filter((e) => (e.params as Record<string, unknown>)?.has_budget === true)
  const withoutBudget = projectEvents.filter((e) => (e.params as Record<string, unknown>)?.has_budget !== true)
  const reportDevices = new Set(reportEvents.map((e) => e.deviceId))

  const projectFeatures = [
    {
      label: "设置了预算",
      createCount: withBudget.length,
      deviceCount: new Set(withBudget.map((e) => e.deviceId)).size,
      budgetRate: 100,
      reportClicks: [...reportDevices].filter((d) =>
        withBudget.some((e) => e.deviceId === d)
      ).length,
    },
    {
      label: "未设置预算",
      createCount: withoutBudget.length,
      deviceCount: new Set(withoutBudget.map((e) => e.deviceId)).size,
      budgetRate: 0,
      reportClicks: [...reportDevices].filter((d) =>
        withoutBudget.some((e) => e.deviceId === d)
      ).length,
    },
  ]

  // ── 记账类型分布（自定义项目 vs 默认收支）─────────────────
  const customRecords = recordEvents.filter((e) => (e.params as Record<string, unknown>)?.is_custom_project === true)
  const defaultRecords = recordEvents.filter((e) => (e.params as Record<string, unknown>)?.is_custom_project !== true)

  const recordTypeBreakdown = [
    { label: "自定义项目记账", count: customRecords.length, deviceCount: new Set(customRecords.map((e) => e.deviceId)).size },
    { label: "默认收支记账", count: defaultRecords.length, deviceCount: new Set(defaultRecords.map((e) => e.deviceId)).size },
  ]

  // ── 金额区间分布 ─────────────────────────────────────────
  const amountMap = new Map<string, number>()
  for (const e of recordEvents) {
    const level = ((e.params as Record<string, unknown>)?.amount_level as string) ?? "unknown"
    amountMap.set(level, (amountMap.get(level) ?? 0) + 1)
  }
  const total = recordEvents.length
  const amountBreakdown = Array.from(amountMap.entries())
    .map(([level, count]) => ({
      level,
      label: levelLabel(level),
      count,
      ratio: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // ── 记账分类分布 ─────────────────────────────────────────
  const categoryMap = new Map<string, number>()
  for (const e of recordEvents) {
    const cat = ((e.params as Record<string, unknown>)?.category as string) ?? "其他"
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count, ratio: total > 0 ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    projectFeatures,
    recordTypeBreakdown,
    amountBreakdown,
    categoryBreakdown,
  })
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    level_1_under100: "¥0–100",
    level_2_100_500: "¥100–500",
    level_3_500_2000: "¥500–2000",
    level_4_above2000: "¥2000+",
  }
  return map[level] ?? level
}
