
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingDown, Users, BarChartBig, TrendingUp, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
      return { ...p, name: p.name, finalNetResult }; // Ensure name is explicitly carried for chart
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
    // Sort losers by the most negative amount
    const sortedLosers = losers.sort((a,b) => a.finalNetResult - b.finalNetResult);
    return sortedLosers.length > 0 ? sortedLosers[0] : null;
  }, [playerStats]);

  const chartData = useMemo(() => {
    // Sort for chart display, typically largest positive to largest negative
    return [...playerStats].sort((a, b) => b.finalNetResult - a.finalNetResult).map(p => ({
      name: p.name,
      amount: p.finalNetResult,
    }));
  }, [playerStats]);
  
  const chartConfig = {
    amount: {
      label: "Net Result (Rs.)",
    },
  };


  if (players.length === 0) {
    return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><BarChartBig className="mr-3 h-7 w-7 text-primary" />Session Ended - No Player Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No players participated or no data was recorded for this session.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border-border/50 mt-8">
      <CardHeader>
        <div className="flex items-center gap-3">
            <BarChartBig className="h-8 w-8 text-primary" />
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

          {chartData.length > 0 && (
            <div className="space-y-3 pt-4">
                 <div className="flex items-center gap-2 mb-1">
                    <BarChartBig className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-lg font-medium text-foreground/80">Visual Summary:</h4>
                </div>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value} Rs.`}/>
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} tick={{ dy: 2 }} />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                        content={<ChartTooltipContent />}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={20}>
                        {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </ChartContainer>
            </div>
          )}
           {playerStats.length > 0 && chartData.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No data available for chart visualization.</p>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
