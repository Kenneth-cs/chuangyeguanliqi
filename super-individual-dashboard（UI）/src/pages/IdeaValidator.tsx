import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  Search,
  Github,
  Trophy,
  Flame,
  Users,
  Target,
  Zap,
  AlertTriangle,
  ArrowRight,
  History,
  Rocket,
  Trash2,
  Lock,
  Lightbulb,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const gaugeData = [
  { name: "Score", value: 25 },
  { name: "Remaining", value: 75 },
];
const gaugeColors = ["#EF4444", "#1e293b"];

export default function IdeaValidator() {
  const [idea, setIdea] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const handleValidate = () => {
    if (!idea.trim()) {
      toast.error("请输入您的产品想法");
      return;
    }

    setIsValidating(true);
    setShowResults(false);
    
    // Simulate validation process
    setTimeout(() => {
      setIsValidating(false);
      setShowResults(true);
      toast.success("验证完成", {
        description: "AI 已生成市场分析报告",
      });
    }, 2000);
  };

  const handleShred = () => {
    toast.success("想法已粉碎", {
      description: "不要气馁，下一个想法会更好！",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
    });
    setIdea("");
    setShowResults(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            创意碎纸机 <span className="text-2xl text-[#137FEC]">Idea Validator</span>
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl">
            在投入开发之前，先用 AI 市场调研和毒舌 VC 评分快速“粉碎”不靠谱的想法。只有存活下来的才值得做 MVP。
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
          <History className="h-4 w-4" />
          历史记录
        </button>
      </div>

      {/* Input Section */}
      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
        </div>
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          placeholder="用一句话描述你的产品想法... 例如：一个为独行开发者设计的AI辅助创意验证工具"
          className="flex-1 bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none"
          disabled={isValidating}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Enter 提交</span>
          <button 
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center gap-2 rounded-lg bg-[#137FEC] px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}
            {isValidating ? "验证中..." : "开始验证"}
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {showResults && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 lg:grid-cols-[2fr_1fr]"
          >
            {/* Left Column: Analysis */}
            <div className="space-y-6">
              {/* Market Research */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-white">
                  <Search className="h-5 w-5 text-[#137FEC]" />
                  AI 市场调研分析
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="relative overflow-hidden p-4 group hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400">GitHub 趋势</p>
                        <p className="mt-1 text-2xl font-bold text-white">Rising Star</p>
                      </div>
                      <Github className="h-8 w-8 text-slate-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
                      <TrendingUp className="h-4 w-4" />
                      +15% 关注度
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "15%" }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden p-4 group hover:border-[#137FEC]/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Product Hunt 排名</p>
                        <p className="mt-1 text-2xl font-bold text-white">Top 10</p>
                      </div>
                      <Trophy className="h-8 w-8 text-slate-700 group-hover:text-[#137FEC] transition-colors" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-1 w-4 bg-slate-600" />
                      暂无竞品
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "80%" }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-[#137FEC]" 
                      />
                    </div>
                  </Card>

                  <Card className="relative overflow-hidden p-4 group hover:border-red-500/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400">社交媒体热度</p>
                        <p className="mt-1 text-2xl font-bold text-red-500">High</p>
                      </div>
                      <Flame className="h-8 w-8 text-slate-700 group-hover:text-red-500 transition-colors" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
                      <TrendingUp className="h-4 w-4" />
                      +45% 讨论量
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "45%" }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-red-500" 
                      />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Business Canvas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-bold text-white">
                    <Target className="h-5 w-5 text-[#137FEC]" />
                    精益画布 (Business Canvas)
                  </div>
                  <span className="text-xs text-slate-500 animate-pulse">AI 自动填充中...</span>
                </div>
                <Card className="space-y-6 p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                        <Users className="h-4 w-4 text-[#137FEC]" />
                        目标用户 (Target Audience)
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-400">
                        例如：全职独立开发者，寻找副业的程序员...
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        用户痛点 (Pain Points)
                      </div>
                      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-sm text-slate-400">
                        例如：很多想法没有经过验证就开发，浪费时间...
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Zap className="h-4 w-4 text-[#137FEC]" />
                      MVP 核心功能 (Features)
                    </div>
                    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <span className="flex items-center gap-1 rounded-full border border-[#137FEC]/30 bg-[#137FEC]/10 px-3 py-1 text-xs font-bold text-[#137FEC]">
                        AI 市场分析 <Zap className="h-3 w-3" />
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-[#137FEC]/30 bg-[#137FEC]/10 px-3 py-1 text-xs font-bold text-[#137FEC]">
                        Landing Page 生成 <Zap className="h-3 w-3" />
                      </span>
                      <button className="flex items-center gap-1 px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors">
                        + 添加功能
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column: VC Score */}
            <Card className="flex flex-col items-center justify-between bg-slate-900 p-6 shadow-xl border-slate-800">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-bold text-white">毒舌 VC 评分</h3>
                </div>
                <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500">
                  COLD SCORE
                </span>
              </div>

              <div className="relative flex h-48 w-full items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="70%"
                      startAngle={180}
                      endAngle={0}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={gaugeColors[index]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-10 flex flex-col items-center">
                  <span className="text-4xl font-bold text-white">25</span>
                  <span className="text-xs text-slate-500">SCORE / 100</span>
                </div>
              </div>

              <div className="relative w-full rounded-xl bg-slate-800 p-4">
                <div className="absolute -top-3 left-4 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  AI CRITIC
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  "听起来很美好，但这是典型的‘伪需求’。市面上已经有无数个类似的工具了，你的差异化在哪里？GitHub Copilot 已经能做大部分事情，为什么用户要专门为你这个功能付费？建议直接粉碎，不要浪费生命。"
                </p>
                <button 
                  onClick={handleShred}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-3 font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors active:scale-[0.98]"
                >
                  <Trash2 className="h-5 w-5" />
                  SHRED IT (粉碎想法)
                </button>
              </div>

              <div className="mt-6 flex w-full items-center justify-between rounded-lg border border-slate-700 p-4">
                <span className="text-slate-400">Proceed to MVP</span>
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                只有评分超过 70 分才能解锁 MVP 阶段
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
