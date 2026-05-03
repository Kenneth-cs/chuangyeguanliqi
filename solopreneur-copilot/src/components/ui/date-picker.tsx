'use client'

import React, { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toLocalDateStr } from "@/lib/analytics/dateRange"

interface DatePickerProps {
  value: string        // "YYYY-MM-DD"
  onChange: (val: string) => void
  placeholder?: string
  minDate?: string
  className?: string
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function DatePicker({ value, onChange, placeholder = "选择日期", minDate, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.slice(0, 4))
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.slice(5, 7)) - 1
    return new Date().getMonth()
  })
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const parsed = value ? new Date(value + "T00:00:00") : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minParsed = minDate ? new Date(minDate + "T00:00:00") : null

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    const dateStr = `${viewYear}-${m}-${d}`
    onChange(dateStr)
    setOpen(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  const formatDisplay = (d: Date) =>
    `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left",
          open ? "border-[#137FEC]/50 bg-[#137FEC]/5" : "border-slate-700 bg-slate-900/50 hover:border-slate-600",
          parsed ? "text-white" : "text-slate-500"
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
        <span className="flex-1">{parsed ? formatDisplay(parsed) : placeholder}</span>
        {parsed && (
          <X className="h-3.5 w-3.5 text-slate-500 hover:text-white shrink-0"
            onClick={e => { e.stopPropagation(); onChange("") }} />
        )}
      </button>

      {/* 日历弹出层 */}
      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-slate-700 bg-[#1A232E] shadow-2xl shadow-black/50 p-4">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-white">
              {viewYear} 年 {MONTHS[viewMonth]}
            </span>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[11px] font-medium text-slate-500 py-1">{w}</div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-0.5">
            {blanks.map(i => <div key={`b${i}`} />)}
            {days.map(day => {
              const thisDate = new Date(viewYear, viewMonth, day)
              const isSelected = parsed &&
                parsed.getFullYear() === viewYear &&
                parsed.getMonth() === viewMonth &&
                parsed.getDate() === day
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day
              const isDisabled = minParsed && thisDate < minParsed

              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && handleSelectDay(day)}
                  disabled={!!isDisabled}
                  className={cn(
                    "rounded-lg py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? "bg-[#137FEC] text-white shadow-lg shadow-blue-500/20"
                      : isToday
                      ? "border border-[#137FEC]/40 text-[#137FEC]"
                      : isDisabled
                      ? "text-slate-700 cursor-not-allowed"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* 快捷选项 */}
          <div className="mt-3 flex gap-2 border-t border-slate-800 pt-3">
            {[
              { label: "7 天后", days: 7 },
              { label: "14 天后", days: 14 },
              { label: "30 天后", days: 30 },
            ].map(({ label, days: d }) => {
              const target = new Date()
              target.setDate(target.getDate() + d)
              const str = toLocalDateStr(target)
              return (
                <button key={label} onClick={() => { onChange(str); setOpen(false) }}
                  className="flex-1 rounded-lg border border-slate-700 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
