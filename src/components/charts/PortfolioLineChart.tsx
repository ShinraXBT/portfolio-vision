import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ChartData {
  date: string;
  value: number;
}

interface PortfolioLineChartProps {
  data: ChartData[];
  height?: number;
  showAxis?: boolean;
  gradient?: boolean;
}

export function PortfolioLineChart({
  data,
  height = 300,
  showAxis = true,
  gradient = true
}: PortfolioLineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-white/30"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const color = isPositive ? '#22c55e' : '#ef4444';

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="glass p-3 rounded-lg">
          <p className="text-sm text-white/70">{formatDate(item.date)}</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (gradient) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => formatDate(date, 'short')}
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
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showAxis && (
          <>
            <XAxis
              dataKey="date"
              tickFormatter={(date) => formatDate(date, 'short')}
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
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Mini sparkline chart
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ data, width = 100, height = 30, color }: SparklineProps) {
  if (data.length < 2) return null;

  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color ?? (isPositive ? '#22c55e' : '#ef4444');

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
