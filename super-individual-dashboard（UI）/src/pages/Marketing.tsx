import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Activity,
  Server,
  Database,
  GitCommit,
  Clock,
  Shield,
  CreditCard,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const products = [
  {
    name: "AI Writer Pro",
    version: "v3.1.2 • stable",
    status: "Live",
    users: "12,400",
    mrr: "$4,200",
    ltv: "$120",
    icon: "bg-gradient-to-br from-purple-500 to-indigo-500",
    initial: "AI",
  },
  {
    name: "Code Snippet X",
    version: "v1.0.4 • beta",
    status: "Beta",
    users: "3,100",
    mrr: "$800",
    ltv: "$45",
    icon: "bg-gradient-to-br from-blue-500 to-cyan-500",
    initial: "CS",
  },
  {
    name: "Design Assets Hub",
    version: "v2.2.0 • legacy",
    status: "Live",
    users: "8,200",
    mrr: "$3,100",
    ltv: "$95",
    icon: "bg-gradient-to-br from-pink-500 to-rose-500",
    initial: "DA",
  },
  {
    name: "Solo CRM",
    version: "v0.9.1 • patch",
    status: "Maint.",
    users: "1,500",
    mrr: "$450",
    ltv: "$30",
    icon: "bg-gradient-to-br from-orange-500 to-amber-500",
    initial: "SC",
  },
];

const chartData12M = [
  { name: "Jan", revenue: 4000, cost: 2400 },
  { name: "Feb", revenue: 3000, cost: 1398 },
  { name: "Mar", revenue: 2000, cost: 9800 },
  { name: "Apr", revenue: 2780, cost: 3908 },
  { name: "May", revenue: 1890, cost: 4800 },
  { name: "Jun", revenue: 2390, cost: 3800 },
  { name: "Jul", revenue: 3490, cost: 4300 },
  { name: "Aug", revenue: 4000, cost: 2400 },
  { name: "Sep", revenue: 3000, cost: 1398 },
  { name: "Oct", revenue: 2000, cost: 9800 },
  { name: "Nov", revenue: 2780, cost: 3908 },
  { name: "Dec", revenue: 1890, cost: 4800 },
];

const chartData30D = Array.from({ length: 30 }, (_, i) => ({
  name: `${i + 1}`,
  revenue: Math.floor(Math.random() * 5000) + 1000,
  cost: Math.floor(Math.random() * 3000) + 500,
}));

const chartData7D = Array.from({ length: 7 }, (_, i) => ({
  name: `Day ${i + 1}`,
  revenue: Math.floor(Math.random() * 5000) + 1000,
  cost: Math.floor(Math.random() * 3000) + 500,
}));

export default function Marketing() {
  const [period, setPeriod] = useState<"12M" | "30D" | "7D">("12M");
  const [isSyncing, setIsSyncing] = useState(false);

  const getChartData = () => {
    switch (period) {
      case "30D":
        return chartData30D;
      case "7D":
        return chartData7D;
      default:
        return chartData12M;
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    toast.info("正在同步数据...", {
      description: "从 Stripe, Google Analytics 和 GitHub 拉取最新数据",
    });
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("数据同步完成", {
        description: "所有指标已更新至最新状态",
      });
    }, 2000);
  };

  const handleAddProduct = () => {
    toast("添加新产品", {
      description: "请前往 Stripe Dashboard 创建新产品，系统会自动同步。",
      action: {
        label: "去 Stripe",
        onClick: () => window.open("https://dashboard.stripe.com", "_blank"),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">矩阵基础设施</h1>
          <div className="mt-2 flex items-center gap-2 text-slate-400">
            <Activity className="h-4 w-4 text-[#137FEC]" />
            <span>Matrix Core - 集中式指挥中心</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1C2127] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
          <button 
            onClick={handleAddProduct}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1C2127] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            name: "Total Products",
            value: "12",
            change: "+2",
            icon: Package,
            color: "text-green-500",
          },
          {
            name: "Active Users",
            value: "45.2K",
            change: "+12%",
            icon: Users,
            color: "text-green-500",
          },
          {
            name: "Total MRR",
            value: "$12,450",
            change: "+8.5%",
            icon: DollarSign,
            color: "text-green-500",
          },
          {
            name: "Net LTV",
            value: "$450",
            change: "+2.1%",
            icon: TrendingUp,
            color: "text-green-500",
          },
        ].map((stat) => (
          <Card key={stat.name} className="relative overflow-hidden bg-[#1C2127] hover:border-slate-600 transition-colors group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">
                  {stat.name}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span
                    className={cn(
                      "rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium",
                      stat.color
                    )}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <stat.icon className="h-8 w-8 text-slate-700 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all" />
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button className="flex items-center gap-2 border-b-2 border-[#137FEC] px-6 py-3 text-sm font-bold text-white">
          <Shield className="h-4 w-4" /> Passport (Auth)
        </button>
        <button className="flex items-center gap-2 border-b-2 border-transparent px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">
          <CreditCard className="h-4 w-4" /> Payment Hub
        </button>
      </div>

      {/* Product Table */}
      <Card className="overflow-hidden bg-[#1C2127] p-0">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-800 bg-[#181C22] px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          <div>Product Name</div>
          <div>Status</div>
          <div>Users</div>
          <div>MRR</div>
          <div>LTV</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-slate-800">
          {products.map((product) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded font-bold text-white text-xs shadow-lg",
                    product.icon
                  )}
                >
                  {product.initial}
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-[#137FEC] transition-colors">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.version}</p>
                </div>
              </div>
              <div>
                <span
                  className={cn(
                    "flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    product.status === "Live"
                      ? "bg-green-500/10 text-green-500"
                      : product.status === "Beta"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-orange-500/10 text-orange-500"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full animate-pulse",
                      product.status === "Live"
                        ? "bg-green-500"
                        : product.status === "Beta"
                        ? "bg-blue-500"
                        : "bg-orange-500"
                    )}
                  />
                  {product.status}
                </span>
              </div>
              <div className="text-sm text-slate-400">{product.users}</div>
              <div className="text-sm font-medium text-white">{product.mrr}</div>
              <div className="text-sm text-slate-400">{product.ltv}</div>
              <div className="text-right">
                <button className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-white transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Chart */}
        <Card className="bg-[#1C2127] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Consolidated Revenue & Cost
              </h3>
              <p className="text-sm text-slate-400">
                Net profit across entire product matrix
              </p>
            </div>
            <div className="flex gap-2 rounded-lg bg-slate-800/50 p-1">
              {(["12M", "30D", "7D"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded px-3 py-1 text-xs font-medium transition-all",
                    period === p
                      ? "bg-[#1C2127] text-white shadow-sm"
                      : "text-slate-500 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137FEC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#137FEC" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#283039" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1C2127",
                    border: "1px solid #283039",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#137FEC"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#137FEC]" />
              <span className="text-sm text-slate-400">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#10b981]" />
              <span className="text-sm text-slate-400">Operational Cost</span>
            </div>
          </div>
        </Card>

        {/* Infrastructure Health & Deployments */}
        <div className="space-y-6">
          <Card className="bg-[#1C2127] p-6">
            <h3 className="mb-6 text-lg font-bold text-white">
              Infrastructure Health
            </h3>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-400">CPU Usage (Matrix Core)</span>
                  <span className="text-white">42%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "42%" }}
                    transition={{ duration: 1 }}
                    className="h-full bg-[#137FEC]" 
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-400">Database Memory</span>
                  <span className="text-white">68%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full bg-yellow-500" 
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-slate-400">API Latency</span>
                  <span className="text-green-500">24ms</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "15%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-green-500" 
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1C2127] to-[#181C22] p-6">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500">
              Deployments
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-500/10 text-purple-500">
                  <GitCommit className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Deploy Webhook</p>
                  <p className="text-xs text-slate-500">Last updated 2h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3 hover:bg-slate-800 transition-colors cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/10 text-blue-500">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Backup DB</p>
                  <p className="text-xs text-slate-500">Scheduled daily 00:00</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
