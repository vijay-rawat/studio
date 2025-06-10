
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
import { useToast } from '@/hooks/use-toast';
import { Edit3 } from 'lucide-react'; // Removed AlertTriangle

interface EditLedgerItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  transaction: Transaction;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  isSessionEnded: boolean;
}

export function EditLedgerItemDialog({
  isOpen,
  onClose,
  player,
  transaction,
  onEditTransaction,
  isSessionEnded,
}: EditLedgerItemDialogProps) {
  const { toast } = useToast();
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Simplified: All editable transactions are considered "bank" or general transactions
  const isActionsDisabled = isSessionEnded || player.departureStatus !== 'active';


  useEffect(() => {
    if (isOpen) {
      setEditAmount(transaction.amount.toString());
      setEditDescription(transaction.description);
    }
  }, [isOpen, transaction]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionsDisabled) {
      toast({ title: "Cannot Edit", description: "Transaction cannot be edited as player/session is finalized.", variant: "destructive" });
      return;
    }

    const numericAmount = parseFloat(editAmount);
    if (isNaN(numericAmount)) {
      toast({ title: "Error", description: "Invalid transaction amount.", variant: "destructive" });
      return;
    }
    if (!editDescription.trim()) {
      toast({ title: "Error", description: "Transaction description cannot be empty.", variant: "destructive" });
      return;
    }

    onEditTransaction(player.id, transaction.id, numericAmount, editDescription.trim());
    toast({ title: "Transaction Updated", description: "Transaction details have been saved." });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Transaction for {player.name}
          </DialogTitle>
           <DialogDescription>
            Modify the amount or description for this transaction.
            {(isSessionEnded || player.departureStatus !== 'active') && " (Editing disabled - player/session finalized)"}
          </DialogDescription>
        </DialogHeader>
        {/* Removed P2P specific warning message */}
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-ledger-description" className="text-sm font-medium">Description</Label>
            <Input
              id="edit-ledger-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="mt-1 bg-input"
              disabled={isActionsDisabled}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-ledger-amount" className="text-sm font-medium">Amount (Rs.)</Label>
            <Input
              id="edit-ledger-amount"
              type="number"
              step="any"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="mt-1 bg-input"
              disabled={isActionsDisabled}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isActionsDisabled}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
