'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Lightbulb,
  History,
  ListTodo,
  BarChart2,
  Activity,
  Settings,
  Zap,
  LogOut,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "仪表盘", path: "/", icon: LayoutDashboard },
  { name: "创意验证器", path: "/idea-validator", icon: Lightbulb },
  { name: "每日复盘", path: "/daily", icon: History },
  { name: "项目管理", path: "/project-management", icon: ListTodo },
  { name: "营销看板", path: "/marketing", icon: BarChart2 },
  { name: "产品数据", path: "/product-data", icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const user = session?.user
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "???"

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-[#101922] border-r border-slate-800 text-slate-300">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#137FEC] to-blue-700 shadow-lg shadow-blue-500/20">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">超级个体</span>
          <span className="text-xs text-slate-500">专注变现 · 极速构建</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path))
                ? "bg-[#137FEC] text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-4 px-4 pb-6">
        {/* Pro Plan Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-b from-[#25303B] to-[#1C2630] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#137FEC]" />
            <span className="text-xs font-bold text-[#137FEC]">
              {session?.user?.plan === "pro" ? "Pro 计划" : "Free 计划"}
            </span>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            解锁更多 AI 验证次数与高级分析报表。
          </p>
          <button className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors">
            升级账号
          </button>
        </div>

        {/* User Profile */}
        <Link href="/settings" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800 transition-colors group">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name ?? "avatar"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137FEC]/20 text-xs font-bold text-[#137FEC]">
              {initials}
            </div>
          )}
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-medium text-white">
              {user?.name ?? user?.email ?? "未登录"}
            </span>
            <span className="text-[10px] text-slate-500">
              {session?.user?.plan === "pro" ? "Pro 计划" : "免费计划"}
            </span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
            <button onClick={e => { e.preventDefault(); handleSignOut() }} title="退出登录">
              <LogOut className="h-4 w-4 text-slate-500 hover:text-red-400 transition-colors" />
            </button>
          </div>
        </Link>
      </div>
    </div>
  )
}
