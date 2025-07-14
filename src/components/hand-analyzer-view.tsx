
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Lightbulb, AlertTriangle, PartyPopper, Scale, Trash2, Undo2, UserPlus, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { evaluatePokerHands, type PokerHandInput } from '@/lib/poker-evaluator';
import type { PokerHandResult } from '@/lib/poker-evaluator';
import { cn } from '@/lib/utils';
import { CardSelector } from './card-selector';
import { CardSlot } from './card-slot';

type HandSection = 'myHand' | 'communityCards' | `opponentHand${number}`;


// A simple component to render a poker card with suit and rank
const PokerCard = ({ card, isHighlighted }: { card: string; isHighlighted?: boolean }) => {
  const suitSymbols: { [key: string]: string } = { S: '♠', D: '♦', H: '♥', C: '♣' };
  const suitColors: { [key: string]: string } = { S: 'text-foreground', D: 'text-blue-500', H: 'text-red-500', C: 'text-green-500' };
  
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);

  return (
    <motion.div
      layoutId={`card-${card}`}
      className={cn(
        "relative flex h-24 w-16 select-none flex-col justify-between rounded-lg border-2 bg-card p-1 text-center font-bold shadow-md transition-all duration-300",
        isHighlighted ? 'border-primary shadow-primary/40 scale-105' : 'border-border'
      )}
    >
      <div className={cn("text-xl", suitColors[suit])}>{rank}</div>
      <div className={cn("text-2xl", suitColors[suit])}>{suitSymbols[suit]}</div>
    </motion.div>
  );
};


export function HandAnalyzerView() {
  const [myHand, setMyHand] = useState<string[]>([]);
  const [opponentHands, setOpponentHands] = useState<string[][]>([[]]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PokerHandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const allSelectedCards = useMemo(() => {
    return new Set([...myHand, ...communityCards, ...opponentHands.flat()]);
  }, [myHand, communityCards, opponentHands]);

  const handleCardSelect = (card: string, section: HandSection, index: number, opponentIndex?: number) => {
    if (section === 'myHand') {
      setMyHand(prev => { const newHand = [...prev]; newHand[index] = card; return newHand; });
    } else if (section === 'communityCards') {
      setCommunityCards(prev => { const newHand = [...prev]; newHand[index] = card; return newHand; });
    } else if (section.startsWith('opponentHand') && opponentIndex !== undefined) {
      setOpponentHands(prev => {
        const newOpponentHands = [...prev];
        const newHand = [...(newOpponentHands[opponentIndex] || [])];
        newHand[index] = card;
        newOpponentHands[opponentIndex] = newHand;
        return newOpponentHands;
      });
    }
  };

  const handleClearSection = (section: HandSection, opponentIndex?: number) => {
     if (section === 'myHand') {
      setMyHand([]);
    } else if (section === 'communityCards') {
      setCommunityCards([]);
    } else if (section.startsWith('opponentHand') && opponentIndex !== undefined) {
       setOpponentHands(prev => prev.filter((_, i) => i !== opponentIndex));
    }
    setAnalysisResult(null);
  };

  const handleAddOpponent = () => {
    if (opponentHands.length < 5) {
      setOpponentHands(prev => [...prev, []]);
    } else {
      toast({ title: "Max Opponents", description: "You can add a maximum of 5 opponents.", variant: "destructive" });
    }
  };
  
  const handleClearAll = () => {
    setMyHand([]);
    setOpponentHands([[]]);
    setCommunityCards([]);
    setAnalysisResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnalysisResult(null);

    const validOpponentHands = opponentHands.filter(hand => hand.length === 2);

    if (myHand.length !== 2) {
      toast({ title: "Invalid Input", description: "Your hand must contain exactly 2 cards.", variant: "destructive" });
      return;
    }
    if (validOpponentHands.length === 0) {
      toast({ title: "Invalid Input", description: "At least one opponent must have exactly 2 cards.", variant: "destructive" });
      return;
    }
    if (communityCards.length < 3 || communityCards.length > 5) {
      toast({ title: "Invalid Input", description: "Community cards must contain 3 to 5 cards.", variant: "destructive" });
      return;
    }

    const input: PokerHandInput = {
      myHand: myHand,
      opponentHands: validOpponentHands,
      communityCards: communityCards,
    };

    setIsLoading(true);
    // Use a timeout to simulate a small delay for a better UX, as local evaluation can be instant
    setTimeout(() => {
      try {
        const result = evaluatePokerHands(input);
        setAnalysisResult(result);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "An error occurred while analyzing the hands. Please check your card inputs.");
        toast({ title: "Analysis Failed", description: e.message || "Could not analyze the hands.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };
  
  const getResultIcon = () => {
    if (!analysisResult) return null;
    if (analysisResult.winner.toLowerCase().includes('split')) {
       return <Scale className="h-8 w-8 text-amber-500" />;
    }
    if (analysisResult.winner === 'You') {
        return <Trophy className="h-8 w-8 text-emerald-500" />;
    }
    return <PartyPopper className="h-8 w-8 text-destructive" />;
  };
  
  const getResultColorClass = () => {
    if (!analysisResult) return '';
    if (analysisResult.winner.toLowerCase().includes('split')) {
      return 'border-amber-500/50 bg-amber-950/20';
    }
     if (analysisResult.winner === 'You') {
      return 'border-emerald-500/50 bg-emerald-950/20';
    }
    return 'border-destructive/50 bg-destructive/10';
  };

  const renderCardSlots = (section: HandSection, count: number, cards: string[], opponentIndex?: number) => {
    const slots = [];
    for (let i = 0; i < count; i++) {
      slots.push(
        <CardSelector 
          key={`${section}-${opponentIndex !== undefined ? opponentIndex : ''}-${i}`} 
          selectedCard={cards[i]} 
          onCardSelect={(card) => handleCardSelect(card, section, i, opponentIndex)}
          allSelectedCards={allSelectedCards}
        >
          <CardSlot card={cards[i]} />
        </CardSelector>
      );
    }
    return slots;
  };
  
  const isSubmitDisabled = isLoading || myHand.length !== 2 || opponentHands.every(h => h.length !== 2) || communityCards.length < 3;

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">Hand Analyzer</CardTitle>
              <CardDescription>Select cards for all hands and the board to see who wins a multi-way pot.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg bg-muted/30 p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Your Hand</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {renderCardSlots('myHand', 2, myHand)}
                </div>
              </div>

              {opponentHands.map((hand, index) => (
                <div key={`opponent-${index}`} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Opponent {index + 1}'s Hand</h3>
                    <Button variant="ghost" size="sm" onClick={() => handleClearSection('opponentHand', index)}><Trash2 className="h-4 w-4 mr-2"/>Remove</Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {renderCardSlots(`opponentHand${index}` as HandSection, 2, hand, index)}
                  </div>
                </div>
              ))}
              
              <Button variant="outline" size="sm" onClick={handleAddOpponent} disabled={opponentHands.length >= 5}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Opponent
              </Button>
              
               <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Community Cards (Flop, Turn, River)</h3>
                  </div>
                <div className="flex gap-2 flex-wrap">
                   {renderCardSlots('communityCards', 5, communityCards)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClearAll} disabled={isLoading || allSelectedCards.size === 0}>
                <Undo2 className="h-4 w-4 mr-2" />
                Reset Board
              </Button>
              <Button onClick={handleSubmit} className="text-base py-3" disabled={isSubmitDisabled}>
                {isLoading ? 'Analyzing...' : 'Analyze Hands'}
              </Button>
            </div>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </motion.div>
        )}
        
        {error && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </motion.div>
        )}

        {analysisResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <Card className={cn("shadow-xl border transition-all", getResultColorClass())}>
              <CardHeader>
                <div className="flex items-center gap-3">
                    {getResultIcon()}
                    <div>
                        <CardTitle className="text-3xl">Result: {analysisResult.winner}</CardTitle>
                        <CardDescription>Based on the best 5-card hands available to each player.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                   {analysisResult.rankedResults.map((result, index) => {
                      const allPlayerHoleCards = result.playerId === 'You' ? myHand : opponentHands[parseInt(result.playerId.split(' ')[1]) - 1] || [];
                      const isWinner = analysisResult.winner.includes(result.playerId);

                      return (
                         <motion.div 
                            key={result.playerId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={cn(
                                "p-4 rounded-xl border transition-colors",
                                isWinner 
                                    ? "bg-emerald-950/30 border-emerald-500/50" 
                                    : "bg-muted/30 border-transparent"
                            )}
                         >
                            <h3 className="font-semibold text-lg mb-2">{result.playerId}'s Hand ({result.handName})</h3>
                            <div className="flex gap-2 flex-wrap">
                                {result.handCards.map(c => <PokerCard key={`res-${result.playerId}-${c}`} card={c} isHighlighted={true} />)}
                            </div>
                         </motion.div>
                      );
                   })}

                  <h3 className="font-semibold text-lg pt-4">Community Cards</h3>
                  <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {communityCards.map(c => <PokerCard key={`res-comm-${c}`} card={c} isHighlighted={analysisResult.rankedResults.some(r => r.handCards.includes(c))} />)}
                  </div>
                </div>
                
                <Alert className="border-primary/30 bg-primary/5">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Explanation</AlertTitle>
                  <AlertDescription className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                    {analysisResult.explanation}
                  </AlertDescription>
                </Alert>

              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
