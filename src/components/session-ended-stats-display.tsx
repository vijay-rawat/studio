
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingDown, User, TrendingUp, BarChartBig } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      // If cashedOutAmount is undefined (shouldn't happen if session end logic is correct),
      // it means they were active till end and auto-cashed out based on liveBalance.
      // For this calculation, cashedOutAmount should always be set by the end session logic.
      const finalNetResult = (p.cashedOutAmount ?? 0) + liveBalance;
      return { ...p, finalNetResult };
    }).sort((a, b) => b.finalNetResult - a.finalNetResult); // Sort by net result descending
  }, [players]);

  const topWinner = useMemo(() => {
    if (playerStats.length === 0) return null;
    const winners = playerStats.filter(p => p.finalNetResult > 0);
    return winners.length > 0 ? winners[0] : null; // Highest positive result
  }, [playerStats]);

  const topLoser = useMemo(() => {
    if (playerStats.length === 0) return null;
    const losers = playerStats.filter(p => p.finalNetResult < 0);
    return losers.length > 0 ? losers[losers.length - 1] : null; // Lowest negative result (most negative)
  }, [playerStats]);

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
      <CardContent className="space-y-6">
        { (topWinner || topLoser) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {topWinner && (
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-7 w-7 text-emerald-600" />
                    <CardTitle className="text-xl text-emerald-700">Top Winner</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">{topWinner.name}</p>
                  <p className="text-lg text-emerald-500">Net Profit: +{topWinner.finalNetResult.toFixed(2)} Rs.</p>
                </CardContent>
              </Card>
            )}
            {topLoser && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-7 w-7 text-destructive" />
                    <CardTitle className="text-xl text-destructive">Top Loser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">{topLoser.name}</p>
                  <p className="text-lg text-red-500">Net Loss: {topLoser.finalNetResult.toFixed(2)} Rs.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        <div>
          <h3 className="text-xl font-semibold mb-3 text-foreground/90 flex items-center">
            <Users className="mr-2 h-5 w-5 text-muted-foreground" /> All Player Results
          </h3>
          <Separator className="mb-4 bg-border/40"/>
          <ScrollArea className="h-[300px] pr-3 -mr-3">
            <ul className="space-y-3">
              {playerStats.map((pStat) => (
                <li 
                  key={pStat.id} 
                  className={cn(
                    "flex justify-between items-center p-3.5 rounded-lg border",
                    pStat.finalNetResult > 0 ? "bg-emerald-500/5 border-emerald-500/20" :
                    pStat.finalNetResult < 0 ? "bg-destructive/5 border-destructive/20" :
                    "bg-muted/30 border-muted/50"
                  )}
                >
                  <span className="font-medium text-foreground">{pStat.name}</span>
                  <span className={cn(
                    "font-semibold",
                    pStat.finalNetResult > 0 ? "text-emerald-500" :
                    pStat.finalNetResult < 0 ? "text-destructive" :
                    "text-foreground"
                  )}>
                    {pStat.finalNetResult > 0 ? '+' : ''}{pStat.finalNetResult.toFixed(2)} Rs.
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

    