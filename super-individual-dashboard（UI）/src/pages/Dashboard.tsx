import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  Play,
  Info,
  Lightbulb,
  RefreshCw,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const stats = [
  {
    name: "MRR (月经常性收入)",
    value: "¥12,500",
    change: "+15%",
    trend: "up",
    description: "较上月增长 ¥1,630",
    icon: DollarSign,
    path: "/marketing",
  },
  {
    name: "活跃用户",
    value: "1,240",
    change: "+5%",
    trend: "up",
    description: "昨日新增 12 位用户",
    icon: Users,
    path: "/marketing",
  },
  {
    name: "净利润",
    value: "¥8,900",
    change: "+12%",
    trend: "up",
    description: "利润率 71.2%",
    icon: TrendingUp,
    path: "/marketing",
  },
];

const ideas = [
  {
    name: "Notion 待办插件",
    category: "SaaS / B2C",
    date: "2 小时前",
    score: 85,
    status: "High Potential",
    statusColor: "text-green-500 bg-green-500/10",
    barColor: "bg-green-500",
    icon: CheckCircle2,
  },
  {
    name: "宠物社交 App",
    category: "Mobile / C2C",
    date: "昨天",
    score: 62,
    status: "Needs Research",
    statusColor: "text-yellow-500 bg-yellow-500/10",
    barColor: "bg-yellow-500",
    icon: AlertCircle,
  },
  {
    name: "二手书聚合平台",
    category: "Marketplace",
    date: "3 天前",
    score: 45,
    status: "Archived",
    statusColor: "text-slate-400 bg-slate-400/10",
    barColor: "bg-slate-400",
    icon: Archive,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: "完成核心 API 对接", completed: true },
    { id: 2, text: "前端编辑器组件开发", completed: false },
    { id: 3, text: "准备内测邀请码系统", completed: false },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("数据已更新");
    }, 1500);
  };

  const handleEnterEnv = () => {
    toast.success("正在启动开发环境...", {
      description: "AI 写作助手 V1.0 环境准备中",
    });
  };

  const handleViewDetails = () => {
    navigate("/project-management");
  };

  const handleNewValidation = () => {
    navigate("/idea-validator");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">仪表盘概览</h1>
          <p className="mt-2 text-slate-400">
            欢迎回来，这是你构建帝国的第 <span className="font-bold text-[#137FEC]">142</span> 天。
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1C2127] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "刷新中..." : "刷新数据"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(stat.path)}
          >
            <Card className="relative overflow-hidden hover:border-[#137FEC]/50 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{stat.name}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {stat.value}
                    </span>
                    <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-500">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-2 group-hover:bg-[#137FEC]/10 group-hover:text-[#137FEC] transition-colors">
                  <stat.icon className="h-5 w-5 text-slate-400 group-hover:text-[#137FEC] transition-colors" />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{stat.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Current Focus */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#137FEC]" />
          <h2 className="text-xl font-bold text-white">当前聚焦</h2>
        </div>
        <Card className="flex flex-col gap-6 lg:flex-row hover:border-slate-700 transition-colors">
          {/* Image Placeholder */}
          <div className="h-64 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 lg:w-[400px] relative group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#137FEC]/20 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-[#137FEC]" />
                </div>
                <p className="text-sm font-medium text-slate-400">AI Project Visualization</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="mb-2 inline-block rounded bg-[#137FEC]/20 px-2 py-1 text-xs font-bold text-[#137FEC]">
                    MVP 构建阶段
                  </span>
                  <h3 className="text-2xl font-bold text-white">
                    AI 写作助手 V1.0
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">截止日期</p>
                  <p className="text-base font-medium text-white">10月 24日</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    {task.completed ? (
                      <CheckSquare className="h-4 w-4 text-[#137FEC]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-500 group-hover:text-slate-400" />
                    )}
                    <span className={cn("text-sm transition-colors", task.completed ? "text-slate-500 line-through" : "text-slate-300 group-hover:text-white")}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-400" />
                    <span className="text-lg font-bold text-white">
                      3 天 4 小时
                    </span>
                    <span className="text-sm text-slate-400">剩余</span>
                  </div>
                  <span className="text-base font-bold text-[#137FEC]">
                    {Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#137FEC]" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleEnterEnv}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#137FEC] py-3 text-base font-medium text-white hover:bg-blue-600 transition-colors active:scale-[0.98]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  进入开发环境
                </button>
                <button 
                  onClick={handleViewDetails}
                  className="flex items-center justify-center rounded-lg border border-slate-600 bg-transparent px-4 py-3 text-base font-medium text-slate-300 hover:bg-slate-800 transition-colors active:scale-[0.98]"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Idea Validation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">最近创意验证</h2>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-[#137FEC] hover:text-blue-400 transition-colors">
            全部历史 <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-800 bg-slate-900/50 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div>创意名称</div>
            <div>市场赛道</div>
            <div>验证日期</div>
            <div>AI 评分</div>
            <div className="text-right">状态</div>
          </div>
          <div className="divide-y divide-slate-800">
            {ideas.map((idea) => (
              <div
                key={idea.name}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
                    <idea.icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{idea.name}</p>
                    <p className="text-xs text-slate-500">生产力工具</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">{idea.category}</div>
                <div className="text-sm text-slate-400">{idea.date}</div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-sm font-bold", idea.status === "High Potential" ? "text-green-500" : idea.status === "Needs Research" ? "text-yellow-500" : "text-red-500")}>
                    {idea.score}
                  </span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={cn("h-full", idea.barColor)}
                      style={{ width: `${idea.score}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      idea.statusColor
                    )}
                  >
                    {idea.status === "High Potential" ? "高潜力" : idea.status === "Needs Research" ? "需调研" : "已归档"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 p-4">
            <button 
              onClick={handleNewValidation}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 py-3 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors hover:bg-slate-800/50"
            >
              <Lightbulb className="h-5 w-5" />
              开始新的创意验证
            </button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
