"use client";

import type * as React from 'react';
import { useMemo } from 'react';
import type { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryDisplayProps {
  players: Player[];
}

export function SummaryDisplay({ players }: SummaryDisplayProps) {
  const { totalOwedToBank, totalBankOwes, netBankPosition } = useMemo(() => {
    let owedToBank = 0;
    let bankOwes = 0;

    players.forEach(player => {
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
      netBankPosition: bankOwes - owedToBank, // Positive if bank payout > bank income
    };
  }, [players]);

  return (
    <Card className="w-full max-w-md shadow-lg sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <BarChart3 className="mr-2 h-6 w-6 text-primary" />
          Game Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
          <div className="flex items-center">
            <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">Total Owed to Bank:</span>
          </div>
          <span className="text-sm font-semibold text-red-500">{totalOwedToBank.toFixed(2)} Rs.</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium">Total Bank Owes Players:</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">{totalBankOwes.toFixed(2)} Rs.</span>
        </div>
        <div className="flex justify-between items-center p-3 border-t mt-2 pt-3">
          <span className="text-sm font-medium">Bank Net Position:</span>
          <span className={`text-sm font-bold ${netBankPosition < 0 ? 'text-emerald-600' : netBankPosition > 0 ? 'text-red-500' : 'text-foreground'}`}>
            {netBankPosition > 0 ? '-' : ''}{Math.abs(netBankPosition).toFixed(2)} Rs.
            {netBankPosition < 0 && " (Bank is up)"}
            {netBankPosition > 0 && " (Bank is down)"}
            {netBankPosition === 0 && " (Bank is even)"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
