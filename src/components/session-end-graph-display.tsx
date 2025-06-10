
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface SessionEndGraphDisplayProps {
  players: Player[];
}

interface ChartData {
  name: string;
  finalNetResult: number;
}

export function SessionEndGraphDisplay({ players }: SessionEndGraphDisplayProps) {

  const chartData = useMemo(() => {
    return players
      .map(p => {
        const liveBalance = p.initialBalance + p.transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const finalNetResult = (p.cashedOutAmount ?? 0) + liveBalance;
        return { name: p.name, finalNetResult };
      })
      .sort((a, b) => b.finalNetResult - a.finalNetResult); // Optional: sort by result
  }, [players]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    chartData.forEach(player => {
      config[player.name] = {
        label: player.name,
        color: player.finalNetResult >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))",
      };
    });
    return config;
  }, [chartData]);


  if (chartData.length === 0) {
    return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <TrendingUp className="mr-3 h-7 w-7 text-primary" />
            Player Final Results
          </CardTitle>
          <CardDescription>Visual summary of player net results for the session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No player data available to display graph.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Determine a dynamic domain for Y-axis to ensure visibility
  const yValues = chartData.map(d => d.finalNetResult);
  const minY = Math.min(0, ...yValues) - Math.abs(Math.min(...yValues) * 0.1); // Add some padding
  const maxY = Math.max(0, ...yValues) + Math.abs(Math.max(...yValues) * 0.1); // Add some padding


  return (
    <Card className="w-full shadow-xl border-border/50 mt-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <TrendingUp className="mr-3 h-7 w-7 text-primary" />
          Player Final Net Results
        </CardTitle>
        <CardDescription>Bar chart showing each player's profit or loss for the session.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
           <ResponsiveContainer width="100%" height={300 + chartData.length * 10}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 + chartData.length * 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.5)" />
              <XAxis 
                type="number" 
                stroke="hsl(var(--muted-foreground))" 
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `${value} Rs.`}
                domain={[minY, maxY]}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="hsl(var(--muted-foreground))"
                width={80}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={<ChartTooltipContent
                    formatter={(value, name, item) => (
                        <div className="flex flex-col">
                            <span className="font-semibold">{item.payload.name}</span>
                            <span style={{ color: item.payload.finalNetResult >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                                {item.payload.finalNetResult >=0 ? '+' : ''}{item.payload.finalNetResult.toFixed(2)} Rs.
                            </span>
                        </div>
                    )}
                    hideLabel
                />}
                
              />
              <Bar dataKey="finalNetResult" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.finalNetResult >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

