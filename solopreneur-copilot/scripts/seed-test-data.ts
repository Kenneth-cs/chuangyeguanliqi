import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 事件类型定义
const EVENT_TYPES = [
  { eventId: 'record_submit_success', eventName: '记账成功' },
  { eventId: 'project_create_success', eventName: '创建项目成功' },
  { eventId: 'record_click_add', eventName: '点击添加记账' },
  { eventId: 'onboarding_click_skip', eventName: '跳过引导' },
  { eventId: 'analytics_click_report', eventName: '点击查看报告' },
]

// 参数模板
const PARAMS_TEMPLATES = {
  record_submit_success: [
    { category: '餐饮', amount_level: 'low', is_custom_project: true },
    { category: '交通', amount_level: 'medium', is_custom_project: false },
    { category: '购物', amount_level: 'high', is_custom_project: true },
    { category: '娱乐', amount_level: 'low', is_custom_project: false },
    { category: '职场', amount_level: 'medium', is_custom_project: true },
  ],
  project_create_success: [
    { has_budget: true, project_type: 'personal' },
    { has_budget: false, project_type: 'business' },
  ],
}

// 生成随机设备 ID
function generateDeviceId(): string {
  return `device_${Math.random().toString(36).substr(2, 9)}`
}

// 生成随机版本号
function generateVersion(): string {
  const versions = ['1.0.0', '1.0.1', '1.1.0', '1.2.0', '2.0.0']
  return versions[Math.floor(Math.random() * versions.length)]
}

// 生成指定日期范围内的事件
function generateEventsForDate(
  projectId: string,
  date: Date,
  count: number,
  deviceIds: string[]
) {
  const events = []

  for (let i = 0; i < count; i++) {
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
    const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)]
    const version = generateVersion()

    // 随机时间（当天内）
    const occurredAt = new Date(date)
    occurredAt.setHours(Math.floor(Math.random() * 24))
    occurredAt.setMinutes(Math.floor(Math.random() * 60))
    occurredAt.setSeconds(Math.floor(Math.random() * 60))

    // 获取参数
    let params: Record<string, any> | null = null
    if (PARAMS_TEMPLATES[eventType.eventId as keyof typeof PARAMS_TEMPLATES]) {
      const templates = PARAMS_TEMPLATES[eventType.eventId as keyof typeof PARAMS_TEMPLATES]
      params = templates[Math.floor(Math.random() * templates.length)]
    }

    events.push({
      projectId,
      deviceId,
      eventId: eventType.eventId,
      eventName: eventType.eventName,
      params: params as any,
      appVersion: version,
      osVersion: `iOS ${16 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 5)}`,
      occurredAt,
    })
  }

  return events
}

async function main() {
  console.log('🌱 开始插入测试数据...\n')

  // 获取第一个项目
  const project = await prisma.project.findFirst()
  if (!project) {
    console.error('❌ 没有找到项目，请先创建一个项目')
    return
  }

  console.log(`📁 使用项目: ${project.name} (${project.id})`)

  // 生成设备 ID 列表（模拟 50 个用户）
  const deviceIds = Array.from({ length: 50 }, () => generateDeviceId())
  console.log(`👥 模拟 ${deviceIds.length} 个设备`)

  // 生成过去 30 天的数据
  const today = new Date()
  const allEvents = []

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    date.setHours(0, 0, 0, 0)

    // 每天生成 10-30 个事件（模拟真实流量）
    const dailyCount = 10 + Math.floor(Math.random() * 20)
    const events = generateEventsForDate(project.id, date, dailyCount, deviceIds)
    allEvents.push(...events)

    if (daysAgo % 7 === 0) {
      console.log(`  📅 ${date.toISOString().split('T')[0]}: ${dailyCount} 个事件`)
    }
  }

  console.log(`\n📊 总计生成 ${allEvents.length} 个事件`)

  // 批量插入
  console.log('💾 正在插入数据库...')
  const result = await prisma.appEvent.createMany({
    data: allEvents,
    skipDuplicates: true,
  })
  console.log(`✅ 成功插入 ${result.count} 个事件`)

  // 验证数据
  const totalEvents = await prisma.appEvent.count()
  console.log(`\n📈 数据库中现有 ${totalEvents} 个事件`)

  // 显示日期分布
  const date分布 = await prisma.$queryRaw`
    SELECT DATE(occurredAt) as date, COUNT(*) as count
    FROM AppEvent
    WHERE projectId = ${project.id}
    GROUP BY DATE(occurredAt)
    ORDER BY date DESC
    LIMIT 10
  `
  console.log('\n📅 最近 10 天的事件分布:')
  console.table(date分布)

  console.log('\n✅ 测试数据插入完成！')
  console.log('💡 现在可以在浏览器中测试日期筛选功能了')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
