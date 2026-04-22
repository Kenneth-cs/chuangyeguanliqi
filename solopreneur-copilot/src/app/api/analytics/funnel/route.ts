import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { parseDateRange } from "@/lib/analytics/dateRange"

// GET /api/analytics/funnel?projectId=xxx&range=7d&steps=ev1,ev2,ev3&version=all
// steps: 按顺序的 eventId 列表，逗号分隔
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const range = searchParams.get("range") ?? "7d"
  const stepsParam = searchParams.get("steps") ?? ""
  const version = searchParams.get("version") ?? "all"
  const customStart = searchParams.get("startDate") ?? undefined
  const customEnd = searchParams.get("endDate") ?? undefined

  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })
  if (!stepsParam) return NextResponse.json({ error: "steps 必填" }, { status: 400 })

  const steps = stepsParam.split(",").map((s) => s.trim()).filter(Boolean)
  if (steps.length < 2) return NextResponse.json({ error: "至少需要 2 个步骤" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const { start, end } = parseDateRange(range, customStart, customEnd)

  const events = await prisma.appEvent.findMany({
    where: {
      projectId,
      occurredAt: { gte: start, lte: end },
      eventId: { in: steps },
      ...(version !== "all" ? { appVersion: version } : {}),
    },
    select: { deviceId: true, eventId: true, eventName: true, occurredAt: true },
    orderBy: { occurredAt: "asc" },
  })

  // 按 eventId 收集触发的设备集合，同时记录中文名
  const stepDevices = new Map<string, Set<string>>()
  const stepNames = new Map<string, string>()
  for (const e of events) {
    if (!stepDevices.has(e.eventId)) stepDevices.set(e.eventId, new Set())
    stepDevices.get(e.eventId)!.add(e.deviceId)
    if (!stepNames.has(e.eventId)) stepNames.set(e.eventId, e.eventName)
  }

  const result = steps.map((stepId, idx) => {
    const uv = stepDevices.get(stepId)?.size ?? 0
    const firstUv = stepDevices.get(steps[0])?.size ?? 0
    const prevUv = idx > 0 ? (stepDevices.get(steps[idx - 1])?.size ?? 0) : uv

    return {
      step: idx + 1,
      eventId: stepId,
      eventName: stepNames.get(stepId) ?? stepId,
      uv,
      stepRate: idx === 0 ? null : (prevUv > 0 ? Math.round((uv / prevUv) * 100) : 0),
      totalRate: firstUv > 0 ? Math.round((uv / firstUv) * 100) : 0,
    }
  })

  return NextResponse.json(result)
}
