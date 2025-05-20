
"use client";

import type * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import type { Player, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Edit3, PlusCircle, Save, XCircle, LogOut, Clock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface PlayerCardProps {
  player: Player;
  onUpdatePlayerName: (playerId: string, newName: string) => void;
  onUpdateInitialBalance: (playerId: string, newBalance: number) => void;
  onAddTransaction: (playerId: string, amount: number, description: string) => void;
  onEditTransaction: (playerId: string, transactionId: string, newAmount: number, newDescription: string) => void;
  onDeleteTransaction: (playerId:string, transactionId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onCashOutPlayer: (playerId: string, cashOutAmount: number, departureStatus: 'left_early' | 'stayed_till_end') => void;
}

export function PlayerCard({
  player,
  onUpdatePlayerName,
  onUpdateInitialBalance,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onDeletePlayer,
  onCashOutPlayer,
}: PlayerCardProps) {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(player.name);
  const [isEditingInitialBalance, setIsEditingInitialBalance] = useState(false);
  const [editingInitialBalance, setEditingInitialBalance] = useState(player.initialBalance.toString());

  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTransactionAmount, setEditTransactionAmount] = useState('');
  const [editTransactionDescription, setEditTransactionDescription] = useState('');

  const [isCashOutDialogOpen, setIsCashOutDialogOpen] = useState(false);
  const [cashOutAmountInput, setCashOutAmountInput] = useState('');
  const [departureStatusInput, setDepartureStatusInput] = useState<'left_early' | 'stayed_till_end'>('stayed_till_end');

  const isCashedOut = player.departureStatus !== 'active' && player.cashedOutAmount !== undefined;

  // Live balance reflects current financial state with bank, excluding final cash out amount
  const liveBalance = useMemo(() => {
    return player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [player.initialBalance, player.transactions]);

  // Final net result after cashing out
  const finalNetResult = useMemo(() => {
    if (isCashedOut && player.cashedOutAmount !== undefined) {
      return player.cashedOutAmount + liveBalance;
    }
    return null;
  }, [player, isCashedOut, liveBalance]);
  
  const balanceToDisplay = finalNetResult !== null ? finalNetResult : liveBalance;

  useEffect(() => {
    if (isCashOutDialogOpen) {
      // Pre-fill cash-out amount with current chip value (absolute of liveBalance if negative, else 0)
      const suggestedChipValue = liveBalance < 0 ? Math.abs(liveBalance) : 0;
      setCashOutAmountInput(suggestedChipValue.toString());
    }
  }, [isCashOutDialogOpen, liveBalance]);


  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdatePlayerName(player.id, editingName.trim());
      setIsEditingName(false);
      toast({ title: "Success", description: "Player name updated." });
    } else {
      toast({ title: "Error", description: "Player name cannot be empty.", variant: "destructive" });
    }
  };

  const handleInitialBalanceSave = () => {
    const newBalance = parseFloat(editingInitialBalance);
    if (!isNaN(newBalance)) {
      onUpdateInitialBalance(player.id, newBalance);
      setIsEditingInitialBalance(false);
      toast({ title: "Success", description: "Initial balance updated." });
    } else {
      toast({ title: "Error", description: "Invalid balance amount.", variant: "destructive" });
    }
  };

  const handleAddTransactionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    toast({ title: "Success", description: "Transaction added." });
  };
  
  const openEditTransactionModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditTransactionAmount(tx.amount.toString());
    setEditTransactionDescription(tx.description);
  };

  const handleEditTransactionFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const amount = parseFloat(editTransactionAmount);
    if (isNaN(amount)) {
      toast({ title: "Error", description: "Invalid transaction amount.", variant: "destructive" });
      return;
    }
    if (!editTransactionDescription.trim()) {
      toast({ title: "Error", description: "Transaction description cannot be empty.", variant: "destructive" });
      return;
    }
    onEditTransaction(player.id, editingTransaction.id, amount, editTransactionDescription.trim());
    setEditingTransaction(null); 
    toast({ title: "Success", description: "Transaction updated." });
  };

  const handleCashOutFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashOutAmountInput);
    if (isNaN(amount)) {
      toast({ title: "Error", description: "Invalid cash-out amount.", variant: "destructive" });
      return;
    }
    onCashOutPlayer(player.id, amount, departureStatusInput);
    setIsCashOutDialogOpen(false);
    setCashOutAmountInput(''); // Reset for next time
  };


  return (
    <Dialog open={!!editingTransaction || isCashOutDialogOpen} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setEditingTransaction(null);
        setIsCashOutDialogOpen(false);
      }
    }}>
      <Card className={`w-full shadow-lg flex flex-col h-full ${isCashedOut ? 'bg-muted/50' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              {isEditingName && !isCashedOut ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={editingName} 
                    onChange={(e) => setEditingName(e.target.value)} 
                    className="text-xl font-semibold p-1 h-auto"
                    aria-label={`Edit name for ${player.name}`}
                    disabled={isCashedOut}
                  />
                  <Button size="icon" variant="ghost" onClick={handleNameSave} aria-label="Save name" disabled={isCashedOut}><Save className="h-4 w-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setIsEditingName(false); setEditingName(player.name);}} aria-label="Cancel name edit" disabled={isCashedOut}><XCircle className="h-4 w-4 text-destructive" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{player.name}</CardTitle>
                  {!isCashedOut && <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} aria-label={`Edit name for ${player.name}`}><Edit3 className="h-4 w-4" /></Button>}
                </div>
              )}
              <CardDescription className="mt-1">
                  {isEditingInitialBalance && !isCashedOut ? (
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">Initial:</span>
                          <Input 
                              type="number" 
                              value={editingInitialBalance} 
                              onChange={(e) => setEditingInitialBalance(e.target.value)} 
                              className="p-1 h-auto w-24"
                              aria-label={`Edit initial balance for ${player.name}`}
                              disabled={isCashedOut}
                          />
                          <Button size="icon" variant="ghost" onClick={handleInitialBalanceSave} aria-label="Save initial balance" disabled={isCashedOut}><Save className="h-4 w-4 text-primary" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setIsEditingInitialBalance(false); setEditingInitialBalance(player.initialBalance.toString());}} aria-label="Cancel initial balance edit" disabled={isCashedOut}><XCircle className="h-4 w-4 text-destructive" /></Button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 mt-1">
                          <span>Initial Balance: {player.initialBalance} Rs.</span>
                          {!isCashedOut && <Button size="icon" variant="ghost" onClick={() => setIsEditingInitialBalance(true)} aria-label={`Edit initial balance for ${player.name}`}><Edit3 className="h-4 w-4" /></Button>}
                      </div>
                  )}
              </CardDescription>
              {isCashedOut && player.cashedOutAmount !== undefined && (
                <div className="mt-2 text-sm space-y-1">
                  <p className="font-semibold text-primary">Cashed Out: {player.cashedOutAmount} Rs.</p>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" /> 
                    {player.departureStatus === 'left_early' ? 'Left Early' : 'Stayed till End'}
                    {player.cashOutTimestamp && ` at ${format(new Date(player.cashOutTimestamp), 'p')}`}
                  </p>
                </div>
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={`Delete player ${player.name}`}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete player {player.name} and all their data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeletePlayer(player.id)} className="bg-destructive hover:bg-destructive/90">
                    Delete Player
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <div className="flex-grow">
              <h4 className="font-semibold mb-2 text-md">Transactions:</h4>
              {player.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
              ) : (
              <ScrollArea className="h-[150px] pr-3">
                  <ul className="space-y-2">
                  {player.transactions.map((tx) => (
                      <li key={tx.id} className="text-sm flex justify-between items-center p-2 rounded-md border bg-muted/20 hover:bg-muted/50 transition-colors">
                      <div>
                          <span className="font-medium">{tx.description}</span>: <span className={tx.amount < 0 ? 'text-red-500' : 'text-emerald-600'}>{tx.amount} Rs.</span>
                          <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                      {!isCashedOut && (
                        <div className="flex gap-1">
                            <DialogTrigger asChild>
                               <Button variant="ghost" size="icon" onClick={() => openEditTransactionModal(tx)} aria-label="Edit transaction">
                                 <Edit3 className="h-4 w-4" />
                               </Button>
                            </DialogTrigger>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete transaction">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this transaction: {tx.description} ({tx.amount} Rs.)? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteTransaction(player.id, tx.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
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

          {!isCashedOut && (
            <form onSubmit={handleAddTransactionFormSubmit} className="space-y-3 pt-4 border-t">
              <h5 className="font-semibold text-sm">Add New Transaction</h5>
              <div>
                <Label htmlFor={`tx-desc-${player.id}`} className="text-xs">Description</Label>
                <Input
                  id={`tx-desc-${player.id}`}
                  type="text"
                  value={newTransactionDescription}
                  onChange={(e) => setNewTransactionDescription(e.target.value)}
                  placeholder="e.g., Buy-in, Food"
                  required
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor={`tx-amount-${player.id}`} className="text-xs">Amount (Rs.)</Label>
                <Input
                  id={`tx-amount-${player.id}`}
                  type="number"
                  step="any"
                  value={newTransactionAmount}
                  onChange={(e) => setNewTransactionAmount(e.target.value)}
                  placeholder="e.g., 50 (to bank) or -100 (from bank)"
                  required
                  className="mt-1 h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">Positive if giving to bank, negative if taking from bank.</p>
              </div>
              <Button type="submit" size="sm" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </form>
          )}
          {!isCashedOut && (
             <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsCashOutDialogOpen(true)} className="w-full mt-2">
                  <LogOut className="mr-2 h-4 w-4" /> Cash Out Player
                </Button>
            </DialogTrigger>
          )}

        </CardContent>
        <CardFooter className="bg-secondary/30 p-4">
          <div className="w-full">
            <p className={`text-lg font-bold ${balanceToDisplay > 0 ? 'text-emerald-600' : balanceToDisplay < 0 ? 'text-red-500' : 'text-foreground'}`}>
              {isCashedOut ? 'Final Result: ' : (balanceToDisplay > 0 ? 'Net Win: ' : (balanceToDisplay < 0 ? 'Net Loss: ' : 'Net Result: '))}
              {balanceToDisplay === 0 ? '0.00' : Math.abs(balanceToDisplay).toFixed(2)} Rs.
            </p>
            <p className={`text-sm ${balanceToDisplay > 0 ? 'text-emerald-600' : balanceToDisplay < 0 ? 'text-red-500' : 'text-foreground'}`}>
              {isCashedOut 
                ? (balanceToDisplay > 0 ? 'Player profited this amount.' : balanceToDisplay < 0 ? 'Player lost this amount.' : 'Player broke even.')
                : (balanceToDisplay > 0 ? 'Bank owes player this amount.' : balanceToDisplay < 0 ? 'Player owes bank this amount.' : 'Currently even with the bank.')
              }
            </p>
          </div>
        </CardFooter>

        {/* Edit Transaction Dialog */}
        {editingTransaction && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTransactionFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-tx-desc">Description</Label>
                <Input
                  id="edit-tx-desc"
                  type="text"
                  value={editTransactionDescription}
                  onChange={(e) => setEditTransactionDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tx-amount">Amount (Rs.)</Label>
                <Input
                  id="edit-tx-amount"
                  type="number"
                  step="any"
                  value={editTransactionAmount}
                  onChange={(e) => setEditTransactionAmount(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}

        {/* Cash Out Dialog */}
        {isCashOutDialogOpen && (
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Cash Out Player: {player.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCashOutFormSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="cash-out-amount">Cash-Out Amount (Rs.)</Label>
                        <Input
                            id="cash-out-amount"
                            type="number"
                            step="any"
                            value={cashOutAmountInput}
                            onChange={(e) => setCashOutAmountInput(e.target.value)}
                            placeholder="Enter amount player is cashing out"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Current chip value (if owed to bank): {liveBalance < 0 ? Math.abs(liveBalance).toFixed(2) : "0.00"} Rs.
                        </p>
                    </div>
                    <div>
                        <Label>Departure Status</Label>
                        <RadioGroup 
                            value={departureStatusInput} 
                            onValueChange={(value: 'left_early' | 'stayed_till_end') => setDepartureStatusInput(value)}
                            className="mt-1"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="stayed_till_end" id={`status-end-${player.id}`} />
                                <Label htmlFor={`status-end-${player.id}`}>Stayed till End</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="left_early" id={`status-early-${player.id}`} />
                                <Label htmlFor={`status-early-${player.id}`}>Left Early</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCashOutDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Confirm Cash Out</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        )}
      </Card>
    </Dialog>
  );
}

