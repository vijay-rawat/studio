
"use client";

import type * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PlusCircle, Edit3, Trash2, Coins, FilePlus, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ManageTransactionsDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (playerId: string, amount: number, description: string) => void; // For bank transactions
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId: string, transactionId: string) => void;
  isActionsDisabled: boolean; // True if player cashed out or session ended
}

const TRANSACTIONS_PER_PAGE = 5;

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

  const [currentPage, setCurrentPage] = useState(1);

  const sortedTransactions = useMemo(() => {
    if (!player || !player.transactions) return [];
    return [...player.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [player]);

  useEffect(() => {
    if (!isOpen) {
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      setEditingTransaction(null);
      setCurrentPage(1);
    } else {
       setCurrentPage(1);
    }
  }, [isOpen, player?.id]); 

  const indexOfLastTransaction = currentPage * TRANSACTIONS_PER_PAGE;
  const indexOfFirstTransaction = indexOfLastTransaction - TRANSACTIONS_PER_PAGE;
  const currentTransactions = sortedTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(sortedTransactions.length / TRANSACTIONS_PER_PAGE);

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
    onAddTransaction(player.id, amount, newTransactionDescription.trim()); // This is for BANK transactions
    setNewTransactionAmount('');
    setNewTransactionDescription('');
    toast({ title: "Bank Transaction Added", description: `Added '${newTransactionDescription.trim()}' for ${amount} Rs.` });
    setCurrentPage(1); 
  };

  const handleQuickRebuy = () => {
    if (isActionsDisabled) return;
    onAddTransaction(player.id, -400, "Re-buy (Player takes 400)"); // Bank transaction
    toast({ title: "Re-buy Added", description: `Added Re-buy for ${player.name} (Player takes 400 Rs).` });
    setCurrentPage(1); 
  };

  const openEditModal = (tx: Transaction) => {
    if (isActionsDisabled || (tx.transactionType && tx.transactionType !== 'bank')) {
       toast({ title: "Cannot Edit", description: "This transaction type cannot be edited.", variant: "destructive"});
      return;
    }
    setEditingTransaction(tx);
    setEditTxAmount(tx.amount.toString());
    setEditTxDescription(tx.description);
  };

  const handleEditTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || isActionsDisabled || (editingTransaction.transactionType && editingTransaction.transactionType !== 'bank')) return;
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
    setEditingTransaction(null); 
    toast({ title: "Transaction Updated", description: "Transaction details saved." });
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Manage Transactions for {player.name}
          </DialogTitle>
          <DialogDescription>
            View, add (bank), edit (bank), or delete (bank) transactions. P2P transfers are immutable here.
            {isActionsDisabled && " (Actions disabled - player/session finalized)"}
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider>
        <div className="flex-grow flex flex-col py-4 space-y-4 overflow-y-auto pr-2">
          
          <div className="space-y-3">
            <h4 className="font-semibold text-base text-foreground/90">Transaction History:</h4>
            {sortedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions recorded.</p>
            ) : currentTransactions.length === 0 && sortedTransactions.length > 0 ? (
               <p className="text-sm text-muted-foreground py-4 text-center">No transactions on this page.</p>
            ) : (
              <ul className="space-y-2 min-h-[100px]"> 
                {currentTransactions.map((tx) => {
                  const isP2P = tx.transactionType && tx.transactionType !== 'bank';
                  const p2pTooltip = isP2P ? (tx.transactionType === 'player_to_player_send' ? `Sent to ${tx.relatedPlayerName}` : `Received from ${tx.relatedPlayerName}`) : "Bank Transaction";
                  const canEditOrDelete = !isActionsDisabled && !isP2P;

                  return (
                  <li key={tx.id} className="text-sm flex justify-between items-center p-2.5 rounded-md border bg-card hover:bg-muted/30 transition-colors group">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground/90">{tx.description}</span>
                        {isP2P && (
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>{p2pTooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <p className={`text-xs ${tx.amount < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} Rs.</p>
                      <p className="text-xs text-muted-foreground/70 pt-0.5">{format(new Date(tx.timestamp), "MMM d, p")}</p>
                    </div>
                    {!isActionsDisabled && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(tx)} aria-label="Edit transaction" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={!canEditOrDelete}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" aria-label="Delete transaction" disabled={!canEditOrDelete}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTxHeader>
                              <AlertDialogTxTitle>Delete Transaction?</AlertDialogTxTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete bank transaction: {tx.description} ({tx.amount.toFixed(2)} Rs.)? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogTxHeader>
                            <AlertDialogTxFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => {
                                onDeleteTransaction(player.id, tx.id);
                                if (currentTransactions.length === 1 && currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogTxFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </li>
                )})}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 pt-2">
              <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {!isActionsDisabled && (
            <>
              <Separator className="my-2 bg-border/40" />
               <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleQuickRebuy}
                disabled={isActionsDisabled}
              >
                <Coins className="mr-2 h-4 w-4" /> Quick Re-buy (Player takes 400 from Bank)
              </Button>
              <form onSubmit={handleAddTransactionSubmit} className="space-y-3 pt-2">
                <h5 className="font-semibold text-sm text-foreground/90 flex items-center">
                  <FilePlus className="h-4 w-4 mr-2 text-primary" />
                  Add Bank Transaction
                </h5>
                <div>
                  <Label htmlFor={`mng-tx-desc-${player.id}`} className="text-xs font-medium text-muted-foreground">Description</Label>
                  <Input
                    id={`mng-tx-desc-${player.id}`}
                    type="text"
                    value={newTransactionDescription}
                    onChange={(e) => setNewTransactionDescription(e.target.value)}
                    placeholder="e.g., Chips purchase, Drinks"
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Transaction
                </Button>
              </form>
            </>
          )}
           {isActionsDisabled && player.transactions.length > 0 && (
            <p className="text-sm text-center text-muted-foreground mt-4">Transaction management is disabled as the player/session is finalized.</p>
          )}
        </div>
        </TooltipProvider>
        <DialogFooter className="mt-auto pt-4 border-t border-border/30">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>

      {editingTransaction && !isActionsDisabled && editingTransaction.transactionType === 'bank' && (
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="sm:max-w-xs"> 
            <DialogHeader>
              <DialogTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Edit Bank Transaction</DialogTitle>
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
