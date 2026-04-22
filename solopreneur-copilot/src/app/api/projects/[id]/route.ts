import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// PATCH /api/projects/:id
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const allowed = ["name", "description", "deadline", "tasks", "status", "liveUrl", "repoUrl", "launchDate", "analyticsEnabled"]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = key === "deadline" || key === "launchDate"
        ? (body[key] ? new Date(body[key]) : null)
        : body[key]
    }
  }

  // 发布时自动记录 launchDate
  if (body.status === "launched" && !project.launchDate) {
    data.launchDate = new Date()
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    include: { idea: { select: { title: true, vcScore: true } }, metrics: { orderBy: { date: "desc" }, take: 1 } },
  })

  if (body.status === "launched") {
    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        actionType: "launch",
        description: `发布项目：${updated.name}`,
        metadata: { projectId: id },
      },
    })
  }

  return NextResponse.json(updated)
}

// DELETE /api/projects/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
