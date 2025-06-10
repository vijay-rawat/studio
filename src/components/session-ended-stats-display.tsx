
"use client";

import type * as React from 'react';
import { useMemo, useState } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingDown, Users, ListChecks, BarChart3, UsersRound, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';


interface SessionEndedStatsDisplayProps {
  players: Player[];
}

interface PlayerStat extends Player {
  finalNetResult: number; // Original actual result
  displayNetResult: number; // Potentially modified result for display (e.g., halved)
}

export function SessionEndedStatsDisplay({ players }: SessionEndedStatsDisplayProps) {
  const [divisionEnabled, setDivisionEnabled] = useState(false);
  const [showPikachuGif, setShowPikachuGif] = useState(false);
  const [showPsyduckGif, setShowPsyduckGif] = useState(false);

  const playerStats: PlayerStat[] = useMemo(() => {
    return players.map(p => {
      const liveBalance = p.initialBalance + p.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      const finalNetResult = (p.cashedOutAmount ?? 0) + liveBalance;
      const displayNetResult = divisionEnabled ? finalNetResult / 2 : finalNetResult;
      return { ...p, name: p.name, finalNetResult, displayNetResult };
    }).sort((a, b) => b.displayNetResult - a.displayNetResult); // Sort by displayNetResult
  }, [players, divisionEnabled]);

  const topWinner = useMemo(() => {
    if (playerStats.length === 0) return null;
    const winners = playerStats.filter(p => p.displayNetResult > 0);
    return winners.length > 0 ? winners[0] : null;
  }, [playerStats]);

  const topLoser = useMemo(() => {
    if (playerStats.length === 0) return null;
    const losers = playerStats.filter(p => p.displayNetResult < 0);
    const sortedLosers = losers.sort((a,b) => a.displayNetResult - b.displayNetResult); // Sort by displayNetResult
    return sortedLosers.length > 0 ? sortedLosers[0] : null;
  }, [playerStats]);


  if (players.length === 0) {
    return (
      <Card className="w-full shadow-xl border-border/50 mt-8">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-3 h-7 w-7 text-primary" />Session Ended - No Player Data</CardTitle>
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
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-3xl">Session Ended - Final Stats</CardTitle>
                <CardDescription>
                  Summary of player performance for the concluded game.
                  {divisionEnabled && <span className="block text-accent font-semibold">(Displaying halved results for pot split)</span>}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        { (topWinner || topLoser) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topWinner && (
              <Card
                className="relative bg-emerald-600/10 border-emerald-500/40 shadow-lg overflow-hidden group"
                onMouseEnter={() => setShowPikachuGif(true)}
                onMouseLeave={() => setShowPikachuGif(false)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-emerald-500" />
                    <CardTitle className="text-xl text-emerald-600 dark:text-emerald-400">Top Winner</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{topWinner.name}</p>
                  <p className="text-xl text-emerald-500 dark:text-emerald-300">Net Profit: +{topWinner.displayNetResult.toFixed(2)} Rs.</p>
                </CardContent>
                {showPikachuGif && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-emerald-500/10 transition-opacity duration-300 ease-in-out">
                    <Image
                      src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW1wdjQ4YWZjdXQ2MmV0NThpbjR0eDRhY3pkaTVmaTUzMWN6c2EwZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/W04FjXomStefP2K/giphy.gif"
                      alt="Pikachu celebrating with electric waves"
                      width={150}
                      height={150}
                      className="object-contain opacity-80"
                      data-ai-hint="Pikachu happy dance"
                      unoptimized 
                    />
                  </div>
                )}
              </Card>
            )}
            {topLoser && (
              <Card
                className="relative bg-destructive/10 border-destructive/40 shadow-lg overflow-hidden group"
                onMouseEnter={() => setShowPsyduckGif(true)}
                onMouseLeave={() => setShowPsyduckGif(false)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-8 w-8 text-destructive" />
                    <CardTitle className="text-xl text-destructive">Top Loser</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-destructive">{topLoser.name}</p>
                  <p className="text-xl text-destructive/90 dark:text-destructive/80">Net Loss: {topLoser.displayNetResult.toFixed(2)} Rs.</p>
                </CardContent>
                 {showPsyduckGif && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-destructive/10 transition-opacity duration-300 ease-in-out">
                    <Image
                      src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmRoc3g4M2ZpMW11dWQwaTVvOWI4eDNqZXh1NzRtbjFhcmR2ZHF1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/6oFNB3JPuLpAs/giphy.gif"
                      alt="Sad or confused Psyduck holding its head"
                      width={150}
                      height={150}
                      className="object-contain opacity-80"
                      data-ai-hint="Psyduck confused head"
                      unoptimized 
                    />
                  </div>
                )}
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
                        player.displayNetResult > 0 && "text-emerald-500",
                        player.displayNetResult < 0 && "text-destructive",
                        player.displayNetResult === 0 && "text-muted-foreground"
                    )}>
                        {player.displayNetResult > 0 ? '+' : ''}{player.displayNetResult.toFixed(2)} Rs.
                    </span>
                    </li>
                ))}
                </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No detailed player stats to display.</p>
          )}
        </div>
      </CardContent>
      {players.length > 0 && (
        <CardFooter className="flex-col sm:flex-row gap-2 pt-6 border-t border-border/30">
            <Button 
                onClick={() => setDivisionEnabled(true)} 
                variant="outline"
                className="w-full sm:w-auto"
                disabled={divisionEnabled}
            >
                <UsersRound className="mr-2 h-4 w-4" />
                Split Pot (Halve Results)
            </Button>
            <Button 
                onClick={() => setDivisionEnabled(false)} 
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!divisionEnabled}
            >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Split
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
    
