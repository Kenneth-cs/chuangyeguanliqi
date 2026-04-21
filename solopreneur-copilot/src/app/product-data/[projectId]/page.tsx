'use client'

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft, Activity, BarChart2, Users, Key, Share2,
  Copy, Trash2, Plus, Check, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Tab = "overview" | "events" | "retention" | "apikey" | "share"

interface DauRow { date: string; dau: number }
interface EventRow {
  eventId: string; eventName: string; count: number; deviceCount: number
  versionBreakdown: Record<string, number>
}
interface RetentionRow {
  cohortDate: string; newUsers: number
  d1: number | null; d7: number | null; d30: number | null
}
interface ApiKeyRow {
  id: string; label: string; keyPreview: string; createdAt: string; lastUsedAt: string | null
}

const DAY_OPTIONS = [7, 14, 30] as const
type DayOption = typeof DAY_OPTIONS[number]

export default function ProductDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>("overview")
  const [projectName, setProjectName] = useState("")
  const [days, setDays] = useState<DayOption>(7)

  const [dauData, setDauData] = useState<DauRow[]>([])
  const [eventData, setEventData] = useState<EventRow[]>([])
  const [retentionData, setRetentionData] = useState<RetentionRow[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])

  interface ShareRow {
    id: string; shareCode: string; createdAt: string
    guestUser: { id: string; name: string | null; email: string } | null
  }
  const [shares, setShares] = useState<ShareRow[]>([])
  const [creatingShare, setCreatingShare] = useState(false)

  const [loading, setLoading] = useState(false)
  const [newKeyLabel, setNewKeyLabel] = useState("")
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 加载项目信息
  useEffect(() => {
    fetch("/api/product-data/projects")
      .then((r) => r.json())
      .then((list: { id: string; name: string }[]) => {
        const p = list.find((x) => x.id === projectId)
        if (p) setProjectName(p.name)
      })
  }, [projectId])

  const loadDau = useCallback(() => {
    setLoading(true)
    fetch(`/api/analytics/dau?projectId=${projectId}&days=${days}`)
      .then((r) => r.json())
      .then((d) => { setDauData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId, days])

  const loadEvents = useCallback(() => {
    setLoading(true)
    fetch(`/api/analytics/events?projectId=${projectId}&days=${days}`)
      .then((r) => r.json())
      .then((d) => { setEventData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId, days])

  const loadRetention = useCallback(() => {
    setLoading(true)
    fetch(`/api/analytics/retention?projectId=${projectId}&cohorts=30`)
      .then((r) => r.json())
      .then((d) => { setRetentionData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const loadApiKeys = useCallback(() => {
    fetch("/api/apikeys")
      .then((r) => r.json())
      .then(setApiKeys)
  }, [])

  const loadShares = useCallback(() => {
    fetch(`/api/shares?projectId=${projectId}`)
      .then((r) => r.json())
      .then(setShares)
  }, [projectId])

  useEffect(() => {
    if (tab === "overview") loadDau()
    else if (tab === "events") loadEvents()
    else if (tab === "retention") loadRetention()
    else if (tab === "apikey") loadApiKeys()
    else if (tab === "share") loadShares()
  }, [tab, days, loadDau, loadEvents, loadRetention, loadApiKeys, loadShares])

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) return
    setCreatingKey(true)
    try {
      const res = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newKeyLabel.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setNewKeyValue(data.key)
      setNewKeyLabel("")
      loadApiKeys()
    } finally {
      setCreatingKey(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    await fetch(`/api/apikeys/${id}`, { method: "DELETE" })
    toast.success("API Key 已删除")
    loadApiKeys()
  }

  const handleCreateShare = async () => {
    setCreatingShare(true)
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("分享码已生成")
      loadShares()
    } finally {
      setCreatingShare(false)
    }
  }

  const handleRevokeShare = async (id: string) => {
    await fetch(`/api/shares/${id}`, { method: "DELETE" })
    toast.success("分享已撤销")
    loadShares()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("已复制到剪贴板")
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "DAU 概览", icon: Activity },
    { id: "events", label: "事件统计", icon: BarChart2 },
    { id: "retention", label: "留存分析", icon: Users },
    { id: "apikey", label: "API 接入", icon: Key },
    { id: "share", label: "分享管理", icon: Share2 },
  ]

  const retentionColor = (val: number | null) => {
    if (val === null) return "text-slate-600"
    if (val >= 40) return "text-green-400"
    if (val >= 20) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/product-data")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 产品数据
        </button>
        <span className="text-slate-700">/</span>
        <h1 className="text-xl font-bold text-white">{projectName || "加载中..."}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-[#1C2127] p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              tab === id
                ? "bg-[#137FEC] text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* 日期筛选（overview & events） */}
      {(tab === "overview" || tab === "events") && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">时间范围：</span>
          <div className="flex gap-1 rounded-lg bg-slate-800/50 p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded px-3 py-1 text-xs font-medium transition-all",
                  days === d
                    ? "bg-[#1C2127] text-white shadow-sm"
                    : "text-slate-500 hover:text-white"
                )}
              >
                近 {d} 天
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      )}

      {/* Tab: DAU 概览 */}
      {tab === "overview" && !loading && (
        <Card className="overflow-hidden bg-[#1C2127] p-0">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-0 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>日期</div>
            <div className="text-right">日活用户（DAU）</div>
            <div className="text-right">环比</div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {dauData.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">暂无数据，请先上报事件</div>
            ) : (
              [...dauData].reverse().map((row, idx, arr) => {
                const prev = arr[idx + 1]?.dau ?? null
                const diff = prev !== null && prev > 0 ? Math.round(((row.dau - prev) / prev) * 100) : null
                return (
                  <div
                    key={row.date}
                    className="grid grid-cols-[1fr_1fr_1fr] items-center gap-0 px-6 py-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="text-sm text-slate-300">{row.date}</div>
                    <div className="text-right font-bold text-white">
                      {row.dau > 0 ? row.dau.toLocaleString() : <span className="text-slate-600">—</span>}
                    </div>
                    <div className="text-right text-xs">
                      {diff === null || row.dau === 0 ? (
                        <span className="text-slate-600">—</span>
                      ) : (
                        <span className={diff >= 0 ? "text-green-400" : "text-red-400"}>
                          {diff >= 0 ? "+" : ""}{diff}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab: 事件统计 */}
      {tab === "events" && !loading && (
        <Card className="overflow-hidden bg-[#1C2127] p-0">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr] gap-0 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            <div>事件名称</div>
            <div>事件 ID</div>
            <div className="text-right">触发次数</div>
            <div className="text-right">触发设备数</div>
            <div className="text-right">版本分布</div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {eventData.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">近 {days} 天暂无事件数据</div>
            ) : (
              eventData.map((row) => {
                const versions = Object.entries(row.versionBreakdown ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                return (
                  <div
                    key={row.eventId}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1.5fr] items-center gap-0 px-6 py-3.5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="font-medium text-white">{row.eventName}</div>
                    <div className="font-mono text-xs text-slate-400">{row.eventId}</div>
                    <div className="text-right font-bold text-white">{row.count.toLocaleString()}</div>
                    <div className="text-right text-sm text-slate-400">{row.deviceCount.toLocaleString()}</div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {versions.length === 0 ? (
                        <span className="text-xs text-slate-600">—</span>
                      ) : versions.map(([v, c]) => (
                        <span key={v} className="rounded-full bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">
                          {v} <span className="text-slate-500">×{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab: 留存分析 */}
      {tab === "retention" && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            留存率 = 该批次设备在 D1/D7/D30 再次触发任意事件的比例。颜色：
            <span className="text-green-400"> ≥40% 优秀</span>
            <span className="text-yellow-400"> ≥20% 一般</span>
            <span className="text-red-400"> &lt;20% 待改善</span>
          </p>
          <Card className="overflow-hidden bg-[#1C2127] p-0">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-0 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div>安装日期</div>
              <div className="text-right">新增设备</div>
              <div className="text-right">次日 D1</div>
              <div className="text-right">7 日 D7</div>
              <div className="text-right">30 日 D30</div>
            </div>
            <div className="divide-y divide-slate-800/60">
              {retentionData.filter((r) => r.newUsers > 0).length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">暂无留存数据</div>
              ) : (
                retentionData
                  .filter((r) => r.newUsers > 0)
                  .reverse()
                  .map((row) => (
                    <div
                      key={row.cohortDate}
                      className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-0 px-6 py-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="text-sm text-slate-300">{row.cohortDate}</div>
                      <div className="text-right font-bold text-white">{row.newUsers}</div>
                      <div className={cn("text-right font-medium", retentionColor(row.d1))}>
                        {row.d1 !== null ? `${row.d1}%` : "—"}
                      </div>
                      <div className={cn("text-right font-medium", retentionColor(row.d7))}>
                        {row.d7 !== null ? `${row.d7}%` : "—"}
                      </div>
                      <div className={cn("text-right font-medium", retentionColor(row.d30))}>
                        {row.d30 !== null ? `${row.d30}%` : "—"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: API 接入 */}
      {tab === "apikey" && (
        <div className="space-y-6">
          {/* 生成新 Key */}
          <Card className="bg-[#1C2127] p-6 space-y-4">
            <h3 className="font-bold text-white">生成 API Key</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="备注名，如：钱小满 iOS v1.0"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-[#137FEC] transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
              />
              <button
                onClick={handleCreateKey}
                disabled={creatingKey || !newKeyLabel.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                生成
              </button>
            </div>

            {/* 新生成的 Key 展示（只展示一次） */}
            {newKeyValue && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-2">
                <p className="text-xs font-bold text-green-400">⚠️ API Key 只显示一次，请立即复制保存！</p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 break-all rounded bg-slate-900 px-3 py-2 font-mono text-sm text-green-300">
                    {newKeyValue}
                  </code>
                  <button
                    onClick={() => handleCopy(newKeyValue)}
                    className="shrink-0 rounded-lg border border-slate-700 p-2 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
                <button
                  onClick={() => setNewKeyValue(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  已保存，关闭
                </button>
              </div>
            )}
          </Card>

          {/* 已有 Key 列表 */}
          {apiKeys.length > 0 && (
            <Card className="overflow-hidden bg-[#1C2127] p-0">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-0 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div>备注名</div>
                <div>Key 预览</div>
                <div>创建时间</div>
                <div>最后使用</div>
                <div />
              </div>
              <div className="divide-y divide-slate-800/60">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] items-center gap-0 px-6 py-3.5"
                  >
                    <div className="font-medium text-white">{k.label}</div>
                    <div className="font-mono text-xs text-slate-400">{k.keyPreview}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(k.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("zh-CN") : "从未使用"}
                    </div>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="ml-2 rounded p-1.5 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* iOS 接入示例代码 */}
          <Card className="bg-[#1C2127] p-6 space-y-4">
            <h3 className="font-bold text-white">iOS Swift 接入示例</h3>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300 leading-relaxed">
{`// ── 环境配置（切换开发/生产）────────────────────────────
// 模拟器调试：用 localhost（模拟器与 Mac 共享网络，无需部署）
// 发布生产：切换为服务器地址
#if DEBUG
private let kApiBase = "http://localhost:3000"
#else
private let kApiBase = "http://124.222.88.25"
#endif
private let kApiKey  = "cplt_••••••••"   // 替换为真实 Key

// ── 上报函数 ─────────────────────────────────────────────
func trackEvent(
    eventId: String,
    eventName: String,
    params: [String: Any]? = nil
) {
    let body: [String: Any] = [
        "projectId": "${projectId}",
        "deviceId": UIDevice.current
            .identifierForVendor?.uuidString ?? "unknown",
        "eventId": eventId,
        "eventName": eventName,
        "params": params ?? [:],
        "appVersion": Bundle.main.infoDictionary?[
            "CFBundleShortVersionString"] as? String ?? "1.0",
        "osVersion": UIDevice.current.systemVersion,
        "occurredAt": ISO8601DateFormatter()
            .string(from: Date())
    ]
    var req = URLRequest(
        url: URL(string: "\\(kApiBase)/api/events")!
    )
    req.httpMethod = "POST"
    req.setValue("application/json",
        forHTTPHeaderField: "Content-Type")
    req.setValue("Bearer \\(kApiKey)",
        forHTTPHeaderField: "Authorization")
    req.httpBody = try? JSONSerialization
        .data(withJSONObject: body)
    URLSession.shared.dataTask(with: req).resume()
}

// 使用示例：
trackEvent(
    eventId: "record_submit_success",
    eventName: "记账成功",
    params: ["category": "餐饮", "amount_level": "level_1_under100"]
)`}
            </pre>
            <p className="text-xs text-slate-500">
              将 <code className="text-slate-300">sk_live_••••••••</code> 替换为上方生成的 API Key。
              projectId 已自动填入当前项目 ID。
            </p>
          </Card>
        </div>
      )}
      {/* Tab: 分享管理 */}
      {tab === "share" && (
        <div className="space-y-6">
          <Card className="bg-[#1C2127] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">分享给其他账号查看</h3>
                <p className="mt-1 text-xs text-slate-500">
                  生成分享码后，对方在「产品数据」页输入分享码即可只读查看本项目数据。你可随时撤销。
                </p>
              </div>
              <button
                onClick={handleCreateShare}
                disabled={creatingShare}
                className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {creatingShare ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                生成分享码
              </button>
            </div>
          </Card>

          {shares.length > 0 && (
            <Card className="overflow-hidden bg-[#1C2127] p-0">
              <div className="grid grid-cols-[1fr_2fr_1.5fr_auto] gap-0 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div>分享码</div>
                <div>使用者</div>
                <div>生成时间</div>
                <div />
              </div>
              <div className="divide-y divide-slate-800/60">
                {shares.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_2fr_1.5fr_auto] items-center gap-0 px-6 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-[#137FEC]">
                        {s.shareCode}
                      </span>
                      <button
                        onClick={() => handleCopy(s.shareCode)}
                        className="rounded p-1 text-slate-600 hover:text-slate-300 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="text-sm">
                      {s.guestUser ? (
                        <div>
                          <p className="font-medium text-white">{s.guestUser.name ?? s.guestUser.email}</p>
                          <p className="text-xs text-slate-500">{s.guestUser.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">等待对方输入分享码...</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                    <button
                      onClick={() => handleRevokeShare(s.id)}
                      className="ml-4 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      撤销
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {shares.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Share2 className="h-10 w-10 text-slate-700" />
              <p className="text-slate-500 text-sm">还没有生成过分享码</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
