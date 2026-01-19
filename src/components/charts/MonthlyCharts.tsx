import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { formatCurrency, getMonthName } from '../../utils/formatters';

interface MonthlyData {
  month: string;
  monthName: string;
  value: number;
  delta: number;
  deltaPercent: number;
}

interface MonthlyAreaChartProps {
  data: MonthlyData[];
  height?: number;
}

export function MonthlyAreaChart({ data, height = 250 }: MonthlyAreaChartProps) {
  const filteredData = data.filter(d => d.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center text-white/30" style={{ height }}>
        No data available
      </div>
    );
  }

  const isPositive = filteredData.length > 1 &&
    filteredData[filteredData.length - 1].value >= filteredData[0].value;
  const color = isPositive ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthlyData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="glass p-3 rounded-lg">
          <p className="text-sm text-white/70">{item.monthName}</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="monthName"
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, 'USD', { compact: true })}
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#monthlyGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
  height?: number;
}

export function MonthlyBarChart({ data, height = 250 }: MonthlyBarChartProps) {
  // Include all months even with no data for consistent display
  const chartData = data.map(d => ({
    ...d,
    delta: d.value > 0 ? d.delta : 0
  }));

  const hasAnyData = chartData.some(d => d.delta !== 0);

  if (!hasAnyData) {
    return (
      <div className="flex items-center justify-center text-white/30" style={{ height }}>
        No data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthlyData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      if (item.delta === 0 && item.value === 0) return null;

      return (
        <div className="glass p-3 rounded-lg">
          <p className="text-sm text-white/70">{item.monthName}</p>
          <p className={`text-lg font-semibold ${item.delta >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatCurrency(item.delta)}
          </p>
          <p className={`text-sm ${item.deltaPercent >= 0 ? 'text-positive' : 'text-negative'}`}>
            {item.deltaPercent >= 0 ? '+' : ''}{item.deltaPercent.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="monthName"
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, 'USD', { compact: true })}
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="delta" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.delta >= 0 ? '#22c55e' : '#ef4444'}
              fillOpacity={entry.delta === 0 ? 0.1 : 0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CryptoPriceChartProps {
  data: { month: string; monthName: string; btcPrice: number; ethPrice: number }[];
  height?: number;
}

export function CryptoPriceChart({ data, height = 200 }: CryptoPriceChartProps) {
  const filteredData = data.filter(d => d.btcPrice > 0 || d.ethPrice > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center text-white/30" style={{ height }}>
        No price data
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; payload: { monthName: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg">
          <p className="text-sm text-white/70 mb-1">{payload[0].payload.monthName}</p>
          {payload.map((item) => (
            <p key={item.dataKey} className="text-sm">
              <span className={item.dataKey === 'btcPrice' ? 'text-orange-400' : 'text-blue-400'}>
                {item.dataKey === 'btcPrice' ? 'BTC' : 'ETH'}:
              </span>{' '}
              <span className="text-white font-medium">
                {formatCurrency(item.value, 'USD', { compact: true })}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ethGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="monthName"
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          stroke="rgba(255,255,255,0.2)"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="btcPrice"
          stroke="#f97316"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#btcGradient)"
        />
        <Area
          type="monotone"
          dataKey="ethPrice"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#ethGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
