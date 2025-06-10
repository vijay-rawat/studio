
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingDown, Users, PieChart as PieChartIcon, ListChecks } from 'lucide-react'; // Changed BarChartBig to PieChartIcon
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";


interface SessionEndedStatsDisplayProps {
  players: Player[];
}

interface PlayerStat extends Player {
  finalNetResult: number;
}

export function SessionEndedStatsDisplay({ players }: SessionEndedStatsDisplayProps) {
  const playerStats: PlayerStat[] = useMemo(() => {
    return players.map(p => {
      const liveBalance = p.initialBalance + p.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const finalNetResult = (p.cashedOutAmount ?? 0) + liveBalance;
      return { ...p, name: p.name, finalNetResult };
    }).sort((a, b) => b.finalNetResult - a.finalNetResult);
  }, [players]);

  const topWinner = useMemo(() => {
    if (playerStats.length === 0) return null;
    const winners = playerStats.filter(p => p.finalNetResult > 0);
    return winners.length > 0 ? winners[0] : null;
  }, [playerStats]);

  const topLoser = useMemo(() => {
    if (playerStats.length === 0) return null;
    const losers = playerStats.filter(p => p.finalNetResult < 0);
    const sortedLosers = losers.sort((a,b) => a.finalNetResult - b.finalNetResult);
    return sortedLosers.length > 0 ? sortedLosers[0] : null;
  }, [playerStats]);

  const pieChartData = useMemo(() => {
    return playerStats
      .filter(p => p.finalNetResult !== 0) // Exclude players who broke even from pie chart
      .map(p => ({
        name: p.name,
        value: Math.abs(p.finalNetResult), // Use absolute value for slice size
        originalResult: p.finalNetResult, // Store original for tooltip and color
        fill: p.finalNetResult > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
      }));
  }, [playerStats]);
  
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    playerStats.forEach(player => {
      config[player.name] = {
        label: player.name,
        color: player.finalNetResult > 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
      };
    });
    return config;
  }, [playerStats]);


  if (players.length === 0) {
    return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><PieChartIcon className="mr-3 h-7 w-7 text-primary" />Session Ended - No Player Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No players participated or no data was recorded for this session.</p>
        </CardContent>
      </Card>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // Don't render label if slice is too small

    return (
      <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-medium">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <Card className="w-full shadow-xl border-border/50 mt-8">
      <CardHeader>
        <div className="flex items-center gap-3">
            <PieChartIcon className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-3xl">Session Ended - Final Stats</CardTitle>
                <CardDescription>Summary of player performance for the concluded game.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        { (topWinner || topLoser) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topWinner && (
              <Card className="bg-emerald-600/10 border-emerald-500/40 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-emerald-500" />
                    <CardTitle className="text-xl text-emerald-600 dark:text-emerald-400">Top Winner</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{topWinner.name}</p>
                  <p className="text-xl text-emerald-500 dark:text-emerald-300">Net Profit: +{topWinner.finalNetResult.toFixed(2)} Rs.</p>
                </CardContent>
              </Card>
            )}
            {topLoser && (
              <Card className="bg-destructive/10 border-destructive/40 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-8 w-8 text-destructive" />
                    <CardTitle className="text-xl text-destructive">Top Loser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">{topLoser.name}</p>
                  <p className="text-xl text-destructive/90 dark:text-destructive/80">Net Loss: {topLoser.finalNetResult.toFixed(2)} Rs.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground/90">All Player Results</h3>
          </div>
          <Separator className="mb-4 bg-border/40"/>

          {playerStats.length > 0 ? (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <ListChecks className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-lg font-medium text-foreground/80">Detailed Results:</h4>
                </div>
                <ul className="space-y-1.5 pl-2">
                {playerStats.map(player => (
                    <li key={player.id} className="flex justify-between items-center text-sm py-1 px-2 rounded-md hover:bg-muted/30">
                    <span>{player.name}</span>
                    <span className={cn(
                        "font-semibold",
                        player.finalNetResult > 0 && "text-emerald-500",
                        player.finalNetResult < 0 && "text-destructive",
                        player.finalNetResult === 0 && "text-muted-foreground"
                    )}>
                        {player.finalNetResult > 0 ? '+' : ''}{player.finalNetResult.toFixed(2)} Rs.
                    </span>
                    </li>
                ))}
                </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No detailed player stats to display.</p>
          )}

          {pieChartData.length > 0 ? (
            <div className="space-y-3 pt-4">
                 <div className="flex items-center gap-2 mb-1">
                    <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-lg font-medium text-foreground/80">Visual Summary (Magnitude of Results):</h4>
                </div>
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        content={
                            <ChartTooltipContent
                              formatter={(value, name, props) => {
                                const originalResult = props.payload.originalResult;
                                return (
                                  <div className="flex flex-col">
                                    <span>{name}</span>
                                    <span className={cn(
                                      "font-bold",
                                      originalResult > 0 && "text-emerald-500",
                                      originalResult < 0 && "text-destructive"
                                    )}>
                                      {originalResult > 0 ? '+' : ''}{originalResult.toFixed(2)} Rs.
                                    </span>
                                  </div>
                                )
                              }}
                              hideLabel // We use formatter, so hide default label
                            />
                        }
                    />
                    <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        labelLine={false}
                        label={renderCustomizedLabel}
                    >
                        {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                        ))}
                    </Pie>
                    <Legend 
                        wrapperStyle={{paddingTop: "20px"}}
                        formatter={(value, entry) => {
                            const { color } = entry;
                            return <span style={{ color }}>{value}</span>;
                          }}
                    />
                    </PieChart>
                </ResponsiveContainer>
                </ChartContainer>
            </div>
          ) : (
            playerStats.length > 0 && <p className="text-muted-foreground text-center py-4">No significant wins or losses to visualize in a chart.</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}

    