
"use client";

import type * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Player, Transaction, GameSession } from '@/types';
import { AddPlayerForm } from '@/components/add-player-form';
import { PlayersTable } from '@/components/players-table';
import { SummaryDisplay } from '@/components/summary-display';
import { SessionEndedStatsDisplay } from '@/components/session-ended-stats-display';
import { SessionEndGraphDisplay } from '@/components/session-end-graph-display';
import { FullLedgerView } from '@/components/full-ledger-view';
import { HandAnalyzerView } from '@/components/hand-analyzer-view';
import { SessionHistoryView } from '@/components/session-history-view'; 
import { Users, CalendarOff, Trash2, Gamepad2, BookOpen, BrainCircuit, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_INITIAL_BALANCE = -400;

export default function PokerTrackerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<GameSession[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const storedSession = localStorage.getItem('pokerCurrentSession');
    const storedHistory = localStorage.getItem('pokerSessionHistory');
    
    if (storedSession) {
      const { players, isSessionEnded, startTime } = JSON.parse(storedSession);
      setPlayers(players);
      setIsSessionEnded(isSessionEnded);
      setSessionStartTime(startTime || new Date().toISOString());
    } else {
      setSessionStartTime(new Date().toISOString());
    }

    if (storedHistory) {
      setSessionHistory(JSON.parse(storedHistory));
    }
    
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  useEffect(() => {
    if(isClient) {
      const currentSessionState = {
        players,
        isSessionEnded,
        startTime: sessionStartTime,
      };
      localStorage.setItem('pokerCurrentSession', JSON.stringify(currentSessionState));
      localStorage.setItem('pokerSessionHistory', JSON.stringify(sessionHistory));
    }
  }, [players, isSessionEnded, sessionHistory, isClient, sessionStartTime]);
  
  const handleAddPlayer = (name: string) => {
    if (isSessionEnded) {
      toast({ title: "Session Ended", description: "Cannot add players after the session has ended.", variant: "destructive" });
      return;
    }
    const trimmedName = name.trim();
    const existingPlayer = players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingPlayer) {
      toast({
        title: "Duplicate Player Name",
        description: `A player named "${trimmedName}" already exists. Please use a different name.`,
        variant: "destructive",
      });
      return;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: trimmedName,
      initialBalance: DEFAULT_INITIAL_BALANCE,
      transactions: [],
      departureStatus: 'active',
    };
    setPlayers(prev => [...prev, newPlayer]);
    toast({ title: "Player Added", description: `${trimmedName} has been added to the game.` });
  };

  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };

  const handleUpdateInitialBalance = (playerId: string, newBalance: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, initialBalance: newBalance } : p));
  };

  const handleAddTransaction = (playerId: string, amount: number, description: string) => {
    if (isSessionEnded) {
      toast({ title: "Session Ended", description: "Cannot add bank transactions after the session has ended.", variant: "destructive" });
      return;
    }
    const targetPlayer = players.find(p => p.id === playerId);
    if (!targetPlayer) {
        toast({ title: "Error", description: "Player not found for transaction.", variant: "destructive"});
        return;
    }
     if (targetPlayer.departureStatus !== 'active') {
      toast({ title: "Player Finalized", description: `Cannot add bank transaction for ${targetPlayer.name} as they have already cashed out.`, variant: "destructive" });
      return;
    }
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount,
      description,
      timestamp: new Date().toISOString(),
    };
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, transactions: [...p.transactions, newTransaction] }
        : p
    ));
  };

  const handleEditTransaction = (playerId: string, transactionId: string, newAmount: number, newDescription: string) => {
    if (isSessionEnded) {
      toast({ title: "Session Ended", description: "Cannot edit transactions after the session has ended.", variant: "destructive" });
      return;
    }
     const targetPlayer = players.find(p => p.id === playerId);
     if (!targetPlayer) return;

    if (targetPlayer.departureStatus !== 'active') {
      toast({ title: "Player Finalized", description: `Cannot edit transaction for ${targetPlayer.name} as they have already cashed out.`, variant: "destructive" });
      return;
    }
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          transactions: p.transactions.map(tx =>
            tx.id === transactionId
              ? { ...tx, amount: newAmount, description: newDescription, timestamp: new Date().toISOString() }
              : tx
          ),
        };
      }
      return p;
    }));
  };

  const handleDeleteTransaction = (playerId: string, transactionId: string) => {
    if (isSessionEnded) {
       toast({ title: "Session Ended", description: "Cannot delete transactions after the session has ended.", variant: "destructive" });
      return;
    }
     const targetPlayer = players.find(p => p.id === playerId);
     if (!targetPlayer) return;

    if (targetPlayer.departureStatus !== 'active') {
      toast({ title: "Player Finalized", description: `Cannot delete transaction for ${targetPlayer.name} as they have already cashed out.`, variant: "destructive" });
      return;
    }
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, transactions: p.transactions.filter(tx => tx.id !== transactionId) }
        : p
    ));
  };

  const handleDeletePlayer = (playerId: string) => {
    const playerToDelete = players.find(p => p.id === playerId);
    if (playerToDelete) {
        setPlayers(prev => prev.filter(p => p.id !== playerId));
        toast({ title: "Player Removed", description: `${playerToDelete.name} has been removed.`, variant: "destructive" });
    }
  };

  const handleCashOutPlayer = (playerId: string, cashOutAmountInput: number, departureStatusInput: 'left_early' | 'stayed_till_end' | 'stayed_till_end_auto') => {
    const playerToCashOut = players.find(p => p.id === playerId);
    if (!playerToCashOut) return;

    if (isSessionEnded && departureStatusInput !== 'stayed_till_end_auto') {
      toast({ title: "Session Ended", description: "Cannot cash out players after the session has ended manually.", variant: "destructive" });
      return;
    }
    const playerName = playerToCashOut.name;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          cashedOutAmount: cashOutAmountInput,
          departureStatus: departureStatusInput === 'stayed_till_end_auto' ? 'stayed_till_end' : departureStatusInput,
          cashOutTimestamp: new Date().toISOString(),
        };
      }
      return p;
    }));

    if (departureStatusInput !== 'stayed_till_end_auto') {
        toast({ title: "Player Cashed Out", description: `${playerName} has cashed out.` });
    }
  };

  const handleEndSession = () => {
    let updatedPlayers = [...players];
    let playersAutoCashedOut = 0;

    updatedPlayers = updatedPlayers.map(p => {
      if (p.departureStatus === 'active') {
        playersAutoCashedOut++;
        const liveBalance = p.initialBalance + p.transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const effectiveCashOutAmount = Math.max(0, liveBalance);
        return {
          ...p,
          cashedOutAmount: effectiveCashOutAmount,
          departureStatus: 'stayed_till_end' as 'stayed_till_end',
          cashOutTimestamp: new Date().toISOString(),
        };
      }
      return p;
    });
    
    const finalSessionPlayers = [...updatedPlayers];

    const newSession: GameSession = {
      id: crypto.randomUUID(),
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      players: finalSessionPlayers,
    };
    setSessionHistory(prev => [newSession, ...prev]);

    setIsSessionEnded(true);
    setPlayers(finalSessionPlayers);

    toast({ title: "Session Ended & Archived", description: `Game session concluded and saved to history. ${playersAutoCashedOut} player(s) automatically cashed out.` });
  };


  const handleResetGame = () => {
    if (players.length > 0 && !isSessionEnded) {
       toast({ title: "Game Reset", description: "The active game state has been cleared.", variant: "destructive" });
    } else if (isSessionEnded) {
       toast({ title: "New Game Started", description: "The previous session's stats are visible. A new game has begun."});
    }

    setPlayers([]);
    setIsSessionEnded(false);
    setSessionStartTime(new Date().toISOString());
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-background">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-1/2 mx-auto" />
          <div className="p-6 border border-border rounded-lg shadow-xl">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/70 selection:text-primary-foreground">
      <header className="py-8 border-b border-border/60 bg-card/20 shadow-md">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <svg
              width="40"
              height="40"
              viewBox="-2 -5 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-primary translate-x-3 md:translate-x-0"
            >
              <g id="card-9c" transform="translate(0, 2) rotate(-8 15 22.5)">
                <rect x="0" y="0" width="30" height="45" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                <rect className="animated-card-border" x="0" y="0" width="30" height="45" rx="4"/>
                <text x="5" y="14" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">9</text>
                <text x="5" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fill="currentColor">♣</text>
              </g>
              <g id="card-10c" transform="translate(13, 0) rotate(8 15 22.5)">
                <rect x="0" y="0" width="30" height="45" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                <rect className="animated-card-border" x="0" y="0" width="30" height="45" rx="4"/>
                <text x="3.5" y="14" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" fontWeight="bold" fill="hsl(var(--foreground))">10</text>
                <text x="5" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="14" fill="currentColor">♣</text>
              </g>
            </svg>
            <h1 className="text-4xl md:text-5xl font-bold">
              Suncity <span className="text-primary">Poker</span> Ledger
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Effortlessly track player buy-ins, re-buys, and cash-outs. Default initial balance: {DEFAULT_INITIAL_BALANCE} Rs.
            {isSessionEnded && <span className="block mt-1 font-semibold text-accent">(Session Ended)</span>}
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="game-view" className="w-full">
          <TabsList className="inline-flex h-auto flex-wrap items-center justify-center rounded-full bg-muted/50 p-1.5 mb-8 shadow-sm ring-1 ring-border/30">
            <TabsTrigger
              value="game-view"
              className="px-4 md:px-6 py-2 text-sm font-medium text-muted-foreground rounded-full transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:text-foreground focus-visible:text-foreground"
            >
              <Gamepad2 className="mr-2 h-5 w-5" /> Game View
            </TabsTrigger>
            <TabsTrigger
              value="full-ledger"
              className="px-4 md:px-6 py-2 text-sm font-medium text-muted-foreground rounded-full transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:text-foreground focus-visible:text-foreground"
            >
              <BookOpen className="mr-2 h-5 w-5" /> Full Ledger
            </TabsTrigger>
             <TabsTrigger
              value="session-history"
              className="px-4 md:px-6 py-2 text-sm font-medium text-muted-foreground rounded-full transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:text-foreground focus-visible:text-foreground"
            >
              <History className="mr-2 h-5 w-5" /> Session History
            </TabsTrigger>
            <TabsTrigger
              value="hand-analyzer"
              className="px-4 md:px-6 py-2 text-sm font-medium text-muted-foreground rounded-full transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:text-foreground focus-visible:text-foreground"
            >
              <BrainCircuit className="mr-2 h-5 w-5" /> Hand Analyzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game-view">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                
                {!isSessionEnded && <AddPlayerForm onAddPlayer={handleAddPlayer} isSessionEnded={isSessionEnded} />}

                {players.length > 0 && (
                  <div className="mt-6 flex justify-end gap-2">
                     {!isSessionEnded && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-accent/70 text-accent hover:bg-accent/10 hover:text-accent">
                            <CalendarOff className="mr-2 h-4 w-4" /> End Game Session
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>End Game Session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will finalize the game and archive it to history. Any active players will be automatically cashed out.
                              You won't be able to add new players or transactions after this. Are you sure?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleEndSession} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                              Yes, End & Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                     )}
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" /> {isSessionEnded ? "Start New Game" : "Reset Current Game"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {isSessionEnded 
                              ? "This will clear the table and start a new game. The session you just finished is already saved in history."
                              : "This action cannot be undone. All current unsaved player data will be permanently cleared."
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetGame} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            {isSessionEnded ? "Yes, Start New Game" : "Yes, Reset Game"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {(players.length > 0 || isSessionEnded) ? (
                  !isSessionEnded && <PlayersTable
                    players={players}
                    onUpdatePlayerName={handleUpdatePlayerName}
                    onUpdateInitialBalance={handleUpdateInitialBalance}
                    onAddTransaction={handleAddTransaction}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onDeletePlayer={handleDeletePlayer}
                    onCashOutPlayer={handleCashOutPlayer}
                    isSessionEnded={isSessionEnded}
                  />
                ) : (
                  <Card className="mt-8 shadow-xl border-border/50">
                    <CardContent className="p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                      <Users className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
                      <p className="text-2xl font-semibold text-muted-foreground mb-2">No Players Yet</p>
                      <p className="text-sm text-muted-foreground/80">Use the form above to add players and start tracking balances.</p>
                    </CardContent>
                  </Card>
                )}
                
              </div>

              <aside className="lg:col-span-4 lg:sticky lg:top-8">
                {players.length > 0 && <SummaryDisplay players={players} isSessionEnded={isSessionEnded} />}
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="full-ledger">
            <FullLedgerView
              players={players}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              isSessionEnded={isSessionEnded}
            />
          </TabsContent>
          
          <TabsContent value="session-history">
            <SessionHistoryView sessions={sessionHistory} />
          </TabsContent>

          <TabsContent value="hand-analyzer">
            <HandAnalyzerView />
          </TabsContent>

        </Tabs>
      </main>
      <footer className="text-center mt-12 py-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground">&copy; {currentYear} Suncity Poker Ledger. Gamble responsibly.</p>
      </footer>
    </div>
  );
}
