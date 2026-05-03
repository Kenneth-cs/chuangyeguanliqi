export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom"

export interface DateRange {
  start: Date
  end: Date
  days: number
}

export function parseDateRange(
  range: string,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  switch (range) {
    case "today":
      return { start: todayStart, end: now, days: 1 }

    case "yesterday": {
      const s = new Date(todayStart)
      s.setDate(s.getDate() - 1)
      const e = new Date(todayStart)
      e.setMilliseconds(-1)
      return { start: s, end: e, days: 1 }
    }

    case "7d": {
      const s = new Date(todayStart)
      s.setDate(s.getDate() - 6)
      return { start: s, end: now, days: 7 }
    }

    case "30d": {
      const s = new Date(todayStart)
      s.setDate(s.getDate() - 29)
      return { start: s, end: now, days: 30 }
    }

    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: s, end: now, days: now.getDate() }
    }

    case "custom": {
      if (!customStart || !customEnd) return parseDateRange("7d")
      const s = new Date(customStart)
      s.setHours(0, 0, 0, 0)
      const e = new Date(customEnd)
      e.setHours(23, 59, 59, 999)
      const days = Math.ceil((e.getTime() - s.getTime()) / 86400000)
      return { start: s, end: e, days }
    }

    default:
      return parseDateRange("7d")
  }
}

// 生成从 start 到 end 的完整日期字符串数组
export function buildDateList(start: Date, end: Date): string[] {
  const result: string[] = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(0, 0, 0, 0)
  while (cur <= endDay) {
    result.push(toLocalDateStr(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}
