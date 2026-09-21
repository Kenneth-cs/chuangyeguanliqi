import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  AlertTriangle,
  Clock,
  CheckSquare,
  XCircle,
  Rocket,
  Trash2,
  BrainCircuit,
  Save,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const essentials = [
  {
    name: "核心倒计时功能",
    desc: "Core countdown functionality with persistence.",
    icon: CheckSquare,
  },
  {
    name: "Stripe 支付集成",
    desc: "Basic checkout flow for premium features.",
    icon: CheckSquare,
  },
  {
    name: "用户认证系统",
    desc: "Email/Password login via Supabase.",
    icon: CheckSquare,
  },
];

const cuts = [
  {
    name: "社交分享生成器",
    desc: "Generate fancy images for social media.",
    icon: XCircle,
  },
  {
    name: "黑暗模式自动切换",
    desc: "Based on system preferences (V2 feature).",
    icon: XCircle,
  },
  {
    name: "高级数据分析仪表盘",
    desc: "Use Google Analytics for MVP instead.",
    icon: XCircle,
  },
];

export default function ProjectManagement() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [projectStatus, setProjectStatus] = useState<"active" | "launched" | "abandoned">("active");

  useEffect(() => {
    // Set deadline to 7 days from now for demo purposes
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLaunch = () => {
    setProjectStatus("launched");
    toast.success("项目已发布！", {
      description: "恭喜你完成了 MVP，开始验证市场吧！",
      icon: <Rocket className="h-4 w-4 text-green-500" />,
    });
  };

  const handleAbandon = () => {
    setProjectStatus("abandoned");
    toast.error("项目已放弃", {
      description: "有时候放弃也是一种智慧，专注于更有潜力的想法。",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
    });
  };

  return (
    <div className="space-y-8">
      {/* Warning Banner */}
      <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
          <AlertTriangle className="h-5 w-5" />
          Red Light Warning: Deadline Imminent
        </div>
        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
      </div>

      {/* Countdown Section */}
      <div className="text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          距离发布截止日期
        </p>
        <div className="flex justify-center gap-4">
          {[
            { value: timeLeft.days, label: "Days", color: "text-white" },
            { value: timeLeft.hours, label: "Hours", color: "text-red-500" },
            { value: timeLeft.minutes, label: "Minutes", color: "text-red-500" },
            { value: timeLeft.seconds, label: "Seconds", color: "text-red-500" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex h-48 w-32 items-center justify-center rounded-xl border-b-4 border-slate-800 bg-[#1A2027] shadow-lg">
                <span className={cn("text-7xl font-black", item.color)}>
                  {String(item.value).padStart(2, "0")}
                </span>
              </div>
              <span className="mt-4 text-sm font-medium uppercase tracking-widest text-slate-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Contract */}
      <Card className="border-slate-800 bg-[#18212B] p-8">
        <div className="mb-8 flex items-start justify-between border-b border-slate-800 pb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              项目契约 (Project Contract)
            </h2>
            <p className="mt-1 text-slate-400">
              Strict adherence to MVP scope is required for launch.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              目标发布日期
            </p>
            <p className="text-xl font-bold text-white">2023年12月31日</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Essentials */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#137FEC]">
              <div className="h-3 w-3 bg-[#137FEC]" /> Essential (Must Have)
            </h3>
            <div className="space-y-3">
              {essentials.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-4 rounded-lg border border-[#137FEC]/10 bg-[#137FEC]/5 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#137FEC]">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cuts */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <div className="h-3 w-3 bg-slate-500" /> AI Suggested Cuts (Nice to
              have)
            </h3>
            <div className="space-y-3 opacity-60">
              {cuts.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-4 rounded-lg border border-transparent bg-[#1F2933] p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-700">
                    <item.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-400">{item.name}</p>
                    <p className="text-xs text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-500 italic">
              AI Reason: "These features do not validate the core value proposition."
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <button 
          onClick={handleLaunch}
          disabled={projectStatus !== "active"}
          className="flex flex-1 items-center justify-center gap-3 rounded-xl bg-red-500 py-4 text-xl font-extrabold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket className="h-6 w-6" />
          {projectStatus === "launched" ? "已发布" : "PUBLISH / GO LIVE"}
        </button>
        <button 
          onClick={handleAbandon}
          disabled={projectStatus !== "active"}
          className="flex w-48 items-center justify-center gap-2 rounded-xl border-2 border-slate-700 py-4 text-lg font-bold text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-5 w-5" />
          {projectStatus === "abandoned" ? "已放弃" : "Abandon"}
        </button>
      </div>

      {/* Daily Soul Searching */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A1B4E] to-[#1E1B2E] p-8 shadow-lg border border-purple-500/20">
        <div className="absolute -top-10 right-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <BrainCircuit className="h-6 w-6 text-purple-500" />
            <h2 className="text-xl font-bold text-white">每日灵魂拷问</h2>
          </div>
          
          <div className="ml-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              Focus & Clarity
            </p>
            <p className="mb-8 text-xl font-medium text-white">
              "如果这是你作为独立开发者的最后一周，你会砍掉当前项目里的哪些功能？"
            </p>
            
            <div className="relative">
              <textarea
                placeholder="写下你的思考..."
                className="h-24 w-full rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
              <button className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 transition-colors">
                <Save className="h-4 w-4" />
                保存思考
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
