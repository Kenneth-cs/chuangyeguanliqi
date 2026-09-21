import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 检查数据库状态...\n')

  // 检查用户
  const users = await prisma.user.findMany()
  console.log(`👥 用户数量: ${users.length}`)
  if (users.length > 0) {
    console.log(`   第一个用户: ${users[0].email} (ID: ${users[0].id})`)
  }

  // 检查项目
  const projects = await prisma.project.findMany()
  console.log(`📁 项目数量: ${projects.length}`)
  if (projects.length > 0) {
    console.log(`   第一个项目: ${projects[0].name} (ID: ${projects[0].id})`)
  }

  // 检查事件
  const events = await prisma.appEvent.findMany({ take: 5 })
  console.log(`📊 事件数量: ${await prisma.appEvent.count()}`)
  if (events.length > 0) {
    console.log(`   示例事件: ${events[0].eventId} - ${events[0].eventName}`)
    console.log(`   时间范围: ${events[0].occurredAt}`)
  }

  // 检查 API Keys
  const apiKeys = await prisma.apiKey.findMany()
  console.log(`🔑 API Keys: ${apiKeys.length}`)

  console.log('\n✅ 数据库检查完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
