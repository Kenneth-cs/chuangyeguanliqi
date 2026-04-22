'use client'

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft, Activity, BarChart2, Users, Key, Share2,
  TrendingUp, SlidersHorizontal, Copy, Trash2, Plus, Check, Loader2,
  Info, ChevronDown, ChevronUp, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ── InfoTooltip：列头悬浮说明（方案 A，fixed 定位避免 overflow 截断）──
function InfoTooltip({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  function handleMouseEnter() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <span
      ref={ref}
      className="inline-flex items-center ml-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      <Info className="h-3 w-3 text-slate-600 hover:text-slate-300 cursor-help transition-colors" />
      {pos && (
        <div
          className="fixed z-[9999] w-56 rounded-lg bg-slate-700 border border-slate-600 px-3 py-2.5 text-xs text-slate-200 shadow-xl leading-relaxed pointer-events-none"
          style={{ left: pos.x, top: pos.y - 8, transform: "translate(-50%, -100%)" }}
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
        </div>
      )}
    </span>
  )
}

// ── MetricsGuide：Tab 顶部可折叠指标说明（方案 B 辅助）──
function MetricsGuide({ items }: { items: { name: string; desc: string }[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-slate-700/60 bg-[#1C2127] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>指标说明</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="grid gap-0 divide-y divide-slate-800/60 border-t border-slate-800">
          {items.map(({ name, desc }) => (
            <div key={name} className="flex gap-4 px-4 py-2.5">
              <span className="w-24 shrink-0 text-xs font-semibold text-slate-300">{name}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 各 Tab 的指标说明数据 ─────────────────────────────────
const METRICS_GUIDE = {
  overview: [
    { name: "DAU", desc: "当日触发任意事件的独立设备数（以 iOS IDFV 为唯一标识）。" },
    { name: "新增用户", desc: "当日在本项目中首次出现的设备数，即「安装后首次打开 App」的新设备。" },
    { name: "记账笔数", desc: "当日 record_submit_success（记账成功）事件的触发总次数，含同一用户多次记账。" },
    { name: "激活率", desc: "当日新增用户中，同日成功记录至少一笔账的比例。衡量新用户引导效果。" },
    { name: "核心渗透率", desc: "当日 DAU 中，历史上曾创建过至少一个自定义项目（project_create_success）的设备占比。" },
    { name: "环比行", desc: "最新一天与前一天的数值变化百分比。绿色 ↑ 表示增长，红色 ↓ 表示下降。" },
  ],
  retention: [
    { name: "安装日期", desc: "该批设备在本项目中首次上报事件的日期，视为「安装日」。" },
    { name: "新增设备", desc: "该日首次出现的设备总数。" },
    { name: "D1 次日", desc: "安装次日（第 2 天）再次触发任意事件的设备占比。记账类 App 健康值 ≥ 35%。" },
    { name: "D3 三日", desc: "安装后第 3 天再次活跃的设备占比。" },
    { name: "D7 七日", desc: "安装后第 7 天再次活跃的设备占比。健康值 ≥ 15%。" },
    { name: "D30 次月", desc: "安装后第 30 天再次活跃的设备占比。衡量长期留存质量。" },
  ],
  funnel: [
    { name: "触发设备 UV", desc: "在所选时间范围内，触发该步骤事件的独立设备数（去重）。" },
    { name: "步骤转化率", desc: "触发本步骤的设备数 ÷ 触发上一步骤的设备数。反映相邻两步的流失情况。" },
    { name: "总转化率", desc: "触发本步骤的设备数 ÷ 触发第一步骤的设备数。反映全流程累计流失。" },
  ],
  features: [
    { name: "记账分类", desc: "来自 record_submit_success 事件的 category 参数，统计各分类的记账次数占比。" },
    { name: "金额区间", desc: "来自 record_submit_success 事件的 amount_level 参数，按脱敏金额区间分组统计。" },
    { name: "记账类型", desc: "is_custom_project 参数区分「自定义项目记账」vs「默认日常收支」，验证项目制卖点渗透。" },
    { name: "项目创建", desc: "来自 project_create_success 事件，分析创建项目时是否设置预算及对深度报告的兴趣。" },
  ],
  events: [
    { name: "触发次数", desc: "选定时间范围内该事件的上报总次数，包含同一设备多次触发。" },
    { name: "触发设备数", desc: "触发该事件的独立设备数（去重），可理解为「有多少用户做了这个动作」。" },
    { name: "版本分布", desc: "触发该事件的 appVersion 分布，可对比不同版本的行为差异。" },
  ],
}

// ── 类型 ──────────────────────────────────────────────────
type Tab = "overview" | "retention" | "funnel" | "params" | "events" | "apikey" | "share"
type RangeKey = "today" | "yesterday" | "7d" | "30d" | "month"

interface OverviewRow { date: string; dau: number; newUsers: number; records: number; activationRate: number | null; penetrationRate: number | null }
interface RetentionRow { cohortDate: string; newUsers: number; d1: number | null; d3: number | null; d7: number | null; d30: number | null }
interface FunnelRow { step: number; eventId: string; eventName: string; uv: number; stepRate: number | null; totalRate: number }
interface EventRow { eventId: string; eventName: string; count: number; deviceCount: number; versionBreakdown: Record<string, number> }
interface ParamEventItem { eventId: string; eventName: string; count: number }
interface ParamStringDist { value: string; count: number; ratio: number }
interface ParamNumberDist { label: string; count: number; ratio: number }
interface ParamResult {
  key: string
  type: "string" | "number"
  total?: number
  distribution: ParamStringDist[] | ParamNumberDist[]
  stats?: { avg: number; max: number; min: number; total: number }
}
interface ParamsData { eventId: string; eventName: string; totalCount: number; params: ParamResult[] }
interface ApiKeyRow { id: string; label: string; keyPreview: string; createdAt: string; lastUsedAt: string | null }
interface ShareRow { id: string; shareCode: string; createdAt: string; guestUser: { id: string; name: string | null; email: string } | null }

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "yesterday", label: "昨日" },
  { key: "7d", label: "近 7 天" },
  { key: "30d", label: "近 30 天" },
  { key: "month", label: "本月" },
]

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "核心大盘",  icon: Activity },
  { id: "retention",  label: "留存矩阵",  icon: Users },
  { id: "funnel",     label: "转化路径",  icon: TrendingUp },
  { id: "params",     label: "参数分析",  icon: SlidersHorizontal },
  { id: "events",     label: "事件明细",  icon: BarChart2 },
  { id: "apikey",     label: "API 接入",  icon: Key },
  { id: "share",      label: "分享管理",  icon: Share2 },
]

// ── 工具 ──────────────────────────────────────────────────
function pct(val: number | null) {
  if (val === null) return <span className="text-slate-600">—</span>
  return <span>{val}%</span>
}

function retentionBg(val: number | null) {
  if (val === null) return "text-slate-600"
  if (val >= 40) return "bg-green-500/25 text-green-300"
  if (val >= 20) return "bg-green-500/10 text-green-400"
  if (val >= 10) return "bg-yellow-500/15 text-yellow-400"
  return "bg-red-500/10 text-red-400"
}

function diff(cur: number, prev: number | undefined) {
  if (prev === undefined || prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}

function DiffBadge({ val }: { val: number | null }) {
  if (val === null) return <span className="text-slate-600">—</span>
  return (
    <span className={cn("text-xs font-medium", val >= 0 ? "text-green-400" : "text-red-400")}>
      {val >= 0 ? "+" : ""}{val}%
    </span>
  )
}

// ── 主组件 ────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>("overview")
  const [range, setRange] = useState<RangeKey>("7d")
  const [version, setVersion] = useState("all")
  const [projectName, setProjectName] = useState("")
  const [versions, setVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [overviewData, setOverviewData] = useState<OverviewRow[]>([])
  const [retentionData, setRetentionData] = useState<RetentionRow[]>([])
  const [funnelData, setFunnelData] = useState<FunnelRow[]>([])
  const [eventData, setEventData] = useState<EventRow[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])
  const [shares, setShares] = useState<ShareRow[]>([])

  // 参数分析 Tab 状态
  const [paramEventList, setParamEventList] = useState<ParamEventItem[]>([])
  const [paramsEventId, setParamsEventId] = useState("")
  const paramsEventIdRef = useRef("")
  const [paramsData, setParamsData] = useState<ParamsData | null>(null)

  // Excel 导出弹窗状态
  const [showExport, setShowExport] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
  const [exportStartDate, setExportStartDate] = useState(sevenDaysAgo)
  const [exportEndDate, setExportEndDate] = useState(today)
  const [exportSheets, setExportSheets] = useState(new Set(["events", "daily", "retention"]))
  const [exporting, setExporting] = useState(false)

  const [newKeyLabel, setNewKeyLabel] = useState("")
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creatingShare, setCreatingShare] = useState(false)
  const [sortField, setSortField] = useState<"count" | "deviceCount">("count")
  const [sortAsc, setSortAsc] = useState(false)

  // 加载项目名 + 版本列表
  useEffect(() => {
    fetch("/api/product-data/projects").then(r => r.json()).then((list: { id: string; name: string }[]) => {
      const p = list.find(x => x.id === projectId)
      if (p) setProjectName(p.name)
    })
    fetch(`/api/analytics/versions?projectId=${projectId}`).then(r => r.json()).then(setVersions)
  }, [projectId])

  const qs = useCallback((extra = "") =>
    `?projectId=${projectId}&range=${range}&version=${version}${extra}`, [projectId, range, version])

  const loadTab = useCallback(() => {
    setLoading(true)
    const done = () => setLoading(false)
    switch (tab) {
      case "overview":
        fetch(`/api/analytics/overview${qs()}`).then(r => r.json()).then(d => { setOverviewData(d); done() }).catch(done)
        break
      case "retention":
        fetch(`/api/analytics/retention${qs()}&cohorts=30`).then(r => r.json()).then(d => { setRetentionData(d); done() }).catch(done)
        break
      case "funnel":
        fetch(`/api/analytics/funnel${qs()}&steps=record_click_add,record_submit_success,record_cancel`).then(r => r.json()).then(d => { setFunnelData(d); done() }).catch(done)
        break
      case "params":
        fetch(`/api/analytics/event-list${qs()}`).then(r => r.json()).then(async (list: ParamEventItem[]) => {
          setParamEventList(list)
          const toSelect = paramsEventIdRef.current || (list.length > 0 ? list[0].eventId : "")
          if (toSelect) {
            if (!paramsEventIdRef.current) {
              paramsEventIdRef.current = toSelect
              setParamsEventId(toSelect)
            }
            const pData = await fetch(`/api/analytics/params${qs()}&eventId=${toSelect}`).then(r => r.json())
            setParamsData(pData)
          }
          done()
        }).catch(done)
        break
      case "events":
        fetch(`/api/analytics/events${qs()}`).then(r => r.json()).then(d => { setEventData(d); done() }).catch(done)
        break
      case "apikey":
        fetch("/api/apikeys").then(r => r.json()).then(d => { setApiKeys(d); done() }).catch(done)
        break
      case "share":
        fetch(`/api/shares?projectId=${projectId}`).then(r => r.json()).then(d => { setShares(d); done() }).catch(done)
        break
    }
  }, [tab, qs, projectId])

  useEffect(() => { loadTab() }, [loadTab])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("已复制到剪贴板")
  }

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) return
    setCreatingKey(true)
    try {
      const res = await fetch("/api/apikeys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: newKeyLabel.trim() }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setNewKeyValue(data.key); setNewKeyLabel(""); loadTab()
    } finally { setCreatingKey(false) }
  }

  const handleDeleteKey = async (id: string) => {
    await fetch(`/api/apikeys/${id}`, { method: "DELETE" })
    toast.success("API Key 已删除"); loadTab()
  }

  const handleCreateShare = async () => {
    setCreatingShare(true)
    try {
      const res = await fetch("/api/shares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("分享码已生成"); loadTab()
    } finally { setCreatingShare(false) }
  }

  const handleRevokeShare = async (id: string) => {
    await fetch(`/api/shares/${id}`, { method: "DELETE" })
    toast.success("分享已撤销"); loadTab()
  }

  const handleParamEventChange = async (eventId: string) => {
    paramsEventIdRef.current = eventId
    setParamsEventId(eventId)
    setLoading(true)
    try {
      const data = await fetch(`/api/analytics/params${qs()}&eventId=${eventId}`).then(r => r.json())
      setParamsData(data)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate || exportSheets.size === 0) return
    setExporting(true)
    try {
      const res = await fetch("/api/analytics/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          startDate: exportStartDate,
          endDate: exportEndDate,
          sheets: [...exportSheets],
        }),
      })
      if (!res.ok) { toast.error("导出失败，请重试"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const cd = res.headers.get("Content-Disposition") ?? ""
      const match = cd.match(/filename\*=UTF-8''(.+)/)
      a.download = match ? decodeURIComponent(match[1]) : `export_${exportStartDate}_${exportEndDate}.xlsx`
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
      setShowExport(false)
      toast.success("导出成功")
    } finally {
      setExporting(false)
    }
  }

  const sortedEvents = [...eventData].sort((a, b) =>
    sortAsc ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
  )

  const toggleSort = (field: "count" | "deviceCount") => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(false) }
  }

  // ── 渲染 ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* 面包屑 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/product-data")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> 产品数据
        </button>
        <span className="text-slate-700">/</span>
        <h1 className="text-xl font-bold text-white">{projectName || "..."}</h1>
      </div>

      {/* 全局筛选器 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 时间范围 */}
        <div className="flex items-center gap-1 rounded-lg bg-[#1C2127] p-1">
          {RANGE_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setRange(o.key)}
              className={cn("rounded px-3 py-1.5 text-xs font-medium transition-all",
                range === o.key ? "bg-[#137FEC] text-white shadow" : "text-slate-400 hover:text-white")}>
              {o.label}
            </button>
          ))}
        </div>
        {/* 版本筛选 */}
        {versions.length > 0 && (
          <select value={version} onChange={e => setVersion(e.target.value)}
            className="rounded-lg border border-slate-700 bg-[#1C2127] px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-[#137FEC] transition-colors">
            <option value="all">全部版本</option>
            {versions.map(v => <option key={v} value={v}>v{v}</option>)}
          </select>
        )}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
        <button onClick={() => setShowExport(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1C2127] px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <Download className="h-3.5 w-3.5" />导出数据
        </button>
      </div>

      {/* Tab 导航 */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-[#1C2127] p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === id ? "bg-[#137FEC] text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-white")}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Tab 1：核心大盘 ── */}
      {tab === "overview" && (
        <div className="space-y-4">
        <MetricsGuide items={METRICS_GUIDE.overview} />
        <Card className="overflow-hidden bg-[#1C2127] p-0">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0">
            <div>日期</div>
            <div className="text-right flex items-center justify-end">DAU<InfoTooltip text="当日触发任意事件的独立设备数（以 iOS IDFV 为唯一标识）。" /></div>
            <div className="text-right flex items-center justify-end">新增用户<InfoTooltip text="当日在本项目中首次出现的设备数，即「安装后首次打开 App」的新设备。" /></div>
            <div className="text-right flex items-center justify-end">记账笔数<InfoTooltip text="当日 record_submit_success 事件的触发总次数，含同一用户多次记账。" /></div>
            <div className="text-right flex items-center justify-end">激活率<InfoTooltip text="当日新增用户中，同日成功记录至少一笔账的比例。衡量新用户引导效果。" /></div>
            <div className="text-right flex items-center justify-end">核心渗透率<InfoTooltip text="当日 DAU 中，历史上曾创建过至少一个自定义项目的设备占比。" /></div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {overviewData.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">暂无数据</div>
            ) : (
              <>
                {[...overviewData].reverse().map((row, idx, arr) => {
                  const prev = arr[idx + 1]
                  return (
                    <div key={row.date} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] items-center px-6 py-3 hover:bg-slate-800/40 transition-colors text-sm">
                      <div className="text-slate-300">{row.date}</div>
                      <div className="text-right font-bold text-white">{row.dau > 0 ? row.dau.toLocaleString() : "—"}</div>
                      <div className="text-right text-slate-300">{row.newUsers > 0 ? row.newUsers.toLocaleString() : "—"}</div>
                      <div className="text-right text-slate-300">{row.records > 0 ? row.records.toLocaleString() : "—"}</div>
                      <div className="text-right">{pct(row.activationRate)}</div>
                      <div className="text-right">{pct(row.penetrationRate)}</div>
                    </div>
                  )
                })}
                {/* 环比行 */}
                {overviewData.length >= 2 && (() => {
                  const last = overviewData[overviewData.length - 1]
                  const prev = overviewData[overviewData.length - 2]
                  return (
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr] items-center bg-slate-800/30 px-6 py-3 text-sm font-semibold border-t-2 border-slate-700">
                      <div className="text-slate-400 text-xs uppercase tracking-wider">环比昨日</div>
                      <div className="text-right"><DiffBadge val={diff(last.dau, prev.dau)} /></div>
                      <div className="text-right"><DiffBadge val={diff(last.newUsers, prev.newUsers)} /></div>
                      <div className="text-right"><DiffBadge val={diff(last.records, prev.records)} /></div>
                      <div className="text-right"><DiffBadge val={last.activationRate !== null && prev.activationRate !== null ? last.activationRate - prev.activationRate : null} /></div>
                      <div className="text-right"><DiffBadge val={last.penetrationRate !== null && prev.penetrationRate !== null ? last.penetrationRate - prev.penetrationRate : null} /></div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </Card>
        </div>
      )}

      {/* ── Tab 2：留存矩阵 ── */}
      {tab === "retention" && (
        <div className="space-y-3">
          <MetricsGuide items={METRICS_GUIDE.retention} />
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>热力色段：</span>
            <span className="rounded px-2 py-0.5 bg-green-500/25 text-green-300">≥40%</span>
            <span className="rounded px-2 py-0.5 bg-green-500/10 text-green-400">20–39%</span>
            <span className="rounded px-2 py-0.5 bg-yellow-500/15 text-yellow-400">10–19%</span>
            <span className="rounded px-2 py-0.5 bg-red-500/10 text-red-400">&lt;10%</span>
          </div>
          <Card className="overflow-hidden bg-[#1C2127] p-0">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0">
              <div>安装日期<InfoTooltip text="该批设备在本项目中首次上报事件的日期，视为「安装日」。" /></div>
              <div className="text-right flex items-center justify-end">新增设备<InfoTooltip text="该日首次出现的设备总数。" /></div>
              <div className="text-right flex items-center justify-end">次日 D1<InfoTooltip text="安装次日再次触发任意事件的设备占比。记账类 App 健康值 ≥ 35%。" /></div>
              <div className="text-right flex items-center justify-end">三日 D3<InfoTooltip text="安装后第 3 天再次活跃的设备占比。" /></div>
              <div className="text-right flex items-center justify-end">七日 D7<InfoTooltip text="安装后第 7 天再次活跃的设备占比。健康值 ≥ 15%。" /></div>
              <div className="text-right flex items-center justify-end">次月 D30<InfoTooltip text="安装后第 30 天再次活跃的设备占比。衡量长期留存质量。" /></div>
            </div>
            <div className="divide-y divide-slate-800/60">
              {retentionData.filter(r => r.newUsers > 0).length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">暂无留存数据</div>
              ) : (
                retentionData.filter(r => r.newUsers > 0).reverse().map(row => (
                  <div key={row.cohortDate} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center px-6 py-3 hover:bg-slate-800/40 transition-colors text-sm">
                    <div className="text-slate-300">{row.cohortDate}</div>
                    <div className="text-right font-bold text-white">{row.newUsers}</div>
                    {[row.d1, row.d3, row.d7, row.d30].map((v, i) => (
                      <div key={i} className="text-right">
                        {v !== null ? (
                          <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-medium", retentionBg(v))}>{v}%</span>
                        ) : <span className="text-slate-600">—</span>}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 3：转化路径 ── */}
      {tab === "funnel" && (
        <div className="space-y-3">
          <MetricsGuide items={METRICS_GUIDE.funnel} />
          <Card className="overflow-hidden bg-[#1C2127] p-0">
            <div className="grid grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0">
              <div>步骤</div>
              <div>事件名称</div>
              <div>事件 ID</div>
              <div className="text-right flex items-center justify-end">触发设备 UV<InfoTooltip text="在所选时间范围内，触发该步骤事件的独立设备数（去重）。" /></div>
              <div className="text-right flex items-center justify-end">步骤转化率<InfoTooltip text="触发本步骤的设备数 ÷ 触发上一步骤的设备数。反映相邻两步的流失。" /></div>
              <div className="text-right flex items-center justify-end">总转化率<InfoTooltip text="触发本步骤的设备数 ÷ 触发第一步骤的设备数。反映全流程累计流失。" /></div>
            </div>
            <div className="divide-y divide-slate-800/60">
              {funnelData.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">暂无数据</div>
              ) : funnelData.map(row => (
                <div key={row.step} className="grid grid-cols-[0.5fr_2fr_2fr_1fr_1fr_1fr] items-center px-6 py-4 hover:bg-slate-800/40 transition-colors text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#137FEC]/20 text-xs font-bold text-[#137FEC]">{row.step}</div>
                  <div className="font-medium text-white">{row.eventName}</div>
                  <div className="font-mono text-xs text-slate-400">{row.eventId}</div>
                  <div className="text-right font-bold text-white">{row.uv.toLocaleString()}</div>
                  <div className="text-right">
                    {row.stepRate === null ? <span className="text-slate-600">—</span> : (
                      <span className={cn("text-sm font-medium", row.stepRate >= 60 ? "text-green-400" : row.stepRate >= 30 ? "text-yellow-400" : "text-red-400")}>{row.stepRate}%</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={cn("text-sm font-medium", row.totalRate >= 60 ? "text-green-400" : row.totalRate >= 30 ? "text-yellow-400" : "text-red-400")}>{row.totalRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 4：参数分析 ── */}
      {tab === "params" && (
        <div className="space-y-4">
          {/* 事件选择器 */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-400 shrink-0">选择事件：</span>
            {paramEventList.length === 0 ? (
              <span className="text-xs text-slate-500">所选时间范围内暂无事件数据</span>
            ) : (
              <select value={paramsEventId} onChange={e => handleParamEventChange(e.target.value)}
                className="rounded-lg border border-slate-700 bg-[#1C2127] px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-[#137FEC] transition-colors min-w-0 flex-1 max-w-sm">
                {paramEventList.map(e => (
                  <option key={e.eventId} value={e.eventId}>
                    {e.eventName}（{e.eventId}）— {e.count.toLocaleString()} 次
                  </option>
                ))}
              </select>
            )}
          </div>

          {paramsData && paramsData.totalCount > 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                共 <span className="text-slate-300 font-medium">{paramsData.totalCount.toLocaleString()}</span> 条记录，
                <span className="text-slate-300 font-medium">{paramsData.params.length}</span> 个参数字段
              </p>
              {paramsData.params.map(param => (
                <Card key={param.key} className="bg-[#1C2127] overflow-hidden p-0">
                  <div className="border-b border-slate-800 bg-[#181C22] px-6 py-3 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-200">{param.key}</span>
                    <span className="text-xs text-slate-500 rounded bg-slate-800 px-2 py-0.5">
                      {param.type === "number" ? "数值型" : "字符串型"}
                    </span>
                  </div>
                  {param.type === "string" ? (
                    <div className="divide-y divide-slate-800/60">
                      {(param.distribution as ParamStringDist[]).map(row => (
                        <div key={row.value} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/40 transition-colors">
                          <span className="w-36 text-sm font-medium text-white truncate" title={row.value}>{row.value || "（空）"}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-[#137FEC]" style={{ width: `${row.ratio}%` }} />
                          </div>
                          <span className="w-20 text-right text-xs text-slate-400">{row.count.toLocaleString()} 次</span>
                          <span className="w-10 text-right text-xs font-medium text-[#137FEC]">{row.ratio}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      <div className="flex gap-8 text-sm">
                        {[
                          { label: "均值", val: param.stats!.avg },
                          { label: "最大值", val: param.stats!.max },
                          { label: "最小值", val: param.stats!.min },
                          { label: "样本数", val: param.stats!.total },
                        ].map(({ label, val }) => (
                          <div key={label} className="text-center">
                            <div className="text-lg font-bold text-white">{val.toLocaleString()}</div>
                            <div className="text-xs text-slate-500">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="divide-y divide-slate-800/60 rounded-lg border border-slate-800 overflow-hidden">
                        {(param.distribution as ParamNumberDist[]).map(row => (
                          <div key={row.label} className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-800/40 transition-colors">
                            <span className="w-32 text-sm font-medium text-white">{row.label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-purple-500" style={{ width: `${row.ratio}%` }} />
                            </div>
                            <span className="w-20 text-right text-xs text-slate-400">{row.count.toLocaleString()} 次</span>
                            <span className="w-10 text-right text-xs font-medium text-purple-400">{row.ratio}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : paramsData !== null ? (
            <div className="py-16 text-center text-sm text-slate-500">该事件在所选时间范围内暂无参数数据</div>
          ) : null}
        </div>
      )}

      {/* ── Tab 5：事件明细 ── */}
      {tab === "events" && (
        <div className="space-y-3">
        <MetricsGuide items={METRICS_GUIDE.events} />
        <Card className="overflow-hidden bg-[#1C2127] p-0">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0">
            <div>事件名称</div>
            <div>事件 ID</div>
            <button className="text-right flex items-center justify-end gap-1 hover:text-white transition-colors" onClick={() => toggleSort("count")}>
              触发次数<InfoTooltip text="选定时间范围内该事件的上报总次数，包含同一设备多次触发。" />{sortField === "count" ? (sortAsc ? " ↑" : " ↓") : ""}
            </button>
            <button className="text-right flex items-center justify-end gap-1 hover:text-white transition-colors" onClick={() => toggleSort("deviceCount")}>
              触发设备<InfoTooltip text="触发该事件的独立设备数（去重），可理解为「有多少用户做了这个动作」。" />{sortField === "deviceCount" ? (sortAsc ? " ↑" : " ↓") : ""}
            </button>
            <div className="text-right flex items-center justify-end">版本分布<InfoTooltip text="触发该事件的 appVersion 分布，可对比不同版本的行为差异。" /></div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {sortedEvents.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">暂无事件数据</div>
            ) : sortedEvents.map(row => {
              const versions = Object.entries(row.versionBreakdown ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
              return (
                <div key={row.eventId} className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr] items-center px-6 py-3.5 hover:bg-slate-800/40 transition-colors text-sm">
                  <div className="font-medium text-white">{row.eventName}</div>
                  <div className="font-mono text-xs text-slate-400">{row.eventId}</div>
                  <div className="text-right font-bold text-white">{row.count.toLocaleString()}</div>
                  <div className="text-right text-slate-400">{row.deviceCount.toLocaleString()}</div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {versions.length === 0 ? <span className="text-slate-600 text-xs">—</span> : versions.map(([v, c]) => (
                      <span key={v} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">{v} <span className="text-slate-500">×{c}</span></span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        </div>
      )}

      {/* ── Tab 6：API 接入 ── */}
      {tab === "apikey" && (
        <div className="space-y-6">
          <Card className="bg-[#1C2127] p-6 space-y-4">
            <h3 className="font-bold text-white">生成 API Key</h3>
            <div className="flex gap-3">
              <input type="text" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)}
                placeholder="备注名，如：钱小满 iOS v1.0"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[#137FEC] transition-colors"
                onKeyDown={e => e.key === "Enter" && handleCreateKey()} />
              <button onClick={handleCreateKey} disabled={creatingKey || !newKeyLabel.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}生成
              </button>
            </div>
            {newKeyValue && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-2">
                <p className="text-xs font-bold text-green-400">⚠️ API Key 只显示一次，请立即复制保存！</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 break-all rounded bg-slate-900 px-3 py-2 font-mono text-sm text-green-300">{newKeyValue}</code>
                  <button onClick={() => handleCopy(newKeyValue)} className="shrink-0 rounded-lg border border-slate-700 p-2 hover:bg-slate-700 transition-colors">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
                <button onClick={() => setNewKeyValue(null)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">已保存，关闭</button>
              </div>
            )}
          </Card>
          {apiKeys.length > 0 && (
            <Card className="overflow-hidden bg-[#1C2127] p-0">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div>备注名</div><div>Key 预览</div><div>创建时间</div><div>最后使用</div><div />
              </div>
              <div className="divide-y divide-slate-800/60">
                {apiKeys.map(k => (
                  <div key={k.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center px-6 py-3.5">
                    <div className="font-medium text-white">{k.label}</div>
                    <div className="font-mono text-xs text-slate-400">{k.keyPreview}</div>
                    <div className="text-xs text-slate-500">{new Date(k.createdAt).toLocaleDateString("zh-CN")}</div>
                    <div className="text-xs text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("zh-CN") : "从未"}</div>
                    <button onClick={() => handleDeleteKey(k.id)} className="ml-2 rounded p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="bg-[#1C2127] p-6 space-y-4">
            <h3 className="font-bold text-white">iOS Swift 接入示例</h3>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300 leading-relaxed">
{`#if DEBUG
private let kApiBase = "http://localhost:3000"
#else
private let kApiBase = "https://www.superindividual.youqukeji.cn"
#endif
private let kApiKey  = "cplt_••••••••"

func trackEvent(eventId: String, eventName: String, params: [String: Any]? = nil) {
    let body: [String: Any] = [
        "projectId": "${projectId}",
        "deviceId": UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
        "eventId": eventId, "eventName": eventName,
        "params": params ?? [:],
        "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
        "osVersion": UIDevice.current.systemVersion,
        "occurredAt": ISO8601DateFormatter().string(from: Date())
    ]
    var req = URLRequest(url: URL(string: "\\(kApiBase)/api/events")!)
    req.httpMethod = "POST"
    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
    req.setValue("Bearer \\(kApiKey)", forHTTPHeaderField: "Authorization")
    req.httpBody = try? JSONSerialization.data(withJSONObject: body)
    URLSession.shared.dataTask(with: req).resume()
}`}
            </pre>
          </Card>
        </div>
      )}

      {/* ── Tab 7：分享管理 ── */}
      {tab === "share" && (
        <div className="space-y-6">
          <Card className="bg-[#1C2127] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">分享给其他账号查看</h3>
                <p className="mt-1 text-xs text-slate-500">生成分享码后，对方在「产品数据」页输入分享码即可只读查看本项目数据。可随时撤销。</p>
              </div>
              <button onClick={handleCreateShare} disabled={creatingShare}
                className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {creatingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}生成分享码
              </button>
            </div>
          </Card>
          {shares.length > 0 && (
            <Card className="overflow-hidden bg-[#1C2127] p-0">
              <div className="grid grid-cols-[1fr_2fr_1.5fr_auto] border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div>分享码</div><div>使用者</div><div>生成时间</div><div />
              </div>
              <div className="divide-y divide-slate-800/60">
                {shares.map(s => (
                  <div key={s.id} className="grid grid-cols-[1fr_2fr_1.5fr_auto] items-center px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-[#137FEC]">{s.shareCode}</span>
                      <button onClick={() => handleCopy(s.shareCode)} className="rounded p-1 text-slate-600 hover:text-slate-300 transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-sm">
                      {s.guestUser ? (
                        <div><p className="font-medium text-white">{s.guestUser.name ?? s.guestUser.email}</p><p className="text-xs text-slate-500">{s.guestUser.email}</p></div>
                      ) : <span className="text-xs text-slate-500">等待对方输入...</span>}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</div>
                    <button onClick={() => handleRevokeShare(s.id)}
                      className="ml-4 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">撤销</button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {shares.length === 0 && !loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Share2 className="h-10 w-10 text-slate-700" />
              <p className="text-slate-500 text-sm">还没有生成过分享码</p>
            </div>
          )}
        </div>
      )}

      {/* ── Excel 导出弹窗 ── */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowExport(false)}>
          <div className="bg-[#1C2127] rounded-xl border border-slate-700 p-6 w-96 space-y-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg">导出数据</h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">日期范围</label>
              <div className="flex items-center gap-2">
                <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-[#137FEC] transition-colors" />
                <span className="text-slate-500 text-sm shrink-0">至</span>
                <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-[#137FEC] transition-colors" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">导出内容（Sheet）</label>
              {[
                { key: "events", label: "事件流水", desc: "全量原始事件 + params 字段自动展开为列" },
                { key: "daily", label: "每日汇总", desc: "DAU / 新增用户 / 事件总量" },
                { key: "retention", label: "留存矩阵", desc: "D1 / D3 / D7 / D30 留存率" },
              ].map(s => (
                <label key={s.key} className="flex items-start gap-3 cursor-pointer rounded-lg px-3 py-2.5 hover:bg-slate-800/50 transition-colors">
                  <input type="checkbox" checked={exportSheets.has(s.key)}
                    onChange={() => {
                      const next = new Set(exportSheets)
                      next.has(s.key) ? next.delete(s.key) : next.add(s.key)
                      setExportSheets(next)
                    }}
                    className="mt-0.5 rounded accent-[#137FEC]" />
                  <div>
                    <span className="text-sm font-medium text-slate-200">{s.label}</span>
                    <span className="text-xs text-slate-500 ml-2">{s.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowExport(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                取消
              </button>
              <button onClick={handleExport}
                disabled={exporting || exportSheets.size === 0 || !exportStartDate || !exportEndDate}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#137FEC] py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                导出 Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
