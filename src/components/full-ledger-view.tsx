
"use client";

import type * as React from 'react';
import { useState, useMemo } from 'react';
import type { Player, Transaction, TransactionState } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Edit3, Trash2, PlusCircle, BookOpenText, User, Users, Undo2, History, CheckCircle, Pencil, XCircle } from 'lucide-react';
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

const ActionIcon = ({ action }: { action: Transaction['action'] }) => {
  switch (action) {
    case 'created':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'edited':
      return <Pencil className="h-4 w-4 text-amber-500" />;
    case 'deleted':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

const TransactionHistory = ({ tx }: { tx: Transaction }) => {
  const allStates: (TransactionState & { isCurrent: boolean })[] = [
    ...tx.previousStates.map(s => ({ ...s, isCurrent: false })),
  ];
  if (tx.action !== 'deleted') {
      allStates.push({
        amount: tx.amount,
        description: tx.description,
        timestamp: tx.timestamp,
        isCurrent: true,
      });
  }

  const sortedStates = allStates.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="pl-6 pr-2 py-2 space-y-3 bg-muted/40 border-l-2 border-primary/20">
      {sortedStates.map((state, index) => (
        <div key={index} className="text-xs relative">
          <div className={cn("flex items-start justify-between", state.isCurrent && "font-semibold")}>
            <div className="flex-1">
              <p className="text-muted-foreground">{format(new Date(state.timestamp), "MMM d, p")}</p>
              <p className="text-foreground">{state.description}</p>
            </div>
            <p className={cn("font-mono", state.amount > 0 ? "text-emerald-600" : "text-destructive")}>
              {state.amount > 0 ? '+' : ''}{state.amount.toFixed(2)} Rs.
            </p>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-1 pl-1">
        Initial creation on {format(new Date(tx.previousStates[0]?.timestamp || tx.timestamp), "MMM d, p")}
      </p>
    </div>
  );
};


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
            <CardDescription>A complete log of all transactions. Expand a transaction to see its full history.</CardDescription>
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
              const liveBalance = player.initialBalance + player.transactions.filter(t => t.action !== 'deleted').reduce((sum, tx) => sum + tx.amount, 0);

              return (
                <AccordionItem value={player.id} key={player.id}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors text-lg w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-primary/80" />
                        <span className="font-medium">{player.name}</span>
                        <Badge variant="outline" className="font-normal text-xs px-1.5 py-0.5">
                          {sortedTransactions.length} total records
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
                  <AccordionContent className="bg-muted/20 p-0">
                    {sortedTransactions.length === 0 ? (
                       <div className="px-6 py-8 text-center">
                        <p className="text-muted-foreground">No transactions recorded for {player.name}.</p>
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full bg-card">
                         {sortedTransactions.map((tx) => {
                           const arePlayerActionsDisabled = player.departureStatus !== 'active' || isSessionEnded;
                           const isDeleted = tx.action === 'deleted';

                           return (
                             <AccordionItem value={tx.id} key={tx.id} className="border-b last:border-b-0">
                              <div className={cn("flex justify-between items-center w-full text-sm", isDeleted && "opacity-50 bg-destructive/5 hover:bg-destructive/10")}>
                                <AccordionTrigger className="px-4 py-3 hover:no-underline flex-1">
                                  <div className="flex items-center gap-3 text-left">
                                      <ActionIcon action={tx.action} />
                                      <div>
                                          <p className={cn("font-medium", isDeleted && "line-through")}>{tx.description}</p>
                                          <p className="text-xs text-muted-foreground">Last action: {format(new Date(tx.timestamp), "MMM d, p")}</p>
                                      </div>
                                  </div>
                                </AccordionTrigger>
                                <div className="flex items-center gap-4 px-4">
                                  <span className={cn(
                                      "font-semibold",
                                      tx.amount > 0 && !isDeleted ? "text-emerald-500" : "",
                                      tx.amount < 0 && !isDeleted ? "text-destructive" : "",
                                      isDeleted && "text-muted-foreground"
                                  )}>
                                      {isDeleted ? 'Deleted' : `${tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)} Rs.`}
                                  </span>
                                  {!isDeleted && (
                                    <div className="flex gap-1 justify-end">
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(player, tx); }}
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
                                            onClick={(e) => e.stopPropagation()}
                                            >
                                            <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this transaction for {player.name}: "{tx.description}"? This action will be logged and cannot be fully undone.
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
                                  )}
                                </div>
                              </div>
                               <AccordionContent>
                                 <TransactionHistory tx={tx} />
                               </AccordionContent>
                             </AccordionItem>
                           );
                         })}
                      </Accordion>
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
