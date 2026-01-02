"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrafficData {
  month: string;
  traffic: number;
  organic: number;
}

interface VettingDetailClientProps {
  trafficData: TrafficData[];
}

export function VettingDetailClient({ trafficData }: VettingDetailClientProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={trafficData}>
        <defs>
          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="month"
          stroke="#64748b"
          style={{ fontSize: "12px" }}
        />
        <YAxis
          stroke="#64748b"
          style={{ fontSize: "12px" }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "1rem",
            padding: "8px 12px",
          }}
          formatter={(value: number) => value.toLocaleString("tr-TR")}
        />
        <Area
          type="monotone"
          dataKey="traffic"
          stroke="#4f46e5"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTraffic)"
          name="Toplam Trafik"
        />
        <Area
          type="monotone"
          dataKey="organic"
          stroke="#818cf8"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorOrganic)"
          name="Organik Trafik"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

