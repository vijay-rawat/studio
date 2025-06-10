
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users, Minus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SessionEndGraphDisplayProps {
  players: Player[];
}

interface ChartDataPoint {
  time: number; // Unix timestamp
  formattedTime: string;
  [playerName: string]: number | string; // Balances for each player, or formattedTime string
}


const CHART_COLORS_HSL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  // Add more if needed, or cycle through them
  "hsl(var(--primary))", 
  "hsl(var(--accent))",
];


export function SessionEndGraphDisplay({ players }: SessionEndGraphDisplayProps) {

  const processedChartData = useMemo(() => {
    if (!players.length) return [];

    const allTimestamps = new Set<number>();
    
    // Use a conceptual "time zero" based on the earliest actual activity or a default.
    // This helps in establishing initial balances before any recorded transactions.
    let earliestActivityTime = Date.now();
    if (players.some(p => p.transactions.length > 0)) {
        earliestActivityTime = Math.min(
            ...players.flatMap(p => 
                p.transactions.map(tx => new Date(tx.timestamp).getTime())
            )
        );
    }
    // Add initial state slightly before the first transaction or a common start point
    allTimestamps.add(earliestActivityTime - 60000); // 1 minute before first tx as t0

    players.forEach(player => {
      player.transactions.forEach(tx => {
        allTimestamps.add(new Date(tx.timestamp).getTime());
      });
    });

    const sortedUniqueTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    const data: ChartDataPoint[] = sortedUniqueTimestamps.map(ts => {
      const dataPoint: ChartDataPoint = {
        time: ts,
        formattedTime: format(new Date(ts), 'HH:mm'),
      };

      players.forEach(player => {
        let currentBalance = player.initialBalance;
        player.transactions
          .filter(tx => new Date(tx.timestamp).getTime() <= ts)
          .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // ensure chronological application
          .forEach(tx => {
            currentBalance += tx.amount;
          });
        dataPoint[player.name] = currentBalance;
      });
      return dataPoint;
    });
    
    // If only initial state exists (no transactions), add a dummy point 1 hour later for line visibility
    if (data.length === 1) {
        const singlePoint = data[0];
        const nextTime = singlePoint.time + 3600000; // 1 hour later
        const nextDataPoint: ChartDataPoint = {
            time: nextTime,
            formattedTime: format(new Date(nextTime), 'HH:mm'),
        };
        players.forEach(player => {
            nextDataPoint[player.name] = singlePoint[player.name] as number;
        });
        data.push(nextDataPoint);
    }


    return data;
  }, [players]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    players.forEach((player, index) => {
      config[player.name] = {
        label: player.name,
        color: CHART_COLORS_HSL[index % CHART_COLORS_HSL.length],
      };
    });
    return config;
  }, [players]);

  const yDomain = useMemo(() => {
    if (!processedChartData.length) return [0, 0];
    let minY = 0;
    let maxY = 0;

    processedChartData.forEach(point => {
      players.forEach(player => {
        const balance = point[player.name] as number;
        if (balance < minY) minY = balance;
        if (balance > maxY) maxY = balance;
      });
    });
    
    const padding = Math.max(Math.abs(minY), Math.abs(maxY)) * 0.1 || 100; // Ensure some padding
    return [Math.floor(minY - padding), Math.ceil(maxY + padding)];
  }, [processedChartData, players]);


  if (!players.length) {
    return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <TrendingUp className="mr-3 h-7 w-7 text-primary" />
            Player Balance Over Time
          </CardTitle>
          <CardDescription>Line graph showing each player's bank balance throughout the session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center min-h-[300px] flex flex-col justify-center items-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No player data available to display graph.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (processedChartData.length === 0 || (processedChartData.length === 1 && players.every(p => p.transactions.length === 0)) ) {
     return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Minus className="mr-3 h-7 w-7 text-primary" />
            Player Balance Over Time
          </CardTitle>
          <CardDescription>Line graph showing each player's bank balance throughout the session.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center min-h-[300px] flex flex-col justify-center items-center">
          <AlertTriangle className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No transaction data available to plot trends.</p>
          <p className="text-sm text-muted-foreground/80">Graph will appear once players have transactions.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="w-full shadow-xl border-border/50 mt-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <TrendingUp className="mr-3 h-7 w-7 text-primary" />
          Player Balance Over Time
        </CardTitle>
        <CardDescription>Line graph showing each player's bank balance (initial + bank transactions) throughout the session.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
           <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedChartData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
              <XAxis
                dataKey="formattedTime"
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value} Rs.`}
                domain={yDomain}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground)/0.3)' }}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="rounded-lg border bg-background p-2.5 shadow-sm">
                            <p className="mb-1.5 text-sm font-medium text-center">{`Time: ${label}`}</p>
                            {payload.map((entry) => (
                            <div key={entry.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                    <span style={{ backgroundColor: entry.color }} className="w-2 h-2 rounded-full mr-1.5 shrink-0"></span>
                                    <span className="text-muted-foreground">{entry.name}:</span>
                                </div>
                                <span className={cn("font-semibold ml-2", (entry.value as number) >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                                    {(entry.value as number).toFixed(2)} Rs.
                                </span>
                            </div>
                            ))}
                        </div>
                        );
                    }
                    return null;
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={chartConfig[player.name]?.color || "#8884d8"}
                  strokeWidth={2}
                  dot={{ r: 2, fill: chartConfig[player.name]?.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
