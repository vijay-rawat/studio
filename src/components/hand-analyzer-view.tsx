
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Lightbulb, AlertTriangle, PartyPopper, Scale } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { analyzePokerHand, type AnalyzePokerHandInput, type AnalyzePokerHandOutput } from '@/ai/flows/analyze-poker-hand-flow';
import { cn } from '@/lib/utils';


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
  const [myHand, setMyHand] = useState('');
  const [opponentHand, setOpponentHand] = useState('');
  const [communityCards, setCommunityCards] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePokerHandOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const parseCards = (cardString: string): string[] => {
    return cardString.trim().toUpperCase().split(/[\s,]+/).filter(c => c.length >= 2);
  };

  const validateAndFormatCards = (input: string, requiredCount?: number): string[] | null => {
    const cards = parseCards(input);
    if (requiredCount && cards.length !== requiredCount) return null;
    const validCardRegex = /^(?:[2-9TJQKA])([SDHC])$/;
    const seenCards = new Set();

    for (const card of cards) {
      if (!validCardRegex.test(card)) return null;
      if (seenCards.has(card)) return null; // Duplicate card check
      seenCards.add(card);
    }
    return cards;
  };

  const allEnteredCards = useMemo(() => {
    const all = [
      ...parseCards(myHand),
      ...parseCards(opponentHand),
      ...parseCards(communityCards),
    ];
    const uniqueCards = new Set(all);
    return { hasDuplicates: all.length !== uniqueCards.size, duplicates: all.filter((c, i) => all.indexOf(c) !== i) };
  }, [myHand, opponentHand, communityCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnalysisResult(null);

    const myHandCards = validateAndFormatCards(myHand, 2);
    if (!myHandCards) {
      toast({ title: "Invalid Input", description: "Your hand must contain exactly 2 valid, unique cards (e.g., AS KH).", variant: "destructive" });
      return;
    }

    const opponentHandCards = validateAndFormatCards(opponentHand, 2);
    if (!opponentHandCards) {
      toast({ title: "Invalid Input", description: "Opponent's hand must contain exactly 2 valid, unique cards.", variant: "destructive" });
      return;
    }

    const communityBoardCards = validateAndFormatCards(communityCards);
    if (!communityBoardCards || communityBoardCards.length < 3 || communityBoardCards.length > 5) {
      toast({ title: "Invalid Input", description: "Community cards must contain 3 to 5 valid, unique cards.", variant: "destructive" });
      return;
    }
    
    if (allEnteredCards.hasDuplicates) {
      toast({ title: "Duplicate Cards Found", description: `Each card can only appear once. Duplicates: ${allEnteredCards.duplicates.join(', ')}`, variant: "destructive" });
      return;
    }

    const input: AnalyzePokerHandInput = {
      myHand: myHandCards,
      opponentHand: opponentHandCards,
      communityCards: communityBoardCards,
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

  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl">AI Hand Analyzer</CardTitle>
              <CardDescription>Enter hands and board cards to see who wins and why. Use format 'AS' for Ace of Spades, 'TD' for 10 of Diamonds, etc.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-4">
               <Input placeholder="Your Hand (e.g., AH KD)" value={myHand} onChange={e => setMyHand(e.target.value)} disabled={isLoading} />
               <Input placeholder="Opponent's Hand (e.g., 7C 8C)" value={opponentHand} onChange={e => setOpponentHand(e.target.value)} disabled={isLoading} />
               <Input placeholder="Community Cards (e.g., 9C TC JC QS 2D)" value={communityCards} onChange={e => setCommunityCards(e.target.value)} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full md:w-auto justify-self-end text-base py-3" disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Hands'}
            </Button>
          </form>
          {allEnteredCards.hasDuplicates && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Duplicate Card Warning</AlertTitle>
              <AlertDescription>The card(s) '{allEnteredCards.duplicates.join(', ')}' are entered more than once.</AlertDescription>
            </Alert>
          )}
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
                    {parseCards(myHand).map(c => <PokerCard key={c} card={c} isHighlighted={analysisResult.yourBestHand.handCards.includes(c)} />)}
                  </div>

                  <h3 className="font-semibold text-lg">Opponent's Hand ({analysisResult.opponentBestHand.handName})</h3>
                   <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {parseCards(opponentHand).map(c => <PokerCard key={c} card={c} isHighlighted={analysisResult.opponentBestHand.handCards.includes(c)} isOpponent={true} />)}
                  </div>

                  <h3 className="font-semibold text-lg">Community Cards</h3>
                  <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg">
                    {parseCards(communityCards).map(c => <PokerCard key={c} card={c} isHighlighted={analysisResult.yourBestHand.handCards.includes(c) || analysisResult.opponentBestHand.handCards.includes(c)} />)}
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
