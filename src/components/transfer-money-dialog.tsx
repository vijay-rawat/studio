
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowRightLeft, Users, CircleDollarSign } from 'lucide-react';

interface TransferMoneyDialogProps {
  sender: Player;
  potentialRecipients: Player[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmTransfer: (senderId: string, recipientId: string, amount: number, description: string) => void;
  isSessionEnded: boolean;
}

export function TransferMoneyDialog({
  sender,
  potentialRecipients,
  isOpen,
  onClose,
  onConfirmTransfer,
  isSessionEnded,
}: TransferMoneyDialogProps) {
  const { toast } = useToast();
  const [recipientId, setRecipientId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setRecipientId('');
      setAmount('');
      setDescription('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSessionEnded) {
      toast({ title: "Session Ended", description: "Cannot perform transfers after session has ended.", variant: "destructive" });
      onClose();
      return;
    }
    if (!recipientId) {
      toast({ title: "Error", description: "Please select a recipient player.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ title: "Error", description: "Transfer amount must be a positive number.", variant: "destructive" });
      return;
    }

    const recipient = potentialRecipients.find(p => p.id === recipientId);
    if (!recipient) {
      toast({ title: "Error", description: "Selected recipient not found.", variant: "destructive" });
      return;
    }
     if (sender.id === recipientId) {
      toast({ title: "Error", description: "Cannot transfer money to yourself.", variant: "destructive" });
      return;
    }


    onConfirmTransfer(sender.id, recipientId, numericAmount, description.trim());
    onClose();
  };

  if (!sender) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Money: {sender.name}
          </DialogTitle>
          <DialogDescription>
            Transfer funds to another active player. This will create linked transactions for both players.
            {isSessionEnded && " (Actions disabled - session ended)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="transfer-recipient" className="text-sm font-medium">Recipient Player</Label>
            <Select
              value={recipientId}
              onValueChange={setRecipientId}
              disabled={isSessionEnded || potentialRecipients.length === 0}
            >
              <SelectTrigger id="transfer-recipient" className="mt-1 bg-input">
                <SelectValue placeholder={potentialRecipients.length > 0 ? "Select recipient" : "No other active players"} />
              </SelectTrigger>
              <SelectContent>
                {potentialRecipients.map((player) => (
                  <SelectItem key={player.id} value={player.id} disabled={player.id === sender.id}>
                    {player.name}
                  </SelectItem>
                ))}
                {potentialRecipients.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground text-center">No other active players available for transfer.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="transfer-amount" className="text-sm font-medium">Amount (Rs.)</Label>
            <Input
              id="transfer-amount"
              type="number"
              step="any"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to transfer"
              className="mt-1 bg-input"
              disabled={isSessionEnded}
              required
            />
          </div>
          <div>
            <Label htmlFor="transfer-description" className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              id="transfer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Side bet, Food split"
              className="mt-1 bg-input min-h-[60px]"
              disabled={isSessionEnded}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSessionEnded || potentialRecipients.length === 0}>
              <CircleDollarSign className="mr-2 h-4 w-4" /> Confirm Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
