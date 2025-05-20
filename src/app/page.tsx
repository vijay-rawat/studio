
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, Transaction } from '@/types';
import { AddPlayerForm } from '@/components/add-player-form';
import { PlayerCard } from '@/components/player-card';
import { SummaryDisplay } from '@/components/summary-display';
import { PiggyBank, Users, Landmark, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useToast } from "@/hooks/use-toast";


const DEFAULT_INITIAL_BALANCE = -400;

export default function PokerTrackerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const storedPlayers = localStorage.getItem('pokerPlayersSuncity');
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem('pokerPlayersSuncity', JSON.stringify(players));
    }
  }, [players, isClient]);

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      initialBalance: DEFAULT_INITIAL_BALANCE,
      transactions: [],
      departureStatus: 'active',
    };
    setPlayers(prev => [...prev, newPlayer]);
    toast({ title: "Player Added", description: `${name} has been added to the game.` });
  };

  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p));
  };

  const handleUpdateInitialBalance = (playerId: string, newBalance: number) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, initialBalance: newBalance } : p));
  };

  const handleAddTransaction = (playerId: string, amount: number, description: string) => {
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
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, transactions: p.transactions.filter(tx => tx.id !== transactionId) } 
        : p
    ));
    toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
  };

  const handleDeletePlayer = (playerId: string) => {
    const playerToDelete = players.find(p => p.id === playerId);
    if (playerToDelete) {
        setPlayers(prev => prev.filter(p => p.id !== playerId));
        toast({ title: "Player Removed", description: `${playerToDelete.name} has been removed.`, variant: "destructive" });
    }
  };

 const handleCashOutPlayer = (playerId: string, cashOutAmountInput: number, departureStatusInput: 'left_early' | 'stayed_till_end') => {
    const playerToCashOut = players.find(p => p.id === playerId);
    if (!playerToCashOut) return;

    const playerName = playerToCashOut.name;
    
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          cashOutAmount: cashOutAmountInput,
          departureStatus: departureStatusInput,
          cashOutTimestamp: new Date().toISOString(),
        };
      }
      return p;
    }));
    toast({ title: "Player Cashed Out", description: `${playerName} has cashed out.` });
  };


  const handleResetGame = () => {
    setPlayers([]);
    toast({ title: "Game Reset", description: "All player data has been cleared.", variant: "destructive" });
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
            <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Suncity <span className="text-primary">Poker</span> Ledger
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Effortlessly track player buy-ins, re-buys, and cash-outs. Default initial balance: {DEFAULT_INITIAL_BALANCE} Rs.
          </p>
        </div>
      </header>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8 px-4 md:px-0">
        <div className="lg:col-span-8 space-y-8">
          <AddPlayerForm onAddPlayer={handleAddPlayer} />
          
          {players.length > 0 && (
            <div className="mt-6 text-right">
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" /> Reset Game
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all players and their transactions, resetting the game.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetGame} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Yes, Reset Game
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {players.length === 0 ? (
            <Card className="mt-8 shadow-xl border-border/50">
              <CardContent className="p-10 text-center flex flex-col items-center justify-center min-h-[200px]">
                <Users className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
                <p className="text-2xl font-semibold text-muted-foreground mb-2">No Players Yet</p>
                <p className="text-sm text-muted-foreground/80">Use the form above to add players and start tracking balances.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {players.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onUpdatePlayerName={handleUpdatePlayerName}
                  onUpdateInitialBalance={handleUpdateInitialBalance}
                  onAddTransaction={handleAddTransaction}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  onDeletePlayer={handleDeletePlayer}
                  onCashOutPlayer={handleCashOutPlayer}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 lg:sticky lg:top-8">
          {players.length > 0 && <SummaryDisplay players={players} />}
        </aside>
      </main>
      <footer className="text-center mt-12 py-8 border-t border-border/50">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Suncity Poker Ledger. Gamble responsibly.</p>
      </footer>
    </div>
  );
}
