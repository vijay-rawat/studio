
"use client";

import React, { useMemo, useState, Fragment } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, TooltipProps, ReferenceLine } from 'recharts';
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
  [playerName:string]: number | string; // Balances for each player, or formattedTime string
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
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

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

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  };

  const calculateFinalNetResult = (player: Player): number => {
    const liveBalanceAllTxs = player.initialBalance + player.transactions.filter(t => t.action !== 'deleted').reduce((sum, tx) => sum + tx.amount, 0);
    return (player.cashedOutAmount ?? 0) + liveBalanceAllTxs;
  };

  const processedChartData = useMemo(() => {
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
    } else { // No transactions, establish based on cash out times if available
        const cashOutTimes = players.map(p => p.cashOutTimestamp ? new Date(p.cashOutTimestamp).getTime() : 0).filter(Boolean);
        if (cashOutTimes.length > 0) {
            earliestActivityTime = Math.min(...cashOutTimes);
        }
    }


    allTimestamps.add(earliestActivityTime - 60000); 

    players.forEach(player => {
      player.transactions.forEach(tx => {
        const t = new Date(tx.timestamp).getTime();
        if (!isNaN(t)) allTimestamps.add(t);
      });
      if (player.cashOutTimestamp) {
        const cot = new Date(player.cashOutTimestamp).getTime();
        if (!isNaN(cot)) allTimestamps.add(cot);
      }
    });
    
    let latestActivityTime = Date.now();
    const allKnownTimes = Array.from(allTimestamps).filter(ts => !isNaN(ts));
    if (allKnownTimes.length > 0) {
        latestActivityTime = Math.max(...allKnownTimes);
    }
    // Ensure the graph concludes at or slightly after the last known activity or cashout
    allTimestamps.add(latestActivityTime);


    const sortedUniqueTimestamps = Array.from(allTimestamps).filter(ts => !isNaN(ts)).sort((a, b) => a - b);
    
    let data: ChartDataPoint[] = sortedUniqueTimestamps.map((ts, index) => {
      const isLastTimestamp = index === sortedUniqueTimestamps.length - 1;
      const dataPoint: ChartDataPoint = {
        time: ts,
        formattedTime: format(new Date(ts), 'HH:mm'),
      };

      players.forEach(player => {
        if (isLastTimestamp) { 
          dataPoint[player.name] = calculateFinalNetResult(player);
        } else {
          let currentBalance = player.initialBalance;
          player.transactions
            .filter(tx => tx.action !== 'deleted' && new Date(tx.timestamp).getTime() <= ts)
            .forEach(tx => {
              currentBalance += tx.amount;
            });
          dataPoint[player.name] = currentBalance;
        }
      });
      return dataPoint;
    });

    if (data.length === 1 && players.length > 0) {
        const singlePoint = data[0]; // This point is already finalNetResult due to isLastTimestamp logic
        const nextTime = singlePoint.time + 3600000; 
        const nextDataPoint: ChartDataPoint = {
            time: nextTime,
            formattedTime: format(new Date(nextTime), 'HH:mm'),
        };
        players.forEach(player => {
            nextDataPoint[player.name] = singlePoint[player.name] as number; 
        });
        data = [singlePoint, nextDataPoint]; // Ensure two points for a line
    } else if (data.length === 0 && players.length > 0) {
        let sessionEndTime = Date.now();
        const cashOutTimestamps = players.map(p => p.cashOutTimestamp ? new Date(p.cashOutTimestamp).getTime() : 0).filter(t => t > 0);
        if (cashOutTimestamps.length > 0) {
            sessionEndTime = Math.max(...cashOutTimestamps);
        }

        const initialTime = sessionEndTime - 3600000; 
        const initialPoint: ChartDataPoint = {
            time: initialTime,
            formattedTime: format(new Date(initialTime), 'HH:mm'),
        };
        players.forEach(p => {
            initialPoint[p.name] = p.initialBalance; // Start with initial bank balance
        });

        const finalPoint: ChartDataPoint = { 
            time: sessionEndTime,
            formattedTime: format(new Date(sessionEndTime), 'HH:mm'),
        };
        players.forEach(p => {
            finalPoint[p.name] = calculateFinalNetResult(p);
        });
        data = [initialPoint, finalPoint];
    }
    return data;
  }, [players]);

  const yDomain = useMemo(() => {
    if (!processedChartData.length) return ['auto', 'auto'];
    let minY = 0; 
    let maxY = 0; 

    processedChartData.forEach(point => {
      players.forEach(player => {
        const balance = point[player.name] as number;
        if (typeof balance === 'number') {
            if (balance < minY) minY = balance;
            if (balance > maxY) maxY = balance;
        }
      });
    });
    
    if (minY === 0 && maxY === 0 && players.some(p => calculateFinalNetResult(p) !== 0)) {
        minY = Math.min(...players.map(p => calculateFinalNetResult(p)), 0);
        maxY = Math.max(...players.map(p => calculateFinalNetResult(p)), 0);
    }
     if (minY === Infinity || maxY === -Infinity || (minY === 0 && maxY === 0 && players.every(p => calculateFinalNetResult(p) === 0))) { 
        minY = -500; 
        maxY = 500;  
    }
    
    const padding = Math.max(Math.abs(minY), Math.abs(maxY), 100) * 0.1 || 100;
    const finalMin = Math.floor(minY - padding);
    const finalMax = Math.ceil(maxY + padding);

    return [finalMin, finalMax];
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

   const noSufficientDataForGraph = processedChartData.length < 2 ||
                                 (processedChartData.length >= 1 && players.every(p => p.transactions.length === 0 && calculateFinalNetResult(p) === 0) && processedChartData.length < 2);

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
          <p className="text-muted-foreground">Not enough distinct data points or all final results are zero.</p>
          <p className="text-sm text-muted-foreground/80">Graph will appear once there's sufficient data to plot trends.</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2.5 shadow-xl text-xs">
          <p className="mb-1.5 text-sm font-medium text-center">{`Time: ${label}`}</p>
          {payload.filter(entry => !hiddenSeries.has(entry.name || '')).map((entry) => (
            <div key={entry.name} className="flex items-center justify-between py-0.5">
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

  const CustomInteractiveLegend = ({ payload: rechartsPayload }: any) => {
    if (!rechartsPayload) return null;
    return (
      <div className="flex items-center justify-center gap-x-3 gap-y-2 pt-4 flex-wrap px-4">
        {rechartsPayload.map((entry: any) => {
          const playerKey = entry.dataKey as string; 
          const itemConfig = chartConfig[playerKey];
          const isHidden = hiddenSeries.has(playerKey);
          return (
            <Button
              key={playerKey}
              variant="ghost"
              size="sm"
              onClick={() => toggleSeries(playerKey)}
              className={cn(
                "flex items-center gap-1.5 p-1 px-2 text-xs h-auto leading-tight",
                isHidden && "opacity-40 hover:opacity-70"
              )}
              aria-pressed={!isHidden}
              aria-label={`${isHidden ? 'Show' : 'Hide'} ${itemConfig?.label || playerKey} line`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: !isHidden ? itemConfig?.color : 'hsl(var(--muted-foreground))' }}
              />
              {itemConfig?.label || playerKey}
            </Button>
          );
        })}
      </div>
    );
  };


  return (
    <Fragment>
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <TrendingUp className="mr-3 h-7 w-7 text-primary" />
            Player Financial Journey
          </CardTitle>
          <CardDescription>Player's bank balance over time, with the final point showing their net profit/loss for the session. Click legend items to toggle lines.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
           <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.3)" />
              <XAxis
                dataKey="formattedTime"
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border)/0.7)" }}
                tickLine={{ stroke: "hsl(var(--border)/0.7)" }}
                tick={{ fontSize: 11 }}
                angle={-40}
                textAnchor="end"
                height={70} 
                interval="preserveStartEnd" 
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                axisLine={{ stroke: "hsl(var(--border)/0.7)" }}
                tickLine={{ stroke: "hsl(var(--border)/0.7)" }}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${value}`} 
                domain={yDomain} 
                allowDataOverflow={true} 
                width={55} 
                label={{ value: 'Balance (Rs.)', angle: -90, position: 'insideLeft', offset: -5, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' } }}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground)/0.2)' }}
                content={<CustomTooltip />}
              />
              <ChartLegend content={<CustomInteractiveLegend />} payload={
                  players.map(p => ({
                      dataKey: p.name, 
                      color: chartConfig[p.name]?.color,
                      value: p.name 
                  }))
              }/>
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" strokeWidth={1.2} />
              {players.map((player) => (
                <Line
                  key={player.id}
                  type="monotone" 
                  dataKey={player.name}
                  stroke={chartConfig[player.name]?.color || "#8884d8"}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: chartConfig[player.name]?.color, strokeWidth:1, stroke: 'hsl(var(--background))' }} 
                  activeDot={{ r: 7, strokeWidth:2, stroke: 'hsl(var(--background))', fill: chartConfig[player.name]?.color }} 
                  connectNulls={true} 
                  hide={hiddenSeries.has(player.name)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
    </Fragment>
  );
}
