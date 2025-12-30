'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Users, Wallet, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalTraders: number;
  totalTrades: number;
  botExecutedTrades: number;
  totalPnl: string;
  recentActivities: any[];
}

function StatCard({ title, value, icon: Icon, trend, trendValue }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">{value}</p>
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <Icon size={24} className="text-blue-400" />
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: any }) {
  const time = activity.timestamp ? format(new Date(activity.timestamp * 1000), 'HH:mm:ss') : '--';
  const isBuy = activity.side === 'BUY';
  const isBot = activity.bot === true;

  return (
    <tr className="table-row">
      <td className="py-3 px-4 text-gray-400 text-sm">{time}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {activity.icon && (
            <img src={activity.icon} alt="" className="w-6 h-6 rounded" />
          )}
          <span className="truncate max-w-[200px]">{activity.title || activity.slug || '未知市场'}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`badge ${isBuy ? 'badge-success' : 'badge-danger'}`}>
          {activity.side === 'BUY' ? '买入' : activity.side === 'SELL' ? '卖出' : 'N/A'}
        </span>
      </td>
      <td className="py-3 px-4">{activity.outcome || activity.asset || 'N/A'}</td>
      <td className="py-3 px-4">${(activity.usdcSize || 0).toFixed(2)}</td>
      <td className="py-3 px-4">{(activity.price || 0).toFixed(2)}</td>
      <td className="py-3 px-4">
        <span className={`badge ${isBot ? 'badge-info' : 'badge-warning'}`}>
          {isBot ? '机器人' : '交易员'}
        </span>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('无法连接到数据库');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <p className="text-gray-500">请确保 MongoDB 正在运行且机器人已启动。</p>
      </div>
    );
  }

  const pnl = parseFloat(stats?.totalPnl || '0');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={14} />
          <span>每5秒自动刷新</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="总盈亏"
          value={`$${stats?.totalPnl || '0.00'}`}
          icon={Wallet}
          trend={pnl >= 0 ? 'up' : 'down'}
          trendValue={pnl >= 0 ? '盈利' : '亏损'}
        />
        <StatCard
          title="跟踪交易员"
          value={stats?.totalTraders || 0}
          icon={Users}
        />
        <StatCard
          title="总交易数"
          value={stats?.totalTrades || 0}
          icon={Activity}
        />
        <StatCard
          title="机器人执行"
          value={stats?.botExecutedTrades || 0}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">最近交易记录 (24小时)</h2>
        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-[#2a2a2a]">
                  <th className="pb-3 px-4">时间</th>
                  <th className="pb-3 px-4">市场</th>
                  <th className="pb-3 px-4">方向</th>
                  <th className="pb-3 px-4">结果</th>
                  <th className="pb-3 px-4">金额</th>
                  <th className="pb-3 px-4">价格</th>
                  <th className="pb-3 px-4">来源</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivities.map((activity, idx) => (
                  <ActivityRow key={idx} activity={activity} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">最近24小时内没有交易记录</p>
        )}
      </div>
    </div>
  );
}
