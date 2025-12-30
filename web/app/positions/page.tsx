'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Position {
  _id: string;
  traderAddress: string;
  title: string;
  slug: string;
  icon: string;
  asset: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  redeemable: boolean;
}

interface PositionsData {
  positions: Position[];
  totalValue: string;
  totalPnl: string;
  totalPositions: number;
}

function PnlBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      ${Math.abs(value).toFixed(2)}
    </span>
  );
}

export default function PositionsPage() {
  const [data, setData] = useState<PositionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/positions');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching positions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPositions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const totalPnl = parseFloat(data?.totalPnl || '0');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">持仓</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="stat-label">总价值</p>
          <p className="stat-value mt-1">${data?.totalValue || '0.00'}</p>
        </div>
        <div className="card">
          <p className="stat-label">总盈亏</p>
          <p className={`stat-value mt-1 ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${data?.totalPnl || '0.00'}
          </p>
        </div>
        <div className="card">
          <p className="stat-label">持仓数量</p>
          <p className="stat-value mt-1">{data?.totalPositions || 0}</p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">所有持仓</h2>
        {data?.positions && data.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-[#2a2a2a]">
                  <th className="pb-3 px-4">市场</th>
                  <th className="pb-3 px-4">结果</th>
                  <th className="pb-3 px-4">数量</th>
                  <th className="pb-3 px-4">均价</th>
                  <th className="pb-3 px-4">现价</th>
                  <th className="pb-3 px-4">价值</th>
                  <th className="pb-3 px-4">盈亏</th>
                  <th className="pb-3 px-4">状态</th>
                </tr>
              </thead>
              <tbody>
                {data.positions.map((position) => (
                  <tr key={position._id} className="table-row">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {position.icon && (
                          <img src={position.icon} alt="" className="w-6 h-6 rounded" />
                        )}
                        <span className="truncate max-w-[200px]">{position.title || position.slug || '未知'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${position.asset === 'YES' || position.outcome === 'Yes' ? 'badge-success' : 'badge-danger'}`}>
                        {position.outcome || position.asset || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{(position.size || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">{((position.avgPrice || 0) * 100).toFixed(1)}c</td>
                    <td className="py-3 px-4">{((position.curPrice || 0) * 100).toFixed(1)}c</td>
                    <td className="py-3 px-4">${(position.currentValue || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <PnlBadge value={position.cashPnl || 0} />
                    </td>
                    <td className="py-3 px-4">
                      {position.redeemable ? (
                        <span className="badge badge-warning">可赎回</span>
                      ) : (
                        <span className="badge badge-info">活跃</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">暂无持仓</p>
        )}
      </div>
    </div>
  );
}
