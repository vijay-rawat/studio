
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Edit3, Trash2, PlusCircle, BookOpenText, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GlobalAddTransactionDialog } from './global-add-transaction-dialog';
import { EditLedgerItemDialog } from './edit-ledger-item-dialog';
import { Badge } from '@/components/ui/badge';

interface FullLedgerViewProps {
  players: Player[];
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId: string, transactionId: string) => void;
  isSessionEnded: boolean;
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

  const handleOpenEditDialog = (player: Player, transaction: Transaction) => {
    setEditingLedgerItem({ player, transaction });
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  if (players.length === 0) {
    return (
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <BookOpenText className="mr-3 h-6 w-6 text-primary" />
            Full Game Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 text-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No players in the game.</p>
          <p className="text-sm text-muted-foreground/80">Add players in the 'Game View' tab to see their ledger here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-xl border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-2xl flex items-center">
                <BookOpenText className="mr-3 h-6 w-6 text-primary" />
                Full Game Ledger
            </CardTitle>
            <CardDescription>View all transactions, grouped by player. Expand a player to see their history.</CardDescription>
          </div>
          {!isSessionEnded && (
            <Button onClick={() => setIsAddTransactionDialogOpen(true)} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Entry
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {sortedPlayers.map((player) => {
              const sortedTransactions = [...player.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              const liveBalance = player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);

              return (
                <AccordionItem value={player.id} key={player.id}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors text-lg w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary/80" />
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="outline" className="font-normal text-xs px-1.5 py-0.5">
                          {sortedTransactions.length} txs
                        </Badge>
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-base",
                          liveBalance > 0 && "text-emerald-500",
                          liveBalance < 0 && "text-destructive",
                          liveBalance === 0 && "text-muted-foreground"
                        )}
                      >
                        {liveBalance.toFixed(2)} Rs.
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-muted/20">
                    {sortedTransactions.length === 0 ? (
                       <div className="px-6 py-8 text-center">
                        <p className="text-muted-foreground">No transactions recorded for {player.name}.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto p-2 sm:p-0">
                        <Table className="bg-card">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-4 sm:pl-6">Description</TableHead>
                              <TableHead className="text-right">Amount (Rs.)</TableHead>
                              <TableHead>Timestamp</TableHead>
                              <TableHead className="text-right pr-4 sm:pr-6 w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedTransactions.map((tx) => {
                              const arePlayerActionsDisabled = player.departureStatus !== 'active' || isSessionEnded;

                              return (
                              <TableRow key={tx.id} className={cn(arePlayerActionsDisabled && "opacity-70")}>
                                <TableCell className="font-medium pl-4 sm:pl-6">
                                  <div className="flex items-center gap-1.5">
                                    {tx.description}
                                  </div>
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "text-right font-semibold",
                                    tx.amount > 0 ? "text-emerald-500" : "text-destructive"
                                  )}
                                >
                                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(new Date(tx.timestamp), "MMM d, p")}
                                </TableCell>
                                <TableCell className="text-right pr-4 sm:pr-6">
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleOpenEditDialog(player, tx)}
                                      disabled={arePlayerActionsDisabled}
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
                                          disabled={arePlayerActionsDisabled}
                                          aria-label="Delete transaction"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this transaction for {player.name}: "{tx.description}" ({tx.amount} Rs.)? This cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => onDeleteTransaction(player.id, tx.id)}
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
                            )})}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {isAddTransactionDialogOpen && (
        <GlobalAddTransactionDialog
          isOpen={isAddTransactionDialogOpen}
          onClose={() => setIsAddTransactionDialogOpen(false)}
          players={players.filter(p => p.departureStatus === 'active')}
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
