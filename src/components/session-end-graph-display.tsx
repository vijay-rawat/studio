
"use client";

import React from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, TooltipProps } from 'recharts';
import { TrendingUp, Users, Minus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';


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
  "hsl(var(--primary))",
  "hsl(var(--accent))",
];


export function SessionEndGraphDisplay({ players }: SessionEndGraphDisplayProps) {

  const processedChartData = React.useMemo(() => {
    if (!players.length) return [];

    const allTimestamps = new Set<number>();

    let earliestActivityTime = Date.now();
    const hasTransactions = players.some(p => p.transactions.length > 0);

    if (hasTransactions) {
        const transactionTimestamps = players.flatMap(p =>
            p.transactions.map(tx => new Date(tx.timestamp).getTime())
        ).filter(ts => !isNaN(ts));

        if (transactionTimestamps.length > 0) {
            earliestActivityTime = Math.min(...transactionTimestamps);
        }
    }

    // Add a point slightly before the first activity to show initial balances
    allTimestamps.add(earliestActivityTime - 60000); // 1 minute before

    players.forEach(player => {
      player.transactions.forEach(tx => {
        const t = new Date(tx.timestamp).getTime();
        if (!isNaN(t)) allTimestamps.add(t);
      });
      // Ensure cash-out times are included if they exist and are different
      if (player.cashOutTimestamp) {
        const cot = new Date(player.cashOutTimestamp).getTime();
        if (!isNaN(cot)) allTimestamps.add(cot);
      }
    });

    const sortedUniqueTimestamps = Array.from(allTimestamps).filter(ts => !isNaN(ts)).sort((a, b) => a - b);

    let data: ChartDataPoint[] = sortedUniqueTimestamps.map(ts => {
      const dataPoint: ChartDataPoint = {
        time: ts,
        formattedTime: format(new Date(ts), 'HH:mm'),
      };

      players.forEach(player => {
        let currentBalance = player.initialBalance;
        player.transactions
          .filter(tx => new Date(tx.timestamp).getTime() <= ts)
          .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .forEach(tx => {
            currentBalance += tx.amount;
          });
        dataPoint[player.name] = currentBalance;
      });
      return dataPoint;
    });

    // If only one timestamp (e.g. only initial balances), create a second point for a flat line
     if (data.length === 1 && players.length > 0) {
        const singlePoint = data[0];
        const nextTime = singlePoint.time + 3600000; // Arbitrary 1 hour later
        const nextDataPoint: ChartDataPoint = {
            time: nextTime,
            formattedTime: format(new Date(nextTime), 'HH:mm'),
        };
        players.forEach(player => {
            // Balances remain the same as the single point
            nextDataPoint[player.name] = singlePoint[player.name] as number;
        });
        data.push(nextDataPoint);
    } else if (data.length === 0 && players.length > 0) {
        // Handle case where there are players but no transactions at all (only initial balances)
        // Create two points to draw flat lines for initial balances
        const now = Date.now();
        const initialPoint: ChartDataPoint = {
            time: now - 3600000, // 1 hour ago
            formattedTime: format(new Date(now-3600000), 'HH:mm'),
        };
        players.forEach(p => initialPoint[p.name] = p.initialBalance);

        const currentPoint: ChartDataPoint = {
            time: now,
            formattedTime: format(new Date(now), 'HH:mm'),
        };
        // Balances are still initial balances as there are no transactions
        players.forEach(p => currentPoint[p.name] = p.initialBalance);
        data = [initialPoint, currentPoint];
    }


    return data;
  }, [players]);

  const chartConfig = React.useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    players.forEach((player, index) => {
      config[player.name] = {
        label: player.name,
        color: CHART_COLORS_HSL[index % CHART_COLORS_HSL.length],
      };
    });
    return config;
  }, [players]);

  const yDomain = React.useMemo(() => {
    if (!processedChartData.length) return ['auto', 'auto'];
    let minY = Infinity;
    let maxY = -Infinity;

    processedChartData.forEach(point => {
      players.forEach(player => {
        const balance = point[player.name] as number;
        if (typeof balance === 'number') { // Ensure balance is a number
            if (balance < minY) minY = balance;
            if (balance > maxY) maxY = balance;
        }
      });
    });
    
    // Fallback if no valid balances found (e.g. all players have NaN or undefined balances)
    if (minY === Infinity || maxY === -Infinity) { 
        minY = -500; // Default min
        maxY = 500;  // Default max
    }

    // Add padding to the domain
    const padding = Math.max(Math.abs(minY), Math.abs(maxY), 100) * 0.1 || 100; // Ensure padding is at least 100, or 10% of max absolute value
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

  // Check if there's enough data variety to plot a meaningful graph
  // Needs at least two distinct time points, or players with transactions
   const noSufficientDataForGraph = processedChartData.length < 2 ||
                                 (processedChartData.length >= 1 && players.every(p => p.transactions.length === 0) && processedChartData.length < 2);


  if (noSufficientDataForGraph) {
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
          <p className="text-muted-foreground">No transaction data available to plot trends, or too few data points.</p>
          <p className="text-sm text-muted-foreground/80">Graph will appear once players have transactions resulting in at least two time points.</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2.5 shadow-sm">
          <p className="mb-1.5 text-sm font-medium text-center">{`Time: ${label}`}</p>
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-xs py-0.5">
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
  };

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
            <LineChart data={processedChartData} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
              <XAxis
                dataKey="formattedTime"
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fontSize: 12 }}
                angle={-45} // For better label readability if many points
                textAnchor="end"
                height={60} // Adjust height to accommodate angled labels
                interval="preserveStartEnd" // Show first and last tick, and some in between
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value} Rs.`}
                domain={yDomain} // Use calculated domain
                allowDataOverflow={true} // Important if lines might go slightly out of calculated domain
                width={80} // Give Y-axis enough space for labels
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground)/0.3)' }}
                content={<CustomTooltip />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone" // smooth line
                  dataKey={player.name}
                  stroke={chartConfig[player.name]?.color || "#8884d8"}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: chartConfig[player.name]?.color, strokeWidth:1, stroke: 'hsl(var(--background))' }} // Subtle dots
                  activeDot={{ r: 6, strokeWidth:2, stroke: 'hsl(var(--background))' }} // Larger dot on hover
                  connectNulls={true} // Crucial for connecting lines with missing data points
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
