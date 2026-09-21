import React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-[#1C2630] p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
