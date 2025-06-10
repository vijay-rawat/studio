
"use client";

import type * as React from 'react';
import { useState } from 'react';
import type { Player } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, User, PlusCircle } from 'lucide-react';

interface GlobalAddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[]; // Pass all players to select from
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  isSessionEnded: boolean;
}

export function GlobalAddTransactionDialog({
  isOpen,
  onClose,
  players,
  onAddTransaction,
  isSessionEnded,
}: GlobalAddTransactionDialogProps) {
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const activePlayers = players.filter(p => p.departureStatus === 'active');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSessionEnded) {
      toast({ title: "Session Ended", description: "Cannot add transactions.", variant: "destructive" });
      return;
    }
    if (!selectedPlayerId) {
      toast({ title: "Error", description: "Please select a player.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      toast({ title: "Error", description: "Invalid transaction amount.", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "Transaction description cannot be empty.", variant: "destructive" });
      return;
    }

    onAddTransaction(selectedPlayerId, numericAmount, description.trim());
    toast({ title: "Transaction Added", description: `Added '${description.trim()}' for ${numericAmount} Rs.` });
    // Reset form
    setSelectedPlayerId('');
    setAmount('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-primary" />
            Add New Transaction to Ledger
          </DialogTitle>
          <DialogDescription>
            Select a player and enter the transaction details. This will be recorded in the game ledger.
            {isSessionEnded && " (Actions disabled - session ended)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="select-player" className="text-sm font-medium">Player</Label>
            <Select
              value={selectedPlayerId}
              onValueChange={setSelectedPlayerId}
              disabled={isSessionEnded || activePlayers.length === 0}
            >
              <SelectTrigger id="select-player" className="mt-1 bg-input">
                <SelectValue placeholder={activePlayers.length > 0 ? "Select a player" : "No active players"} />
              </SelectTrigger>
              <SelectContent>
                {activePlayers.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
                 {activePlayers.length === 0 && <p className="p-2 text-sm text-muted-foreground">No active players available.</p>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="transaction-description-global" className="text-sm font-medium">Description</Label>
            <Input
              id="transaction-description-global"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Re-buy, Chips purchase"
              className="mt-1 bg-input"
              disabled={isSessionEnded}
              required
            />
          </div>
          <div>
            <Label htmlFor="transaction-amount-global" className="text-sm font-medium">Amount (Rs.)</Label>
            <Input
              id="transaction-amount-global"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 500 or -100"
              className="mt-1 bg-input"
              disabled={isSessionEnded}
              required
            />
            <p className="text-xs text-muted-foreground/70 mt-1">Positive if player gives to bank, negative if player takes from bank.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSessionEnded || activePlayers.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add to Ledger
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    
