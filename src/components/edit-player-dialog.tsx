
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { UserCog } from 'lucide-react';

interface EditPlayerDialogProps {
  player: Player;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlayerName: (playerId: string, newName: string) => void;
  onUpdateInitialBalance: (playerId: string, newBalance: number) => void;
}

export function EditPlayerDialog({
  player,
  isOpen,
  onClose,
  onUpdatePlayerName,
  onUpdateInitialBalance,
}: EditPlayerDialogProps) {
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(player.name);
  const [editingInitialBalance, setEditingInitialBalance] = useState(player.initialBalance.toString());

  useEffect(() => {
    if (isOpen) {
      setEditingName(player.name);
      setEditingInitialBalance(player.initialBalance.toString());
    }
  }, [isOpen, player]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBalance = parseFloat(editingInitialBalance);

    if (!editingName.trim()) {
      toast({ title: "Error", description: "Player name cannot be empty.", variant: "destructive" });
      return;
    }
    if (isNaN(newBalance)) {
      toast({ title: "Error", description: "Invalid initial balance amount.", variant: "destructive" });
      return;
    }

    onUpdatePlayerName(player.id, editingName.trim());
    onUpdateInitialBalance(player.id, newBalance);
    toast({ title: "Player Updated", description: `${editingName.trim()}'s details have been updated.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Edit Player: {player.name}
          </DialogTitle>
          <DialogDescription>
            Update the player's name and initial balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-player-name" className="text-sm">Player Name</Label>
            <Input
              id="edit-player-name"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="mt-1 bg-input"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-initial-balance" className="text-sm">Initial Balance (Rs.)</Label>
            <Input
              id="edit-initial-balance"
              type="number"
              step="any"
              value={editingInitialBalance}
              onChange={(e) => setEditingInitialBalance(e.target.value)}
              className="mt-1 bg-input"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
