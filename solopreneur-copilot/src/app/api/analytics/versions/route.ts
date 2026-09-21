import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { assertProjectAccess } from "@/lib/analytics/assertProjectAccess"

// GET /api/analytics/versions?projectId=xxx
// 返回该项目上报过的所有 App 版本列表
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId 必填" }, { status: 400 })

  const access = await assertProjectAccess(projectId, session.user.id)
  if (!access.ok) return access.response

  const rows = await prisma.appEvent.findMany({
    where: { projectId, appVersion: { not: null } },
    select: { appVersion: true },
    distinct: ["appVersion"],
    orderBy: { appVersion: "desc" },
  })

  const versions = rows.map((r) => r.appVersion).filter(Boolean) as string[]
  return NextResponse.json(versions)
}
