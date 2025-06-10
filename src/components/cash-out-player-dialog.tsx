
"use client";

import type * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { LogOut } from 'lucide-react';

interface CashOutPlayerDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onCashOutPlayer: (playerId: string, cashOutAmount: number, departureStatus: 'left_early' | 'stayed_till_end' | 'stayed_till_end_auto') => void;
  isSessionEnded: boolean; // To potentially disable if session ended and trying manual cashout.
}

export function CashOutPlayerDialog({
  player,
  isOpen,
  onClose,
  onCashOutPlayer,
  isSessionEnded,
}: CashOutPlayerDialogProps) {
  const { toast } = useToast();
  const [cashOutAmountInput, setCashOutAmountInput] = useState('');
  const [departureStatusInput, setDepartureStatusInput] = useState<'left_early' | 'stayed_till_end'>('stayed_till_end');

  const liveBalance = useMemo(() => {
    return player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [player.initialBalance, player.transactions]);

  useEffect(() => {
    if (isOpen) {
      const suggestedChipValue = liveBalance < 0 ? 0 : liveBalance;
      setCashOutAmountInput(suggestedChipValue.toString());
      setDepartureStatusInput('stayed_till_end');
    }
  }, [isOpen, player, liveBalance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSessionEnded) {
        toast({ title: "Session Ended", description: "Cannot manually cash out players after session has ended.", variant: "destructive" });
        onClose();
        return;
    }
    const amount = parseFloat(cashOutAmountInput);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Error", description: "Invalid cash-out amount. Must be zero or positive.", variant: "destructive" });
      return;
    }
    onCashOutPlayer(player.id, amount, departureStatusInput);
    onClose();
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-primary" />
            Cash Out: {player.name}
          </DialogTitle>
          <DialogDescription>
            Finalize this player's session by recording their cash-out amount and departure status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <Label htmlFor="cash-out-amount-dialog" className="text-sm font-medium">Cash-Out Amount (Rs.)</Label>
            <Input
              id="cash-out-amount-dialog"
              type="number"
              step="any"
              value={cashOutAmountInput}
              onChange={(e) => setCashOutAmountInput(e.target.value)}
              placeholder="Enter amount player is cashing out with"
              required
              className="mt-1 bg-input text-base py-2.5"
              disabled={isSessionEnded}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Player currently owes bank: <span className="font-semibold">{liveBalance < 0 ? Math.abs(liveBalance).toFixed(2) : "0.00"} Rs.</span>
            </p>
            <p className="text-xs text-muted-foreground">
              This is the actual amount of money the player is taking from the table. Must be zero or positive.
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Departure Status</Label>
            <RadioGroup
              value={departureStatusInput}
              onValueChange={(value: 'left_early' | 'stayed_till_end') => setDepartureStatusInput(value)}
              className="mt-2 space-y-2"
              disabled={isSessionEnded}
            >
              <div className="flex items-center space-x-3 p-3 rounded-md border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <RadioGroupItem value="stayed_till_end" id={`status-end-dialog-${player.id}`} />
                <Label htmlFor={`status-end-dialog-${player.id}`} className="font-normal cursor-pointer flex-1">Stayed till End of Game</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <RadioGroupItem value="left_early" id={`status-early-dialog-${player.id}`} />
                <Label htmlFor={`status-early-dialog-${player.id}`} className="font-normal cursor-pointer flex-1">Left Game Early</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="mt-2">
             <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSessionEnded}>Confirm Cash Out</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
