
"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Scale, Landmark, LogOut as LogOutIcon, Trophy } from 'lucide-react'; // Renamed LogOut to LogOutIcon
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SummaryDisplayProps {
  players: Player[];
  isSessionEnded: boolean;
}

export function SummaryDisplay({ players, isSessionEnded }: SummaryDisplayProps) {
  
  const { 
    totalOwedToBank, 
    totalBankOwes, 
    netBankPosition,
    totalPlayerWinnings,
    totalPlayerLosses,
    finalBankNetPosition
  } = useMemo(() => {
    let activeOwedToBank = 0;
    let activeBankOwes = 0;
    
    let sessionPlayerWinnings = 0;
    let sessionPlayerLosses = 0;
    let sessionNetPlayerResultsSum = 0;

    players.forEach(player => {
      const liveBalance = player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      if (player.departureStatus === 'active' && !isSessionEnded) {
        if (liveBalance < 0) {
          activeOwedToBank += Math.abs(liveBalance);
        } else if (liveBalance > 0) {
          activeBankOwes += liveBalance;
        }
      }

      if (isSessionEnded && player.cashedOutAmount !== undefined) {
        const finalNetResult = (player.cashedOutAmount ?? 0) + liveBalance;
        sessionNetPlayerResultsSum += finalNetResult;
        if (finalNetResult > 0) {
          sessionPlayerWinnings += finalNetResult;
        } else if (finalNetResult < 0) {
          sessionPlayerLosses += Math.abs(finalNetResult);
        }
      }
    });

    return {
      totalOwedToBank: activeOwedToBank,
      totalBankOwes: activeBankOwes,
      netBankPosition: activeBankOwes - activeOwedToBank, // Positive if bank payout > bank income (bank is down to active players)
      totalPlayerWinnings: sessionPlayerWinnings,
      totalPlayerLosses: sessionPlayerLosses,
      finalBankNetPosition: -sessionNetPlayerResultsSum, // Negative sum of player results is bank profit
    };
  }, [players, isSessionEnded]);

  const totalBuyIns = useMemo(() => {
    return players.reduce((sum, player) => {
      let playerBuyIn = Math.abs(player.initialBalance); 
      player.transactions.forEach(tx => {
        if (tx.amount > 0 && (tx.description.toLowerCase().includes('buy-in') || tx.description.toLowerCase().includes('rebuy'))) {
          playerBuyIn += tx.amount;
        }
      });
      return sum + playerBuyIn;
    },0);
  }, [players]);

  const totalCashedOutByPlayers = useMemo(() => {
    // This should sum actual cashedOutAmount for all players, relevant for both live and ended session
    return players
      .filter(p => p.cashedOutAmount !== undefined)
      .reduce((sum, p) => sum + (p.cashedOutAmount ?? 0), 0);
  }, [players]);


  return (
    <Card className="w-full shadow-xl border-border/50 sticky top-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <div>
            <CardTitle className="text-2xl">{isSessionEnded ? "Final Game Stats" : "Game Summary"}</CardTitle>
            <CardDescription>{isSessionEnded ? "Overall financial outcome of the concluded game." : "Live overview of the current game finances for active players."}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {!isSessionEnded ? (
          <>
            <SummaryItem
              icon={<TrendingDown className="h-5 w-5 text-destructive" />}
              label="Active Players Owe Bank:"
              value={totalOwedToBank}
              valueColor="text-destructive"
              description="Total amount active players need to pay back to the bank from their stacks."
            />
            <SummaryItem
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              label="Bank Owes Active Players:"
              value={totalBankOwes}
              valueColor="text-emerald-500"
              description="Total amount bank needs to pay out to active players from their stacks."
            />
            <Separator className="my-3 bg-border/40" />
            <SummaryItem
              icon={<Scale className="h-5 w-5 text-foreground/80" />}
              label="Bank's Net Position (Active):"
              value={netBankPosition}
              valueColor={netBankPosition < 0 ? 'text-emerald-500' : netBankPosition > 0 ? 'text-destructive' : 'text-foreground'}
              suffix={
                netBankPosition < 0 ? " (Bank is Profiting)" :
                netBankPosition > 0 ? " (Bank is Loosing)" :
                " (Bank is Even)"
              }
              isBoldValue={true}
              description="Overall financial status of the bank concerning active players. Negative means bank is up."
            />
          </>
        ) : (
          <>
            <SummaryItem
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              label="Total Won by Players:"
              value={totalPlayerWinnings}
              valueColor="text-emerald-500"
              description="Sum of profits for all winning players."
            />
            <SummaryItem
              icon={<TrendingDown className="h-5 w-5 text-destructive" />}
              label="Total Lost by Players:"
              value={totalPlayerLosses}
              valueColor="text-destructive"
              description="Sum of losses for all losing players."
            />
             <Separator className="my-3 bg-border/40" />
            <SummaryItem
              icon={<Scale className="h-5 w-5 text-foreground/80" />}
              label="Bank's Final Net Position:"
              value={finalBankNetPosition} // Positive if bank profited, negative if bank lost
              valueColor={finalBankNetPosition > 0 ? 'text-emerald-500' : finalBankNetPosition < 0 ? 'text-destructive' : 'text-foreground'}
              suffix={
                finalBankNetPosition > 0 ? " (Bank Profit)" :
                finalBankNetPosition < 0 ? " (Bank Loss)" :
                " (Bank Broke Even)"
              }
              isBoldValue={true}
              description="Overall financial result for the bank from this game session."
            />
          </>
        )}
        
        <Separator className="my-3 bg-border/40" />

         <SummaryItem
          icon={<Landmark className="h-5 w-5 text-primary/80" />}
          label="Total Buy-ins/Re-buys:"
          value={totalBuyIns}
          valueColor="text-primary"
          description="Total amount of money that has entered the game pot from all players."
        />
         <SummaryItem
          icon={<LogOutIcon className="h-5 w-5 text-accent/80" />} // Used LogOutIcon
          label="Total Chips Cashed Out:"
          value={totalCashedOutByPlayers}
          valueColor="text-accent"
          description="Total amount of physical chips taken off the table by all players (including auto cash-outs)."
        />
      </CardContent>
    </Card>
  );
}

interface SummaryItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueColor?: string;
  suffix?: string;
  isBoldValue?: boolean;
  description?: string;
}

function SummaryItem({ icon, label, value, valueColor = 'text-foreground', suffix = '', isBoldValue, description }: SummaryItemProps) {
  return (
    <div className="p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-medium text-foreground/90">{label}</span>
        </div>
        <span className={cn(
          "text-sm",
          isBoldValue ? "font-bold" : "font-semibold",
          valueColor
        )}>
          {valuePrefix(value, suffix)}{Math.abs(value).toFixed(2)} Rs. {valueSuffix(value, suffix)}
        </span>
      </div>
      {description && <p className="text-xs text-muted-foreground/70 mt-1 pl-[34px] group-hover:text-muted-foreground">{description}</p>}
    </div>
  );
}

function valuePrefix(value: number, suffix: string): string {
  // For Bank's Net Position (Active) or Bank's Final Net Position
  if (suffix.toLowerCase().includes("bank is profiting") && value !== 0) return '+'; // Bank profit is positive
  if (suffix.toLowerCase().includes("bank is loosing") && value !== 0) return '-';   // Bank loss is negative
  if (suffix.toLowerCase().includes("bank profit") && value !== 0) return '+';
  if (suffix.toLowerCase().includes("bank loss") && value !== 0) return '-';
  
  // General cases, if no specific bank suffix applies
  if (value > 0 && !suffix.toLowerCase().includes("loss") && !suffix.toLowerCase().includes("loosing") && !suffix.toLowerCase().includes("owe")) return '+';
  if (value < 0 && !suffix.toLowerCase().includes("profit") && !suffix.toLowerCase().includes("profiting") && !suffix.toLowerCase().includes("owes")) return '-';
  
  return ''; // Default no prefix (for 0 or if logic dictates no sign for that specific suffix)
}

function valueSuffix(value: number, suffix: string): string {
  if (value === 0 && (suffix.toLowerCase().includes("even") || suffix.toLowerCase().includes("broke even")) ) return suffix;
  if (value !== 0 && (suffix.toLowerCase().includes("profiting") || suffix.toLowerCase().includes("loosing") || suffix.toLowerCase().includes("profit") || suffix.toLowerCase().includes("loss"))) return suffix;
  return "";
}

    