import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"

/**
 * 校验当前用户是否有权访问该项目的分析数据。
 * 以下两种情况视为有权访问：
 *   1. 用户是项目拥有者（project.userId === userId）
 *   2. 用户持有该项目的有效分享（ProjectShare.guestUserId === userId 且 revokedAt 为 null）
 *
 * @returns project 对象（有权）或 404 NextResponse（无权）
 */
export async function assertProjectAccess(
  projectId: string,
  userId: string,
): Promise<
  | { ok: true; project: { id: string; userId: string } }
  | { ok: false; response: NextResponse }
> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        // 项目拥有者
        { userId },
        // 持有有效分享码的访客
        {
          shares: {
            some: {
              guestUserId: userId,
              revokedAt: null,
            },
          },
        },
      ],
    },
    select: { id: true, userId: true },
  })

  if (!project) {
    return {
      ok: false,
      response: NextResponse.json({ error: "项目不存在或无权访问" }, { status: 404 }),
    }
  }

  return { ok: true, project }
}
