import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Wallet, Users, History } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Polymarket 跟单机器人',
  description: '监控您的跟单机器人运行状态',
  icons: {
    icon: '/logo.png',
  },
};

function NavLink({ href, children, icon: Icon }: { href: string; children: React.ReactNode; icon: any }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
      <Icon size={18} />
      {children}
    </Link>
  );
}

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-[#0f0f0f] border-r border-[#2a2a2a] p-4 fixed">
            <div className="mb-8 flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-blue-400">Polymarket</h1>
                <p className="text-sm text-gray-500">跟单机器人</p>
              </div>
            </div>
            <nav className="space-y-2">
              <NavLink href="/" icon={LayoutDashboard}>仪表盘</NavLink>
              <NavLink href="/positions" icon={Wallet}>持仓</NavLink>
              <NavLink href="/activities" icon={History}>交易记录</NavLink>
              <NavLink href="/traders" icon={Users}>跟踪交易员</NavLink>
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="card text-center mb-3">
                <div className="text-xs text-gray-500">机器人状态</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-green-400 text-sm">运行中</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://t.me/dsa885"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="Telegram"
                >
                  <TelegramIcon size={20} />
                </a>
                <a
                  href="https://x.com/hunterweb303"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  title="X (Twitter)"
                >
                  <XIcon size={20} />
                </a>
              </div>
              <div className="mt-3 text-center text-xs text-gray-500">
                <p>基于作者 <a href="https://github.com/vladmeer/polymarket-copy-trading-bot" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">vladmeer</a> 发布的开源项目制作</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
