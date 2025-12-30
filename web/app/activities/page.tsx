'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Filter } from 'lucide-react';

interface Activity {
  _id: string;
  traderAddress: string;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  side: string;
  asset: string;
  outcome: string;
  size: number;
  usdcSize: number;
  price: number;
  bot: boolean;
  transactionHash: string;
}

interface ActivitiesData {
  activities: Activity[];
  total: number;
  limit: number;
  offset: number;
}

export default function ActivitiesPage() {
  const [data, setData] = useState<ActivitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bot' | 'trader'>('all');
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/activities?limit=${limit}&offset=${page * limit}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchActivities();
  }, [page]);

  const filteredActivities = data?.activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'bot') return a.bot === true;
    if (filter === 'trader') return a.bot !== true;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const filterLabels: Record<string, string> = {
    all: '全部',
    bot: '机器人',
    trader: '交易员'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">交易记录</h1>
        <div className="flex items-center gap-4">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg p-1">
            {(['all', 'bot', 'trader'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === f ? 'bg-blue-600 text-white' : 'hover:bg-[#2a2a2a]'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <button
            onClick={fetchActivities}
            className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="stat-label">总交易数</p>
          <p className="stat-value mt-1">{data?.total || 0}</p>
        </div>
        <div className="card">
          <p className="stat-label">机器人交易</p>
          <p className="stat-value mt-1">{data?.activities.filter(a => a.bot).length || 0}</p>
        </div>
        <div className="card">
          <p className="stat-label">交易员交易</p>
          <p className="stat-value mt-1">{data?.activities.filter(a => !a.bot).length || 0}</p>
        </div>
      </div>

      {/* Activities Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">交易日志</h2>
          <span className="text-gray-400 text-sm">
            显示 {filteredActivities.length} / {data?.total || 0}
          </span>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-[#2a2a2a]">
                  <th className="pb-3 px-4">时间</th>
                  <th className="pb-3 px-4">市场</th>
                  <th className="pb-3 px-4">方向</th>
                  <th className="pb-3 px-4">结果</th>
                  <th className="pb-3 px-4">数量</th>
                  <th className="pb-3 px-4">USDC</th>
                  <th className="pb-3 px-4">价格</th>
                  <th className="pb-3 px-4">来源</th>
                  <th className="pb-3 px-4">交易</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((activity) => (
                  <tr key={activity._id} className="table-row">
                    <td className="py-3 px-4 text-gray-400 text-sm whitespace-nowrap">
                      {activity.timestamp
                        ? format(new Date(activity.timestamp * 1000), 'MM/dd HH:mm:ss')
                        : '--'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {activity.icon && (
                          <img src={activity.icon} alt="" className="w-6 h-6 rounded" />
                        )}
                        <span className="truncate max-w-[180px]">{activity.title || activity.slug || '未知'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${activity.side === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                        {activity.side === 'BUY' ? '买入' : activity.side === 'SELL' ? '卖出' : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{activity.outcome || activity.asset || 'N/A'}</td>
                    <td className="py-3 px-4">{(activity.size || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">${(activity.usdcSize || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">{((activity.price || 0) * 100).toFixed(1)}c</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${activity.bot ? 'badge-info' : 'badge-warning'}`}>
                        {activity.bot ? '机器人' : '交易员'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {activity.transactionHash ? (
                        <a
                          href={`https://polygonscan.com/tx/${activity.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          查看
                        </a>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">暂无交易记录</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-[#2a2a2a] rounded-lg disabled:opacity-50 hover:bg-[#3a3a3a] transition-colors"
            >
              上一页
            </button>
            <span className="px-4 text-gray-400">
              第 {page + 1} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-[#2a2a2a] rounded-lg disabled:opacity-50 hover:bg-[#3a3a3a] transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
