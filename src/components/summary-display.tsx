"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown, Scale, Landmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SummaryDisplayProps {
  players: Player[];
}

export function SummaryDisplay({ players }: SummaryDisplayProps) {
  const activePlayers = players.filter(p => p.departureStatus === 'active');
  
  const { totalOwedToBank, totalBankOwes, netBankPosition } = useMemo(() => {
    let owedToBank = 0;
    let bankOwes = 0;

    // Calculate based on active players only for live summary
    activePlayers.forEach(player => {
      const playerBalance = player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
      if (playerBalance < 0) {
        owedToBank += Math.abs(playerBalance);
      } else if (playerBalance > 0) {
        bankOwes += playerBalance;
      }
    });

    return {
      totalOwedToBank: owedToBank,
      totalBankOwes: bankOwes,
      netBankPosition: bankOwes - owedToBank, // Positive if bank payout > bank income (bank is down)
    };
  }, [activePlayers]);

  const totalBuyIns = useMemo(() => {
    return players.reduce((sum, player) => {
      // Initial balance is typically negative (taken from bank)
      // Transactions: positive is money to bank (e.g. re-buy), negative is money from bank (e.g. food)
      // A buy-in or re-buy is effectively money going to the bank, so positive transaction or initial negative balance.
      let playerBuyIn = Math.abs(player.initialBalance); // Initial buy-in amount
      player.transactions.forEach(tx => {
        if (tx.amount > 0 && (tx.description.toLowerCase().includes('buy-in') || tx.description.toLowerCase().includes('rebuy'))) {
          playerBuyIn += tx.amount;
        }
      });
      return sum + playerBuyIn;
    },0);
  }, [players]);

  const totalCashedOutByPlayers = useMemo(() => {
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
            <CardTitle className="text-2xl">Game Summary</CardTitle>
            <CardDescription>Live overview of the current game finances for active players.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
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
        
        <Separator className="my-3 bg-border/40" />

         <SummaryItem
          icon={<Landmark className="h-5 w-5 text-primary/80" />}
          label="Total Buy-ins/Re-buys:"
          value={totalBuyIns}
          valueColor="text-primary"
          description="Total amount of money that has entered the game pot from all players."
        />
         <SummaryItem
          icon={<LogOut className="h-5 w-5 text-accent/80" />}
          label="Total Cashed Out by Players:"
          value={totalCashedOutByPlayers}
          valueColor="text-accent"
          description="Total amount of money taken off the table by cashed-out players."
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

// Helper to determine prefix for value display, especially for net position
function valuePrefix(value: number, suffix: string): string {
  if (suffix.toLowerCase().includes("bank is profiting") && value !== 0) return '+'; // Bank profit means positive for bank
  if (suffix.toLowerCase().includes("bank is loosing") && value !== 0) return '-'; // Bank loss means negative for bank
  if (value < 0 && !suffix) return '-'; // Standard negative value if no specific suffix logic
  if (value > 0 && !suffix) return '+'; // Standard positive value
  return ''; // Default no prefix (for 0 or handled by suffix)
}

// Helper to get the actual suffix part if it exists
function valueSuffix(value: number, suffix: string): string {
  if (value === 0 && suffix.toLowerCase().includes("even")) return suffix;
  if (value !== 0 && (suffix.toLowerCase().includes("profiting") || suffix.toLowerCase().includes("loosing"))) return suffix;
  return "";
}

