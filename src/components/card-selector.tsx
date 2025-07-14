
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

export type HandSection = 'myHand' | 'opponentHand' | 'communityCards';

const SUITS = ['S', 'H', 'D', 'C'] as const;
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

const suitSymbols: { [key: string]: string } = { S: '♠', H: '♥', D: '♦', C: '♣' };
const suitColors: { [key: string]: string } = { S: 'text-foreground', H: 'text-red-500', D: 'text-blue-500', C: 'text-green-500' };


interface CardSelectorProps {
  children: React.ReactNode;
  selectedCard?: string;
  onCardSelect: (card: string) => void;
  allSelectedCards: Set<string>;
}

export function CardSelector({ children, selectedCard, onCardSelect, allSelectedCards }: CardSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <ScrollArea className="h-[280px]">
          <div className="grid grid-cols-1 gap-2">
            {SUITS.map((suit) => (
              <div key={suit}>
                <div className="flex items-center mb-1">
                  <div className={cn("text-lg font-bold", suitColors[suit])}>{suitSymbols[suit]}</div>
                  <div className="ml-2 h-px flex-grow bg-border" />
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {RANKS.map((rank) => {
                    const card = `${rank}${suit}`;
                    const isDisabled = allSelectedCards.has(card) && card !== selectedCard;
                    return (
                      <Button
                        key={card}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-9 w-9 text-base font-bold p-0",
                          suitColors[suit],
                          isDisabled && "opacity-30 cursor-not-allowed",
                          card === selectedCard && "border-primary ring-2 ring-primary"
                        )}
                        onClick={() => {
                          onCardSelect(card);
                          setIsOpen(false);
                        }}
                        disabled={isDisabled}
                      >
                        {rank}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
