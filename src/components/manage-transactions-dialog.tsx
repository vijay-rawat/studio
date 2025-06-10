
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertDialogTxFooter, AlertDialogHeader as AlertDialogTxHeader, AlertDialogTitle as AlertDialogTxTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PlusCircle, Edit3, Trash2, Coins, FilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManageTransactionsDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId: string, transactionId: string) => void;
  isActionsDisabled: boolean;
}

export function ManageTransactionsDialog({
  player,
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  isActionsDisabled,
}: ManageTransactionsDialogProps) {
  const { toast } = useToast();
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDescription, setEditTxDescription] = useState('');

  // Sort transactions by timestamp, newest first
  const sortedTransactions = player.transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  useEffect(() => {
    if (!isOpen) {
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      setEditingTransaction(null); // Close edit sub-dialog if main dialog closes
    }
  }, [isOpen]);

  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionsDisabled) return;
    const amount = parseFloat(newTransactionAmount);
    if (isNaN(amount)) {
      toast({ title: "Error", description: "Invalid transaction amount.", variant: "destructive" });
      return;
    }
    if (!newTransactionDescription.trim()) {
      toast({ title: "Error", description: "Transaction description cannot be empty.", variant: "destructive" });
      return;
    }
    onAddTransaction(player.id, amount, newTransactionDescription.trim());
    setNewTransactionAmount('');
    setNewTransactionDescription('');
    toast({ title: "Transaction Added", description: `Added '${newTransactionDescription.trim()}' for ${amount} Rs.` });
  };

  const openEditModal = (tx: Transaction) => {
    if (isActionsDisabled) return;
    setEditingTransaction(tx);
    setEditTxAmount(tx.amount.toString());
    setEditTxDescription(tx.description);
  };

  const handleEditTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || isActionsDisabled) return;
    const amount = parseFloat(editTxAmount);
    if (isNaN(amount)) {
      toast({ title: "Error", description: "Invalid transaction amount for edit.", variant: "destructive" });
      return;
    }
    if (!editTxDescription.trim()) {
      toast({ title: "Error", description: "Transaction description cannot be empty for edit.", variant: "destructive" });
      return;
    }
    onEditTransaction(player.id, editingTransaction.id, amount, editTxDescription.trim());
    setEditingTransaction(null); // Close the sub-dialog
    toast({ title: "Transaction Updated", description: "Transaction details saved." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Manage Transactions for {player.name}
          </DialogTitle>
          <DialogDescription>
            View, add, edit, or delete transactions for this player.
            {isActionsDisabled && " (Actions disabled - player/session finalized)"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div>
            <h4 className="font-semibold mb-2 text-base text-foreground/90">Transaction History:</h4>
            {sortedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions recorded.</p>
            ) : (
              <ScrollArea className="h-[200px] pr-3 -mr-3 border rounded-md p-2">
                <ul className="space-y-2">
                  {sortedTransactions.map((tx) => (
                    <li key={tx.id} className="text-sm flex justify-between items-center p-2.5 rounded-md border-border/30 bg-card hover:bg-muted/30 transition-colors group">
                      <div>
                        <span className="font-medium text-foreground/90">{tx.description}</span>
                        <p className={`text-xs ${tx.amount < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount} Rs.</p>
                        <p className="text-xs text-muted-foreground/70 pt-0.5">{format(new Date(tx.timestamp), "MMM d, p")}</p>
                      </div>
                      {!isActionsDisabled && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(tx)} aria-label="Edit transaction" className="h-7 w-7 text-muted-foreground hover:text-primary">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" aria-label="Delete transaction">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTxHeader>
                                <AlertDialogTxTitle>Delete Transaction?</AlertDialogTxTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete transaction: {tx.description} ({tx.amount} Rs.)? This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogTxHeader>
                              <AlertDialogTxFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteTransaction(player.id, tx.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogTxFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>

          {!isActionsDisabled && (
            <>
              <Separator className="my-4 bg-border/40" />
              <form onSubmit={handleAddTransactionSubmit} className="space-y-3">
                <h5 className="font-semibold text-sm text-foreground/90 flex items-center">
                  <FilePlus className="h-4 w-4 mr-2 text-primary" />
                  Add New Transaction
                </h5>
                <div>
                  <Label htmlFor={`mng-tx-desc-${player.id}`} className="text-xs font-medium text-muted-foreground">Description</Label>
                  <Input
                    id={`mng-tx-desc-${player.id}`}
                    type="text"
                    value={newTransactionDescription}
                    onChange={(e) => setNewTransactionDescription(e.target.value)}
                    placeholder="e.g., Re-buy, Drinks"
                    required
                    className="mt-1 h-9 bg-input text-sm"
                    disabled={isActionsDisabled}
                  />
                </div>
                <div>
                  <Label htmlFor={`mng-tx-amount-${player.id}`} className="text-xs font-medium text-muted-foreground">Amount (Rs.)</Label>
                  <Input
                    id={`mng-tx-amount-${player.id}`}
                    type="number"
                    step="any"
                    value={newTransactionAmount}
                    onChange={(e) => setNewTransactionAmount(e.target.value)}
                    placeholder="e.g., 50 or -100"
                    required
                    className="mt-1 h-9 bg-input text-sm"
                    disabled={isActionsDisabled}
                  />
                   <p className="text-xs text-muted-foreground/70 mt-1">Positive if player gives to bank, negative if player takes from bank.</p>
                </div>
                <Button type="submit" size="sm" className="w-full" disabled={isActionsDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </form>
            </>
          )}
           {isActionsDisabled && player.transactions.length > 0 && (
            <p className="text-sm text-center text-muted-foreground mt-4">Transaction management is disabled as the player/session is finalized.</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {/* Edit Transaction Sub-Dialog */}
      {editingTransaction && !isActionsDisabled && (
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="sm:max-w-xs"> {/* Smaller dialog for editing a single transaction */}
            <DialogHeader>
              <DialogTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Edit Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTransactionSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-tx-desc-modal" className="text-sm">Description</Label>
                <Input
                  id="edit-tx-desc-modal"
                  type="text"
                  value={editTxDescription}
                  onChange={(e) => setEditTxDescription(e.target.value)}
                  required
                  className="mt-1 bg-input"
                  disabled={isActionsDisabled}
                />
              </div>
              <div>
                <Label htmlFor="edit-tx-amount-modal" className="text-sm">Amount (Rs.)</Label>
                <Input
                  id="edit-tx-amount-modal"
                  type="number"
                  step="any"
                  value={editTxAmount}
                  onChange={(e) => setEditTxAmount(e.target.value)}
                  required
                  className="mt-1 bg-input"
                  disabled={isActionsDisabled}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                <Button type="submit" disabled={isActionsDisabled}>Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
