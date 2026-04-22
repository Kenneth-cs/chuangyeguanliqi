import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"

// GET /api/analytics/versions?projectId=xxx
// 返回该项目上报过的所有 App 版本列表
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 })

  const rows = await prisma.appEvent.findMany({
    where: { projectId, appVersion: { not: null } },
    select: { appVersion: true },
    distinct: ["appVersion"],
    orderBy: { appVersion: "desc" },
  })

  const versions = rows.map((r) => r.appVersion).filter(Boolean) as string[]
  return NextResponse.json(versions)
}
