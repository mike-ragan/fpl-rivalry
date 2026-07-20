"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MANAGER_COLOR } from "@/lib/constants";
import type { Managers } from "@/lib/fpl-types";

interface SeasonChartProps {
  data: { event: number; mike: number; jack: number }[];
  managers: Managers;
}

export function SeasonChart({ data, managers }: SeasonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(184, 184, 184, 0.14)" />
        <XAxis
          dataKey="event"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#6B6B6B" }}
          label={{
            value: "Gameweek",
            position: "insideBottom",
            offset: -4,
            fontSize: 12,
            fill: "#6B6B6B",
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "#6B6B6B" }}
          width={40}
        />
        <Tooltip
          labelFormatter={(event) => `Gameweek ${event}`}
          contentStyle={{
            fontSize: 12,
            borderRadius: 0,
            background: "#141414",
            border: "1px solid #D4907A",
            color: "#B8B8B8",
          }}
          labelStyle={{ color: "#D4907A" }}
        />
        <Line
          type="monotone"
          dataKey="mike"
          name={managers.mike.name}
          stroke={MANAGER_COLOR.mike}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="jack"
          name={managers.jack.name}
          stroke={MANAGER_COLOR.jack}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
