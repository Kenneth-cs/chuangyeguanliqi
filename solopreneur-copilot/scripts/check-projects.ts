import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查各项目的数据...\n')

  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: { appEvents: true }
      }
    }
  })

  console.log('📁 项目列表:')
  for (const p of projects) {
    console.log(`  ${p.name} (${p.id}): ${p._count.appEvents} 个事件`)
  }

  // 检查最近访问的项目
  const recentProjectId = 'cmo9tnac60003uiby2qoywxxp'
  const recentProject = await prisma.project.findUnique({
    where: { id: recentProjectId },
    include: {
      _count: {
        select: { appEvents: true }
      }
    }
  })

  console.log(`\n🔍 最近访问的项目:`)
  if (recentProject) {
    console.log(`  名称: ${recentProject.name}`)
    console.log(`  事件数: ${recentProject._count.appEvents}`)

    if (recentProject._count.appEvents === 0) {
      console.log('\n⚠️  该项目没有事件数据！')
      console.log('💡 需要为该项目插入测试数据')
    }
  } else {
    console.log('  ❌ 项目不存在')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
