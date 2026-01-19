import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { WalletAllocation } from '../../types';

interface AllocationPieChartProps {
  data: WalletAllocation[];
  height?: number;
  showLegend?: boolean;
}

export function AllocationPieChart({
  data,
  height = 250,
  showLegend = true
}: AllocationPieChartProps) {
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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: WalletAllocation }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="glass p-3 rounded-lg">
          <p className="text-sm font-medium text-white">{item.walletName}</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(item.value)}
          </p>
          <p className="text-sm text-white/50">
            {formatPercent(item.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Map data to a format compatible with Recharts
  const chartData = data.map(d => ({
    name: d.walletName,
    value: d.value,
    color: d.color,
    percentage: d.percentage,
    walletId: d.walletId,
    walletName: d.walletName
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height={showLegend ? '60%' : '100%'}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-white/70">
                {item.walletName}
              </span>
              <span className="text-xs text-white/50">
                {formatPercent(item.percentage, { showSign: false, decimals: 1 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple donut chart with center text
interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  centerText?: string;
  centerSubtext?: string;
  size?: number;
}

export function DonutChart({
  data,
  centerText,
  centerSubtext,
  size = 150
}: DonutChartProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {(centerText || centerSubtext) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerText && (
            <span className="text-lg font-bold text-white">{centerText}</span>
          )}
          {centerSubtext && (
            <span className="text-xs text-white/50">{centerSubtext}</span>
          )}
        </div>
      )}
    </div>
  );
}
