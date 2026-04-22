import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// GET /api/product-data/projects — 返回所有项目（含被共享的）及今日事件摘要
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  // 自己的项目（只显示已开启追踪的）
  const ownProjects = await prisma.project.findMany({
    where: { userId: session.user.id, analyticsEnabled: true },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, status: true },
  })

  // 被共享给我的项目
  const sharedRecords = await prisma.projectShare.findMany({
    where: { guestUserId: session.user.id, revokedAt: null },
    include: { project: { select: { id: true, name: true, status: true } } },
  })
  const sharedProjects = sharedRecords.map((s) => ({
    ...s.project,
    isShared: true,
  }))

  const allProjects = [
    ...ownProjects.map((p) => ({ ...p, isShared: false })),
    ...sharedProjects,
  ]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const result = await Promise.all(
    allProjects.map(async (p) => {
      const [latestEvent, todayEvents] = await Promise.all([
        prisma.appEvent.findFirst({
          where: { projectId: p.id },
          orderBy: { occurredAt: "desc" },
          select: { occurredAt: true },
        }),
        prisma.appEvent.findMany({
          where: { projectId: p.id, occurredAt: { gte: today, lt: tomorrow } },
          select: { deviceId: true },
        }),
      ])

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        isShared: p.isShared,
        latestEventAt: latestEvent?.occurredAt ?? null,
        todayDau: new Set(todayEvents.map((e) => e.deviceId)).size,
        todayEventCount: todayEvents.length,
      }
    })
  )

  return NextResponse.json(result)
}
