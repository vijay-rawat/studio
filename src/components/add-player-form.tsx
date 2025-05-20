"use client";

import type * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

interface AddPlayerFormProps {
  onAddPlayer: (name: string) => void;
}

export function AddPlayerForm({ onAddPlayer }: AddPlayerFormProps) {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onAddPlayer(playerName.trim());
      setPlayerName('');
    }
  };

  return (
    <Card className="w-full shadow-xl border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserPlus className="h-7 w-7 text-primary" />
          <div>
            <CardTitle className="text-2xl">Add New Player</CardTitle>
            <CardDescription>Enter the name of the player to add them to the game.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="playerName" className="text-sm font-medium sr-only">Player Name</Label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player's name"
              required
              className="mt-1 text-base py-3 px-4 bg-input placeholder:text-muted-foreground/70"
            />
          </div>
          <Button type="submit" className="w-full text-base py-3">
            <UserPlus className="mr-2 h-5 w-5" />
            Add Player
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
