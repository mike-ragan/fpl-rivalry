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
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="event"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          label={{ value: "Gameweek", position: "insideBottom", offset: -4, fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={40} />
        <Tooltip
          labelFormatter={(event) => `Gameweek ${event}`}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
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
