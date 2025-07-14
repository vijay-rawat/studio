
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const PokerCardDisplay = ({ card }: { card: string }) => {
  const suitSymbols: { [key: string]: string } = { S: '♠', D: '♦', H: '♥', C: '♣' };
  const suitColors: { [key: string]: string } = { S: 'text-foreground', D: 'text-blue-500', H: 'text-red-500', C: 'text-green-500' };
  
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);

  return (
    <>
      <div className={cn("text-xl", suitColors[suit])}>{rank}</div>
      <div className={cn("text-2xl", suitColors[suit])}>{suitSymbols[suit]}</div>
    </>
  );
};


interface CardSlotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  card?: string;
}

export function CardSlot({ card, ...props }: CardSlotProps) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex h-24 w-16 flex-col justify-between rounded-lg border-2 bg-card p-1 text-center font-bold shadow-md transition-all duration-300 hover:border-primary/70",
        card ? 'border-border' : 'border-dashed border-muted-foreground/50'
      )}
      {...props}
    >
      {card ? <PokerCardDisplay card={card} /> : <Plus className="h-8 w-8 text-muted-foreground/50 m-auto" />}
    </button>
  );
}
