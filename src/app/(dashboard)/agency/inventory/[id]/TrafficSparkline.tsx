"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface TrafficSparklineProps {
  data: Array<{ date: string; value: number }>;
}

export function TrafficSparkline({ data }: TrafficSparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-slate-400">
        Veri yok
      </div>
    );
  }

  // Son 6 ayı göster (eğer daha fazla varsa)
  const displayData = data.slice(-6).map((item) => ({
    date: item.date.split("-")[1] + "/" + item.date.split("-")[0].slice(-2), // MM/YY formatı
    value: item.value,
  }));

  // Trend hesapla (artış/azalış)
  const firstValue = displayData[0]?.value || 0;
  const lastValue = displayData[displayData.length - 1]?.value || 0;
  const trend = lastValue > firstValue ? "up" : lastValue < firstValue ? "down" : "stable";
  const trendPercent = firstValue > 0 
    ? Math.abs(((lastValue - firstValue) / firstValue) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">Son 6 Ay Trendi</span>
        <span className={`font-semibold ${
          trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-slate-600"
        }`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendPercent}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={displayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorTraffic)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

