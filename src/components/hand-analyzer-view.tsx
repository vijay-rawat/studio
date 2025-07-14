
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Lightbulb, AlertTriangle, PartyPopper, Scale, Trash2, Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { analyzePokerHand, type AnalyzePokerHandInput, type AnalyzePokerHandOutput } from '@/ai/flows/analyze-poker-hand-flow';
import { cn } from '@/lib/utils';
import { CardSelector, type HandSection } from './card-selector';
import { CardSlot } from './card-slot';


// A simple component to render a poker card with suit and rank
const PokerCard = ({ card, isHighlighted, isOpponent = false }: { card: string; isHighlighted?: boolean, isOpponent?: boolean }) => {
  const suitSymbols: { [key: string]: string } = { S: '♠', D: '♦', H: '♥', C: '♣' };
  const suitColors: { [key: string]: string } = { S: 'text-foreground', D: 'text-blue-500', H: 'text-red-500', C: 'text-green-500' };
  
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);

  return (
    <motion.div
      layoutId={`card-${card}-${isOpponent}`}
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
  const [opponentHand, setOpponentHand] = useState<string[]>([]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePokerHandOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const allSelectedCards = useMemo(() => {
    return new Set([...myHand, ...opponentHand, ...communityCards]);
  }, [myHand, opponentHand, communityCards]);

  const handleCardSelect = (card: string, section: HandSection, index: number) => {
    const setters = {
      myHand: setMyHand,
      opponentHand: setOpponentHand,
      communityCards: setCommunityCards
    };
    
    setters[section](prev => {
      const newHand = [...prev];
      newHand[index] = card;
      return newHand;
    });
  }

  const handleClearSection = (section: HandSection) => {
    const setters = {
      myHand: setMyHand,
      opponentHand: setOpponentHand,
      communityCards: setCommunityCards
    };
    setters[section]([]);
    setAnalysisResult(null);
  }
  
  const handleClearAll = () => {
    setMyHand([]);
    setOpponentHand([]);
    setCommunityCards([]);
    setAnalysisResult(null);
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnalysisResult(null);

    if (myHand.length !== 2) {
      toast({ title: "Invalid Input", description: "Your hand must contain exactly 2 cards.", variant: "destructive" });
      return;
    }
    if (opponentHand.length !== 2) {
      toast({ title: "Invalid Input", description: "Opponent's hand must contain exactly 2 cards.", variant: "destructive" });
      return;
    }
    if (communityCards.length < 3 || communityCards.length > 5) {
      toast({ title: "Invalid Input", description: "Community cards must contain 3 to 5 cards.", variant: "destructive" });
      return;
    }

    const input: AnalyzePokerHandInput = {
      myHand: myHand,
      opponentHand: opponentHand,
      communityCards: communityCards,
    };

    setIsLoading(true);
    try {
      const result = await analyzePokerHand(input);
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      setError("An error occurred while analyzing the hands. The AI may be unable to process this request. Please try again.");
      toast({ title: "Analysis Failed", description: "Could not get a response from the AI. Please check your input and try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getResultIcon = () => {
    if (!analysisResult) return null;
    switch (analysisResult.winner) {
      case 'You': return <PartyPopper className="h-8 w-8 text-emerald-500" />;
      case 'Opponent': return <PartyPopper className="h-8 w-8 text-destructive" />;
      case 'Split pot': return <Scale className="h-8 w-8 text-amber-500" />;
    }
  };
  
  const getResultColorClass = () => {
    if (!analysisResult) return '';
    switch (analysisResult.winner) {
      case 'You': return 'border-emerald-500/50 bg-emerald-950/20';
      case 'Opponent': return 'border-destructive/50 bg-destructive/10';
      case 'Split pot': return 'border-amber-500/50 bg-amber-950/20';
    }
  };

  const renderCardSlots = (section: HandSection, count: number, cards: string[]) => {
    const slots = [];
    for (let i = 0; i < count; i++) {
      slots.push(
        <CardSelector 
          key={`${section}-${i}`} 
          selectedCard={cards[i]} 
          onCardSelect={(card) => handleCardSelect(card, section, i)}
          allSelectedCards={allSelectedCards}
        >
          <CardSlot card={cards[i]} />
        </CardSelector>
      );
    }
    return slots;
  };
  
  const isSubmitDisabled = isLoading || myHand.length !== 2 || opponentHand.length !== 2 || communityCards.length < 3;

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">AI Hand Analyzer</CardTitle>
              <CardDescription>Click the slots to select cards for each hand and the community board, then click Analyze.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg bg-muted/30 p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Your Hand</h3>
                  <Button variant="ghost" size="sm" onClick={() => handleClearSection('myHand')} disabled={myHand.length === 0}><Trash2 className="h-4 w-4 mr-2"/>Clear</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {renderCardSlots('myHand', 2, myHand)}
                </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Opponent's Hand</h3>
                  <Button variant="ghost" size="sm" onClick={() => handleClearSection('opponentHand')} disabled={opponentHand.length === 0}><Trash2 className="h-4 w-4 mr-2"/>Clear</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                   {renderCardSlots('opponentHand', 2, opponentHand)}
                </div>
              </div>
              
               <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Community Cards (Flop, Turn, River)</h3>
                    <Button variant="ghost" size="sm" onClick={() => handleClearSection('communityCards')} disabled={communityCards.length === 0}><Trash2 className="h-4 w-4 mr-2"/>Clear</Button>
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
                        <CardTitle className="text-3xl">Result: {analysisResult.winner} Wins!</CardTitle>
                        <CardDescription>Based on the best 5-card hands available to each player.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Your Hand ({analysisResult.yourBestHand.handName})</h3>
                  <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {myHand.map(c => <PokerCard key={`res-my-${c}`} card={c} isHighlighted={analysisResult.yourBestHand.handCards.includes(c)} />)}
                  </div>

                  <h3 className="font-semibold text-lg">Opponent's Hand ({analysisResult.opponentBestHand.handName})</h3>
                   <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {opponentHand.map(c => <PokerCard key={`res-opp-${c}`} card={c} isHighlighted={analysisResult.opponentBestHand.handCards.includes(c)} isOpponent={true} />)}
                  </div>

                  <h3 className="font-semibold text-lg">Community Cards</h3>
                  <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {communityCards.map(c => <PokerCard key={`res-comm-${c}`} card={c} isHighlighted={analysisResult.yourBestHand.handCards.includes(c) || analysisResult.opponentBestHand.handCards.includes(c)} />)}
                  </div>
                </div>
                
                <Alert className="border-primary/30 bg-primary/5">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">AI Explanation</AlertTitle>
                  <AlertDescription className="prose prose-sm dark:prose-invert max-w-none">
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
