
"use client";

import type * as React from 'react';
import { useState, useMemo } from 'react';
import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit2, PlusCircle, LogOut, Trash2, Coins, UserCog } from 'lucide-react';
import { EditPlayerDialog } from './edit-player-dialog';
import { ManageTransactionsDialog } from './manage-transactions-dialog';
import { CashOutPlayerDialog } from './cash-out-player-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PlayersTableProps {
  players: Player[];
  onUpdatePlayerName: (playerId: string, newName: string) => void;
  onUpdateInitialBalance: (playerId: string, newBalance: number) => void;
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId: string, transactionId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onCashOutPlayer: (playerId: string, cashOutAmount: number, departureStatus: 'left_early' | 'stayed_till_end' | 'stayed_till_end_auto') => void;
  isSessionEnded: boolean;
}

export function PlayersTable({
  players,
  onUpdatePlayerName,
  onUpdateInitialBalance,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDeletePlayer,
  onCashOutPlayer,
  isSessionEnded,
}: PlayersTableProps) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [managingTransactionsForPlayer, setManagingTransactionsForPlayer] = useState<Player | null>(null);
  const [cashingOutPlayer, setCashingOutPlayer] = useState<Player | null>(null);

  const getPlayerBalanceInfo = (player: Player) => {
    const liveBalance = player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const isCashedOut = player.departureStatus !== 'active' && player.cashedOutAmount !== undefined;
    
    if (isCashedOut || (isSessionEnded && player.cashedOutAmount !== undefined)) {
      const finalNetResult = (player.cashedOutAmount ?? 0) + liveBalance;
      return {
        displayBalance: finalNetResult,
        label: 'Final Result',
        isProfit: finalNetResult > 0,
        isLoss: finalNetResult < 0,
      };
    }
    return {
      displayBalance: liveBalance,
      label: 'Current Balance',
      isProfit: liveBalance > 0,
      isLoss: liveBalance < 0,
    };
  };

  const getPlayerStatusText = (player: Player) => {
    if (player.departureStatus === 'active' && !isSessionEnded) return "Active";
    if (player.departureStatus === 'active' && isSessionEnded && player.cashedOutAmount !== undefined) return `Session Ended (Auto Cashed Out ${format(new Date(player.cashOutTimestamp!), 'p')})`;
    if (player.departureStatus === 'left_early') return `Cashed Out (Left Early at ${format(new Date(player.cashOutTimestamp!), 'p')})`;
    if (player.departureStatus === 'stayed_till_end') return `Cashed Out (Stayed till End at ${format(new Date(player.cashOutTimestamp!), 'p')})`;
    return "N/A";
  };


  return (
    <>
      <Card className="shadow-xl border-border/50">
        <CardHeader>
            <CardTitle className="text-2xl">Player Overview</CardTitle>
            <CardDescription>Summary of all players in the game. Use actions menu for player-specific operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Player Name</TableHead>
                <TableHead className="text-right">Initial Balance (Rs.)</TableHead>
                <TableHead className="text-right">Current/Final Balance (Rs.)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const balanceInfo = getPlayerBalanceInfo(player);
                const isPlayerDisabled = (player.departureStatus !== 'active' && player.cashedOutAmount !== undefined) || isSessionEnded;

                return (
                  <TableRow key={player.id} className={cn(isPlayerDisabled && "opacity-70 bg-muted/30")}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell className="text-right">{player.initialBalance.toFixed(2)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        balanceInfo.isProfit && "text-emerald-500",
                        balanceInfo.isLoss && "text-destructive"
                      )}
                    >
                      {balanceInfo.displayBalance.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{getPlayerStatusText(player)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={player.id === 'placeholder_for_dropdown_behavior_fix'}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Player Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingPlayer(player)}
                            disabled={isPlayerDisabled}
                          >
                            <UserCog className="mr-2 h-4 w-4" /> Edit Player
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setManagingTransactionsForPlayer(player)}
                            disabled={isPlayerDisabled && player.departureStatus !== 'active'} 
                          >
                            <Coins className="mr-2 h-4 w-4" /> Manage Transactions
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={() => setCashingOutPlayer(player)}
                            disabled={isPlayerDisabled || (player.departureStatus !== 'active')}
                          >
                            <LogOut className="mr-2 h-4 w-4" /> Cash Out
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                disabled={(player.departureStatus !== 'active' && player.transactions.length > 0 && !isSessionEnded) || (isSessionEnded && player.transactions.length > 0 && player.id === 'cannot_delete_if_session_ended_and_has_tx')}
                                onSelect={(e) => e.preventDefault()} // Prevents DropdownMenu from closing
                               >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Player
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Player: {player.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this player and all their associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeletePlayer(player.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onUpdatePlayerName={onUpdatePlayerName}
          onUpdateInitialBalance={onUpdateInitialBalance}
        />
      )}

      {managingTransactionsForPlayer && (
        <ManageTransactionsDialog
          player={managingTransactionsForPlayer}
          isOpen={!!managingTransactionsForPlayer}
          onClose={() => setManagingTransactionsForPlayer(null)}
          onAddTransaction={onAddTransaction}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
          isActionsDisabled={(managingTransactionsForPlayer.departureStatus !== 'active' && managingTransactionsForPlayer.cashedOutAmount !== undefined) || isSessionEnded}
        />
      )}

      {cashingOutPlayer && (
        <CashOutPlayerDialog
          player={cashingOutPlayer}
          isOpen={!!cashingOutPlayer}
          onClose={() => setCashingOutPlayer(null)}
          onCashOutPlayer={onCashOutPlayer}
          isSessionEnded={isSessionEnded}
        />
      )}
    </>
  );
}
