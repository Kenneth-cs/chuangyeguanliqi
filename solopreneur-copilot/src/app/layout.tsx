import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "超级个体创业OS",
  description: "Solopreneur Copilot - 你的创业副驾驶",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <SessionProvider>
          <AppShell>{children}</AppShell>
          <Toaster theme="dark" position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
