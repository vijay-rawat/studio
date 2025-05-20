
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, Transaction } from '@/types';
import { AddPlayerForm } from '@/components/add-player-form';
import { PlayerCard } from '@/components/player-card';
import { SummaryDisplay } from '@/components/summary-display';
import { PiggyBank, Users, Landmark, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    // Load players from local storage
    const storedPlayers = localStorage.getItem('pokerPlayers');
    if (storedPlayers) {
      setPlayers(JSON.parse(storedPlayers));
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem('pokerPlayers', JSON.stringify(players));
    }
  }, [players, isClient]);

  const handleAddPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      initialBalance: DEFAULT_INITIAL_BALANCE,
      transactions: [],
      departureStatus: 'active', // Initialize departure status
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
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    toast({ title: "Player Deleted", description: "The player has been removed from the game.", variant: "destructive" });
  };

  const handleCashOutPlayer = (playerId: string, cashOutAmount: number, departureStatus: 'left_early' | 'stayed_till_end') => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const playerName = p.name;
        toast({ title: "Player Cashed Out", description: `${playerName} has cashed out.` });
        return {
          ...p,
          cashedOutAmount,
          departureStatus,
          cashOutTimestamp: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  const handleResetGame = () => {
    setPlayers([]);
    toast({ title: "Game Reset", description: "All player data has been cleared.", variant: "destructive" });
  }

  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-gradient-to-br from-background to-secondary/30">
        <Landmark className="h-16 w-16 text-primary mb-4 animate-pulse" />
        <p className="text-xl text-foreground animate-pulse">Loading Poker Balances...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8 px-4 md:px-8">
      <header className="text-center mb-10">
        <div className="inline-flex items-center bg-card p-4 rounded-lg shadow-xl">
          <PiggyBank className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold ml-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Poker Balance Tracker
          </h1>
        </div>
         <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl mx-auto">
          Track player buy-ins, re-buys, and cash-outs. Default initial balance is {DEFAULT_INITIAL_BALANCE} Rs. (taken from bank).
        </p>
      </header>

      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <AddPlayerForm onAddPlayer={handleAddPlayer} />
          
          {players.length > 0 && (
            <div className="mt-6 text-right">
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
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
                    <AlertDialogAction onClick={handleResetGame} className="bg-destructive hover:bg-destructive/90">
                      Yes, Reset Game
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {players.length === 0 ? (
            <Card className="mt-8 shadow-lg">
              <CardContent className="p-10 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No players yet.</p>
                <p className="text-sm text-muted-foreground">Add players using the form above to start tracking balances.</p>
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

        <aside className="lg:col-span-1">
          {players.length > 0 && <SummaryDisplay players={players} />}
        </aside>
      </main>
      <footer className="text-center mt-12 py-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Poker Balance Tracker. May your bluffs be believed.</p>
      </footer>
    </div>
  );
}
