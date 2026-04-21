'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Activity, Smartphone, ArrowRight, Plus, Clock, Share2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ProjectWithStats {
  id: string
  name: string
  status: string
  isShared: boolean
  latestEventAt: string | null
  todayDau: number
  todayEventCount: number
}

export default function ProductDataPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [shareCode, setShareCode] = useState("")
  const [joining, setJoining] = useState(false)

  const loadProjects = () => {
    fetch("/api/product-data/projects")
      .then((r) => r.json())
      .then((data) => { setProjects(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadProjects() }, [])

  const handleJoin = async () => {
    if (!shareCode.trim()) return
    setJoining(true)
    try {
      const res = await fetch("/api/shares/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`已加入「${data.projectName}」`)
      setShareCode("")
      loadProjects()
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">产品数据</h1>
          <div className="mt-2 flex items-center gap-2 text-slate-400">
            <Activity className="h-4 w-4 text-[#137FEC]" />
            <span>用户行为事件 · 留存分析 · 运营看板</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/project-management")}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1C2127] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> 接入新产品
        </button>
      </div>

      {/* 说明卡片 + 分享码入口 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#137FEC]/30 bg-[#137FEC]/5 p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-[#137FEC]" />
            <div className="text-sm text-slate-300">
              在「项目管理」中创建项目后，通过{" "}
              <span className="font-mono text-[#137FEC]">POST /api/events</span>{" "}
              上报用户行为事件，即可在此处查看完整数据看板。进入项目详情页可获取 API Key 和接入文档。
            </div>
          </div>
        </Card>

        <Card className="border-slate-700 bg-[#1C2127] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">加入共享项目</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              placeholder="输入分享码，如 QXMN-2847"
              maxLength={9}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none focus:border-[#137FEC] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={joining || !shareCode.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "加入"}
            </button>
          </div>
        </Card>
      </div>

      {/* 产品列表 */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-40 animate-pulse bg-slate-800/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 py-20 bg-[#1C2127]">
          <Activity className="h-12 w-12 text-slate-600" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">暂无接入数据的产品</p>
            <p className="mt-1 text-sm text-slate-400">
              先在「项目管理」创建项目，再通过 API Key 上报事件数据
            </p>
          </div>
          <button
            onClick={() => router.push("/project-management")}
            className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-5 py-2 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
          >
            去创建项目
          </button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              onClick={() => router.push(`/product-data/${p.id}`)}
              className="cursor-pointer bg-[#1C2127] p-5 transition-all hover:border-[#137FEC]/50 hover:bg-slate-800/80 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#137FEC] to-blue-700 shadow-lg shadow-blue-500/20">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white group-hover:text-[#137FEC] transition-colors">
                        {p.name}
                      </p>
                      {p.isShared && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                          <Share2 className="h-2.5 w-2.5" /> 共享
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        p.status === "launched"
                          ? "bg-green-500/10 text-green-400"
                          : p.status === "active"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-slate-500/10 text-slate-400"
                      )}
                    >
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        p.status === "launched" ? "bg-green-400" : "bg-blue-400"
                      )} />
                      {p.status === "launched" ? "上线" : p.status === "active" ? "开发中" : "已归档"}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-[#137FEC] transition-colors" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">今日 DAU</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {p.todayDau.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">今日事件</p>
                  <p className="mt-1 text-xl font-bold text-white">
                    {p.todayEventCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {p.latestEventAt && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  最新上报：{new Date(p.latestEventAt).toLocaleDateString("zh-CN")}
                </div>
              )}
              {!p.latestEventAt && (
                <div className="mt-3 text-xs text-slate-600">暂无上报数据，查看接入指南 →</div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
