'use client'

import React, { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  AlertTriangle, Clock, CheckSquare, Square, Rocket, Trash2,
  Plus, RefreshCw, ExternalLink, Github, Calendar,
  CheckCircle2, XCircle, Zap, Edit3, Save, X, Target, Wrench, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

// ─── 类型 ─────────────────────────────────────────
interface Task {
  id: string
  text: string
  completed: boolean
  type: "validation" | "dev"
}

interface Project {
  id: string
  name: string
  description: string | null
  repoUrl: string | null
  liveUrl: string | null
  deadline: string | null
  launchDate: string | null
  tasks: Task[]
  status: string
  createdAt: string
  idea: { title: string; vcScore: number | null } | null
}

// ─── 任务输入行 ────────────────────────────────────
function TaskInput({
  type,
  tasks,
  onAdd,
  onRemove,
  placeholder,
}: {
  type: "validation" | "dev"
  tasks: Task[]
  onAdd: (text: string, type: "validation" | "dev") => void
  onRemove: (id: string) => void
  placeholder: string
}) {
  const [input, setInput] = useState("")
  const filtered = tasks.filter(t => t.type === type)
  const color = type === "validation" ? "text-amber-400" : "text-[#137FEC]"
  const borderColor = type === "validation" ? "border-amber-500/30 bg-amber-500/5" : "border-[#137FEC]/20 bg-[#137FEC]/5"

  const add = () => {
    if (!input.trim()) { toast.error("请先输入任务内容"); return }
    onAdd(input.trim(), type)
    setInput("")
  }

  return (
    <div className="space-y-2">
      {filtered.length > 0 && (
        <div className={cn("space-y-1.5 rounded-lg border p-3", borderColor)}>
          {filtered.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2 text-sm text-slate-300">
              <span className="w-4 text-center text-[10px] text-slate-600">{i + 1}</span>
              <CheckSquare className={cn("h-3.5 w-3.5 shrink-0", color)} />
              <span className="flex-1">{t.text}</span>
              <button type="button" onClick={() => onRemove(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#137FEC]/50 focus:outline-none transition-colors"
        />
        <button type="button" onClick={add}
          className={cn("rounded-lg px-3 transition-colors",
            input.trim()
              ? type === "validation" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-[#137FEC] text-white hover:bg-blue-600"
              : "bg-slate-800 text-slate-500"
          )}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {filtered.length === 0 && (
        <p className="pl-1 text-xs text-slate-600">还没有任务，输入后按 Enter 添加</p>
      )}
    </div>
  )
}

// ─── 新建项目弹窗 ────────────────────────────────
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [form, setForm] = useState({ name: "", description: "", deadline: "", repoUrl: "" })
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<"validation" | "dev">("validation")
  const [submitting, setSubmitting] = useState(false)

  const addTask = (text: string, type: "validation" | "dev") => {
    setTasks(prev => [...prev, { id: Date.now().toString(), text, completed: false, type }])
  }
  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id))

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("请填写项目名称"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tasks }),
      })
      if (!res.ok) throw new Error("创建失败")
      const project = await res.json()
      onCreated(project)
      toast.success("项目已创建！")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  const validationCount = tasks.filter(t => t.type === "validation").length
  const devCount = tasks.filter(t => t.type === "dev").length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#101922] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">新建项目</h3>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-500 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          {/* 基础信息 */}
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="项目名称 *"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#137FEC]/50 focus:outline-none" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2} placeholder="项目简介（可选）"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#137FEC]/50 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">MVP 截止日期</label>
              <DatePicker value={form.deadline} onChange={v => setForm(p => ({ ...p, deadline: v }))}
                placeholder="选择截止日期" minDate={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 flex items-center gap-1">
                GitHub 仓库 <span className="text-slate-600 font-normal">（后续同步 commit）</span>
              </label>
              <input value={form.repoUrl} onChange={e => setForm(p => ({ ...p, repoUrl: e.target.value }))}
                placeholder="https://github.com/user/repo"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#137FEC]/50 transition-colors" />
            </div>
          </div>

          {/* 任务 Tab */}
          <div className="space-y-3">
            <div className="flex rounded-lg border border-slate-700 p-1 gap-1">
              <button type="button" onClick={() => setActiveTab("validation")}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  activeTab === "validation" ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"
                )}>
                <Target className="h-4 w-4" />
                验证任务
                {validationCount > 0 && <span className="rounded-full bg-amber-500/30 px-1.5 text-xs">{validationCount}</span>}
              </button>
              <button type="button" onClick={() => setActiveTab("dev")}
                className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                  activeTab === "dev" ? "bg-[#137FEC]/20 text-[#137FEC]" : "text-slate-500 hover:text-slate-300"
                )}>
                <Wrench className="h-4 w-4" />
                开发任务
                {devCount > 0 && <span className="rounded-full bg-[#137FEC]/30 px-1.5 text-xs">{devCount}</span>}
              </button>
            </div>

            {/* Tab 说明 */}
            <div className={cn("rounded-lg border px-4 py-2.5 text-xs",
              activeTab === "validation" ? "border-amber-500/20 bg-amber-500/5 text-amber-400/80" : "border-[#137FEC]/20 bg-[#137FEC]/5 text-[#137FEC]/80"
            )}>
              {activeTab === "validation"
                ? "MVP 上线后，用什么方法证明有人愿意付钱？例如：「发布内测，收集 50 个付费意愿」"
                : "最小范围实现产品需要哪些功能？例如：「完成用户注册 + 核心功能 + 接入支付」"}
            </div>

            <TaskInput type={activeTab} tasks={tasks} onAdd={addTask} onRemove={removeTask}
              placeholder={activeTab === "validation" ? "输入验证任务，按 Enter 添加..." : "输入开发任务，按 Enter 添加..."} />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-400 hover:bg-slate-800">取消</button>
          <button type="button" onClick={handleSubmit} disabled={submitting || !form.name.trim()}
            className="flex-1 rounded-lg bg-[#137FEC] py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {submitting ? "创建中..." : "创建项目"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── 任务列表（详情页）──────────────────────────
function TaskSection({
  type,
  tasks,
  active,
  onToggle,
}: {
  type: "validation" | "dev"
  tasks: Task[]
  active: boolean
  onToggle: (id: string) => void
}) {
  const filtered = tasks.filter(t => t.type === type)
  const completed = filtered.filter(t => t.completed).length
  const progress = filtered.length > 0 ? Math.round((completed / filtered.length) * 100) : 0
  const isValidation = type === "validation"

  if (filtered.length === 0) return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 py-4 px-4 text-sm text-slate-600">
      {isValidation ? <Target className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
      还没有{isValidation ? "验证" : "开发"}任务
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-bold uppercase tracking-wider", isValidation ? "text-amber-400" : "text-[#137FEC]")}>
          {completed}/{filtered.length} 已完成
        </span>
        <span className={cn("text-xs font-bold", isValidation ? "text-amber-400" : "text-[#137FEC]")}>{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
          className={cn("h-full", isValidation ? "bg-amber-500" : "bg-[#137FEC]")} />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {filtered.map(task => (
          <div key={task.id} onClick={() => active && onToggle(task.id)}
            className={cn("flex items-center gap-3 rounded-lg border p-3 transition-all",
              active ? "cursor-pointer hover:bg-slate-800/50" : "opacity-60",
              task.completed
                ? isValidation ? "border-amber-500/20 bg-amber-500/5" : "border-[#137FEC]/20 bg-[#137FEC]/5"
                : "border-slate-800"
            )}>
            {task.completed
              ? <CheckCircle2 className={cn("h-4 w-4 shrink-0", isValidation ? "text-amber-400" : "text-[#137FEC]")} />
              : <Square className="h-4 w-4 shrink-0 text-slate-600" />}
            <span className={cn("text-sm", task.completed ? "text-slate-500 line-through" : "text-slate-300")}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 倒计时组件 ──────────────────────────────────
function Countdown({ deadline }: { deadline: string }) {
  const [left, setLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, overdue: false })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) setLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true })
      else setLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        overdue: false,
      })
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [deadline])

  const isUrgent = left.days < 3 && !left.overdue
  return (
    <div className="text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
        {left.overdue ? "⚠️ 已逾期" : "距离 MVP 截止日期"}
      </p>
      <div className="flex justify-center gap-4">
        {[
          { value: left.days, label: "天" },
          { value: left.hours, label: "时" },
          { value: left.minutes, label: "分" },
          { value: left.seconds, label: "秒" },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex h-36 w-24 items-center justify-center rounded-xl border-b-4 border-slate-800 bg-[#1A2027] shadow-lg lg:h-44 lg:w-32">
              <span className={cn("text-5xl font-black lg:text-7xl", (isUrgent || left.overdue) && i > 0 ? "text-red-500" : "text-white")}>
                {String(item.value).padStart(2, "0")}
              </span>
            </div>
            <span className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 主页面 ─────────────────────────────────────
export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingUrl, setEditingUrl] = useState("")
  const [showUrlEdit, setShowUrlEdit] = useState(false)
  const [taskTab, setTaskTab] = useState<"validation" | "dev">("validation")
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const [savingName, setSavingName] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json()
      setProjects(data)
      if (data.length > 0 && !selectedId) {
        const active = data.find((p: Project) => p.status === "active") ?? data[0]
        setSelectedId(active.id)
      }
    } catch { toast.error("加载失败") }
    finally { setLoading(false) }
  }, [selectedId])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const current = projects.find(p => p.id === selectedId) ?? null
  const tasks: Task[] = Array.isArray(current?.tasks) ? (current.tasks as Task[]) : []

  const toggleTask = async (taskId: string) => {
    if (!current) return
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    setProjects(prev => prev.map(p => p.id === current.id ? { ...p, tasks: updated } : p))
    await fetch(`/api/projects/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: updated }),
    })
  }

  const updateStatus = async (status: string) => {
    if (!current) return
    try {
      const res = await fetch(`/api/projects/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const updated = await res.json()
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      toast.success(status === "launched" ? "🚀 项目已发布！" : "项目已放弃")
    } catch { toast.error("操作失败") }
  }

  const saveLiveUrl = async () => {
    if (!current) return
    await fetch(`/api/projects/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveUrl: editingUrl }),
    })
    setProjects(prev => prev.map(p => p.id === current.id ? { ...p, liveUrl: editingUrl } : p))
    setShowUrlEdit(false)
    toast.success("上线地址已保存")
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" })
    setProjects(prev => prev.filter(p => p.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast.success("项目已删除")
  }

  const startEditName = () => {
    if (!current) return
    setNameInput(current.name)
    setEditingName(true)
  }

  const saveProjectName = async () => {
    if (!current || !nameInput.trim()) return
    setSavingName(true)
    try {
      const res = await fetch(`/api/projects/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      const updated = await res.json()
      setProjects(prev => prev.map(p => p.id === current.id ? { ...p, name: updated.name } : p))
      setEditingName(false)
      toast.success("项目名称已更新")
    } catch {
      toast.error("保存失败，请重试")
    } finally {
      setSavingName(false)
    }
  }

  const validationTasks = tasks.filter(t => t.type === "validation")
  const devTasks = tasks.filter(t => t.type === "dev")
  const allCompleted = tasks.length > 0 && tasks.every(t => t.completed)

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">项目管理</h1>
          <p className="mt-1 text-slate-400">先验证能不能赚钱，再锁定范围交付 MVP。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProjects} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" /> 新建项目
          </button>
        </div>
      </div>

      {/* 项目选择栏 */}
      {projects.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={cn("shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                selectedId === p.id ? "border-[#137FEC] bg-[#137FEC]/10 text-[#137FEC]" : "border-slate-700 text-slate-400 hover:bg-slate-800"
              )}>
              {p.name}
              <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-[10px]",
                p.status === "launched" ? "bg-green-500/20 text-green-400" :
                p.status === "abandoned" ? "bg-slate-700 text-slate-500" : "bg-blue-500/20 text-blue-400"
              )}>
                {p.status === "launched" ? "已发布" : p.status === "abandoned" ? "已放弃" : "进行中"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && projects.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-4 py-16">
          <Zap className="h-12 w-12 text-slate-600" />
          <div className="text-center">
            <p className="font-semibold text-white">还没有项目</p>
            <p className="mt-1 text-sm text-slate-500">从创意验证器批准的想法立项，或直接新建</p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600">
            <Plus className="h-4 w-4" /> 新建项目
          </button>
        </Card>
      )}

      {/* 当前项目详情 */}
      {current && (
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* 逾期警告 */}
            {current.deadline && new Date(current.deadline) < new Date() && current.status === "active" && (
              <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  <AlertTriangle className="h-5 w-5" /> 截止日期已过，快速完成或重设时间
                </div>
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
              </div>
            )}

            {/* 倒计时 */}
            {current.deadline && current.status === "active" && <Countdown deadline={current.deadline} />}

            {/* 项目契约 */}
            <Card className="p-6 lg:p-8">
              {/* 项目头部信息 */}
              <div className="mb-6 flex items-start justify-between border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveProjectName()
                            if (e.key === "Escape") setEditingName(false)
                          }}
                          className="rounded-lg border border-[#137FEC]/50 bg-slate-900 px-3 py-1 text-xl font-bold text-white outline-none focus:border-[#137FEC] transition-colors w-64"
                        />
                        <button onClick={saveProjectName} disabled={savingName || !nameInput.trim()}
                          className="rounded-lg bg-[#137FEC] px-2.5 py-1.5 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
                          {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditingName(false)}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-slate-400 hover:bg-slate-800 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-2xl font-bold text-white">{current.name}</h2>
                        <button onClick={startEditName}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {current.idea && (
                      <span className="rounded bg-[#137FEC]/10 px-2 py-0.5 text-xs text-[#137FEC] border border-[#137FEC]/20">
                        VC {current.idea.vcScore ?? "–"}分
                      </span>
                    )}
                    {allCompleted && (
                      <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-400 border border-green-500/20">
                        全部完成 🎉
                      </span>
                    )}
                  </div>
                  {current.description && <p className="mt-1 text-sm text-slate-400">{current.description}</p>}
                  <div className="mt-2 flex gap-4">
                    {current.repoUrl && (
                      <a href={current.repoUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                        <Github className="h-3 w-3" /> 仓库
                      </a>
                    )}
                    {current.liveUrl ? (
                      <a href={current.liveUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors">
                        <ExternalLink className="h-3 w-3" /> 在线地址
                      </a>
                    ) : current.status === "launched" ? (
                      <button onClick={() => { setEditingUrl(""); setShowUrlEdit(true) }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors">
                        <Plus className="h-3 w-3" /> 添加上线地址
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  {current.deadline && (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1 justify-end">
                        <Calendar className="h-3 w-3" /> 截止日期
                      </p>
                      <p className="text-base font-bold text-white">
                        {new Date(current.deadline).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </>
                  )}
                  {current.launchDate && (
                    <p className="text-xs text-green-400 mt-1">
                      已于 {new Date(current.launchDate).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} 发布
                    </p>
                  )}
                </div>
              </div>

              {/* 任务 Tab */}
              {tasks.length > 0 && (
                <div className="space-y-4">
                  {/* Tab 切换 */}
                  <div className="flex rounded-lg border border-slate-700 p-1 gap-1">
                    <button onClick={() => setTaskTab("validation")}
                      className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                        taskTab === "validation" ? "bg-amber-500/20 text-amber-400" : "text-slate-500 hover:text-slate-300"
                      )}>
                      <Target className="h-4 w-4" />
                      验证任务
                      <span className={cn("rounded-full px-1.5 text-xs",
                        taskTab === "validation" ? "bg-amber-500/30 text-amber-400" : "bg-slate-700 text-slate-500"
                      )}>
                        {validationTasks.filter(t => t.completed).length}/{validationTasks.length}
                      </span>
                    </button>
                    <button onClick={() => setTaskTab("dev")}
                      className={cn("flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors",
                        taskTab === "dev" ? "bg-[#137FEC]/20 text-[#137FEC]" : "text-slate-500 hover:text-slate-300"
                      )}>
                      <Wrench className="h-4 w-4" />
                      开发任务
                      <span className={cn("rounded-full px-1.5 text-xs",
                        taskTab === "dev" ? "bg-[#137FEC]/30 text-[#137FEC]" : "bg-slate-700 text-slate-500"
                      )}>
                        {devTasks.filter(t => t.completed).length}/{devTasks.length}
                      </span>
                    </button>
                  </div>

                  {/* Tab 说明条 */}
                  <div className={cn("rounded-lg border px-4 py-2 text-xs",
                    taskTab === "validation"
                      ? "border-amber-500/20 bg-amber-500/5 text-amber-400/70"
                      : "border-[#137FEC]/20 bg-[#137FEC]/5 text-[#137FEC]/70"
                  )}>
                    {taskTab === "validation"
                      ? "上线后如何证明有人愿意付钱？先完成验证，再全力推广"
                      : "最小功能集，锁死范围，不做多余的"}
                  </div>

                  {/* 任务列表 */}
                  <AnimatePresence mode="wait">
                    <motion.div key={taskTab} initial={{ opacity: 0, x: taskTab === "validation" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }}>
                      <TaskSection type={taskTab} tasks={tasks} active={current.status === "active"} onToggle={toggleTask} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* URL 编辑 */}
              <AnimatePresence>
                {showUrlEdit && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex gap-2">
                    <input value={editingUrl} onChange={e => setEditingUrl(e.target.value)}
                      placeholder="https://your-product.com"
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#137FEC]/50" />
                    <button onClick={saveLiveUrl} className="rounded-lg bg-[#137FEC] px-3 py-2 text-white hover:bg-blue-600">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowUrlEdit(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-400 hover:bg-slate-800">
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* 操作按钮 */}
            {current.status === "active" && (
              <div className="flex gap-4">
                <button onClick={() => updateStatus("launched")}
                  className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-red-500 py-4 text-xl font-extrabold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:scale-[1.02] transition-all active:scale-[0.98]">
                  <Rocket className="h-6 w-6" /> 发布上线
                </button>
                <button onClick={() => updateStatus("abandoned")}
                  className="flex w-44 items-center justify-center gap-2 rounded-xl border-2 border-slate-700 py-4 text-lg font-bold text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors">
                  <Trash2 className="h-5 w-5" /> 放弃项目
                </button>
              </div>
            )}

            {current.status === "launched" && (
              <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="font-bold text-green-400">项目已成功发布！</p>
                    {current.launchDate && (
                      <p className="text-sm text-slate-400">发布于 {new Date(current.launchDate).toLocaleDateString("zh-CN")}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => { setEditingUrl(current.liveUrl ?? ""); setShowUrlEdit(true) }}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
                  <Edit3 className="h-4 w-4" />
                  {current.liveUrl ? "修改地址" : "添加地址"}
                </button>
              </div>
            )}

            {current.status === "abandoned" && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-5">
                <XCircle className="h-6 w-6 text-slate-500" />
                <div>
                  <p className="font-bold text-slate-400">项目已放弃</p>
                  <button onClick={() => handleDelete(current.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    永久删除此项目
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* 新建弹窗 */}
      <AnimatePresence>
        {showNewModal && (
          <NewProjectModal
            onClose={() => setShowNewModal(false)}
            onCreated={(p) => {
              setProjects(prev => [p, ...prev])
              setSelectedId(p.id)
              setShowNewModal(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
