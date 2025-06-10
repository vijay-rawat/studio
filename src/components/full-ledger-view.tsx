
"use client";

import type * as React from 'react';
import { useState, useMemo } from 'react';
import type { Player, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit3, Trash2, PlusCircle, BookOpenText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GlobalAddTransactionDialog } from './global-add-transaction-dialog';
import { EditLedgerItemDialog } from './edit-ledger-item-dialog';

interface FullLedgerViewProps {
  players: Player[];
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId: string, transactionId: string) => void;
  isSessionEnded: boolean;
}

interface LedgerEntry extends Transaction {
  playerId: string;
  playerName: string;
}

export function FullLedgerView({
  players,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  isSessionEnded,
}: FullLedgerViewProps) {
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);
  const [editingLedgerItem, setEditingLedgerItem] = useState<{ player: Player; transaction: Transaction } | null>(null);

  const allTransactions: LedgerEntry[] = useMemo(() => {
    const ledger: LedgerEntry[] = [];
    players.forEach(player => {
      player.transactions.forEach(tx => {
        ledger.push({
          ...tx,
          playerId: player.id,
          playerName: player.name,
        });
      });
    });
    // Sort by timestamp, newest first
    return ledger.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [players]);

  const handleOpenEditDialog = (entry: LedgerEntry) => {
    const player = players.find(p => p.id === entry.playerId);
    if (player) {
      setEditingLedgerItem({ player, transaction: entry });
    }
  };

  return (
    <>
      <Card className="shadow-xl border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center">
                <BookOpenText className="mr-3 h-6 w-6 text-primary" />
                Full Game Ledger
            </CardTitle>
            <CardDescription>A chronological record of all transactions across all players.</CardDescription>
          </div>
          {!isSessionEnded && (
            <Button onClick={() => setIsAddTransactionDialogOpen(true)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {allTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground">No transactions recorded in the game yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount (Rs.)</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((entry) => {
                    const player = players.find(p => p.id === entry.playerId);
                    const isPlayerFinalized = player?.departureStatus !== 'active' || isSessionEnded;

                    return (
                      <TableRow key={entry.id} className={cn(isPlayerFinalized && "opacity-70")}>
                        <TableCell className="font-medium">{entry.playerName}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            entry.amount > 0 ? "text-emerald-500" : "text-destructive"
                          )}
                        >
                          {entry.amount > 0 ? '+' : ''}{entry.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(entry.timestamp), "MMM d, yyyy, p")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenEditDialog(entry)}
                              disabled={isPlayerFinalized && player?.departureStatus !== 'active'} // Allow edit only if player active or not session ended
                              aria-label="Edit transaction"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={isPlayerFinalized && player?.departureStatus !== 'active'}
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this transaction for {entry.playerName}: "{entry.description}" ({entry.amount} Rs.)? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteTransaction(entry.playerId, entry.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAddTransactionDialogOpen && (
        <GlobalAddTransactionDialog
          isOpen={isAddTransactionDialogOpen}
          onClose={() => setIsAddTransactionDialogOpen(false)}
          players={players.filter(p => p.departureStatus === 'active')} // Only allow adding to active players
          onAddTransaction={onAddTransaction}
          isSessionEnded={isSessionEnded}
        />
      )}

      {editingLedgerItem && (
        <EditLedgerItemDialog
          isOpen={!!editingLedgerItem}
          onClose={() => setEditingLedgerItem(null)}
          player={editingLedgerItem.player}
          transaction={editingLedgerItem.transaction}
          onEditTransaction={onEditTransaction}
          isSessionEnded={isSessionEnded}
        />
      )}
    </>
  );
}

    