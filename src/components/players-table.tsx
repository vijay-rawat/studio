
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit2, PlusCircle, LogOut, Trash2, Coins, UserCog, Circle } from 'lucide-react'; // Added Circle
import { EditPlayerDialog } from './edit-player-dialog';
import { ManageTransactionsDialog } from './manage-transactions-dialog';
import { CashOutPlayerDialog } from './cash-out-player-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";


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
  const [managingTransactionsForPlayerId, setManagingTransactionsForPlayerId] = useState<string | null>(null);
  const [cashingOutPlayer, setCashingOutPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

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

  const getPlayerStatusText = (player: Player): string => {
    if (player.departureStatus === 'active' && !isSessionEnded) return "Active";
    if (player.departureStatus === 'active' && isSessionEnded && player.cashedOutAmount !== undefined && player.cashOutTimestamp) return `Ended (Auto @ ${format(new Date(player.cashOutTimestamp), 'p')})`;
    if (player.departureStatus === 'left_early' && player.cashOutTimestamp) return `Left Early @ ${format(new Date(player.cashOutTimestamp), 'p')}`;
    if (player.departureStatus === 'stayed_till_end' && player.cashOutTimestamp) return `Stayed End @ ${format(new Date(player.cashOutTimestamp), 'p')}`;
    if (player.departureStatus === 'stayed_till_end_auto' && player.cashOutTimestamp) return `Ended (Auto @ ${format(new Date(player.cashOutTimestamp), 'p')})`; 
    return "Finalized"; 
  };

  const playerForTransactionDialog = useMemo(() => {
    if (!managingTransactionsForPlayerId) return null;
    return players.find(p => p.id === managingTransactionsForPlayerId) || null;
  }, [players, managingTransactionsForPlayerId]);

  const playerForEditDialog = useMemo(() => {
    if (!editingPlayer) return null;
    return players.find(p => p.id === editingPlayer.id) || null;
  }, [players, editingPlayer]);

  const playerForCashOutDialog = useMemo(() => {
     if (!cashingOutPlayer) return null;
    return players.find(p => p.id === cashingOutPlayer.id) || null;
  }, [players, cashingOutPlayer]);


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
                <TableHead className="w-[200px] pl-6">Player Name</TableHead>
                <TableHead className="text-right">Initial Balance (Rs.)</TableHead>
                <TableHead className="text-right">Current/Final Balance (Rs.)</TableHead>
                <TableHead className="text-right pr-6 w-[80px]">Actions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => {
                const balanceInfo = getPlayerBalanceInfo(player);
                const isPlayerDisabledActions = (player.departureStatus !== 'active' && player.cashedOutAmount !== undefined) || isSessionEnded;
                const isPlayerActiveForRebuy = player.departureStatus === 'active' && !isSessionEnded;

                let statusIndicatorColor = "text-muted-foreground"; 
                if (player.departureStatus === 'active' && !isSessionEnded) {
                  statusIndicatorColor = "text-emerald-500"; 
                } else if (player.departureStatus === 'left_early') {
                  statusIndicatorColor = "text-amber-500"; 
                } else if (
                    player.departureStatus === 'stayed_till_end' || 
                    (isSessionEnded && player.cashedOutAmount !== undefined) ||
                    player.departureStatus === 'stayed_till_end_auto' 
                ) {
                  statusIndicatorColor = "text-blue-500"; 
                }
                

                return (
                  <TableRow key={player.id} className={cn((player.departureStatus !== 'active' || isSessionEnded) && "opacity-70 bg-muted/30")}>
                    <TableCell className="font-medium pl-6">{player.name}</TableCell>
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
                    <TableCell className="text-right pr-6">
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
                            disabled={isPlayerDisabledActions}
                          >
                            <UserCog className="mr-2 h-4 w-4" /> Edit Player
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={() => {
                                onAddTransaction(player.id, -400, "Re-buy (Player takes 400)");
                                toast({ title: "Re-buy Added", description: `${player.name} re-bought for 400 Rs.` });
                            }}
                            disabled={!isPlayerActiveForRebuy}
                          >
                            <Coins className="mr-2 h-4 w-4" /> Quick Re-buy
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setManagingTransactionsForPlayerId(player.id)}
                          >
                            <Coins className="mr-2 h-4 w-4" /> Manage Transactions
                          </DropdownMenuItem>
                           <DropdownMenuItem
                            onClick={() => setCashingOutPlayer(player)}
                            disabled={isPlayerDisabledActions || (player.departureStatus !== 'active')}
                          >
                            <LogOut className="mr-2 h-4 w-4" /> Cash Out
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                disabled={(isPlayerDisabledActions && player.transactions.length > 0) || (isSessionEnded && player.transactions.length > 0) }
                                onSelect={(e) => e.preventDefault()} 
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
                    <TableCell className="text-sm">
                       <div className="flex items-center gap-2">
                        <Circle className={cn("h-2.5 w-2.5 shrink-0", statusIndicatorColor)} fill={statusIndicatorColor} />
                        <span className="text-muted-foreground whitespace-nowrap">{getPlayerStatusText(player)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {playerForEditDialog && (
        <EditPlayerDialog
          player={playerForEditDialog}
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onUpdatePlayerName={onUpdatePlayerName}
          onUpdateInitialBalance={onUpdateInitialBalance}
        />
      )}

      {playerForTransactionDialog && (
        <ManageTransactionsDialog
          player={playerForTransactionDialog}
          isOpen={!!managingTransactionsForPlayerId}
          onClose={() => setManagingTransactionsForPlayerId(null)}
          onAddTransaction={onAddTransaction}
          onEditTransaction={onEditTransaction}
          onDeleteTransaction={onDeleteTransaction}
          isActionsDisabled={(playerForTransactionDialog.departureStatus !== 'active' && playerForTransactionDialog.cashedOutAmount !== undefined) || isSessionEnded}
        />
      )}

      {playerForCashOutDialog && (
        <CashOutPlayerDialog
          player={playerForCashOutDialog}
          isOpen={!!cashingOutPlayer}
          onClose={() => setCashingOutPlayer(null)}
          onCashOutPlayer={onCashOutPlayer}
          isSessionEnded={isSessionEnded}
        />
      )}
    </>
  );
}
