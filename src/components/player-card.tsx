
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
import { Trash2, Edit3, PlusCircle, Save, XCircle, LogOut, Clock, UserCog, FilePlus, ShieldAlert, Ban, Banknote } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const liveBalance = useMemo(() => {
    return player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [player.initialBalance, player.transactions]);

  const finalNetResult = useMemo(() => {
    if (isCashedOut && player.cashedOutAmount !== undefined) {
      return player.cashedOutAmount + liveBalance;
    }
    return null;
  }, [player, isCashedOut, liveBalance]);
  
  const balanceToDisplay = finalNetResult !== null ? finalNetResult : liveBalance;

  useEffect(() => {
    if (isCashOutDialogOpen) {
      const suggestedChipValue = liveBalance < 0 ? Math.abs(liveBalance) : 0;
      setCashOutAmountInput(suggestedChipValue.toString());
      setDepartureStatusInput('stayed_till_end'); // Reset departure status on dialog open
    }
  }, [isCashOutDialogOpen, liveBalance]);


  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdatePlayerName(player.id, editingName.trim());
      setIsEditingName(false);
      toast({ title: "Name Updated", description: `Player name changed to ${editingName.trim()}.` });
    } else {
      toast({ title: "Error", description: "Player name cannot be empty.", variant: "destructive" });
    }
  };

  const handleInitialBalanceSave = () => {
    const newBalance = parseFloat(editingInitialBalance);
    if (!isNaN(newBalance)) {
      onUpdateInitialBalance(player.id, newBalance);
      setIsEditingInitialBalance(false);
      toast({ title: "Balance Updated", description: `Initial balance set to ${newBalance} Rs.` });
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
    toast({ title: "Transaction Added", description: `Added '${newTransactionDescription.trim()}' for ${amount} Rs.` });
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
    toast({ title: "Transaction Updated", description: "Transaction details saved." });
  };

  const handleCashOutFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cashOutAmountInput);
    if (isNaN(amount)) {
      toast({ title: "Error", description: "Invalid cash-out amount.", variant: "destructive" });
      return;
    }
    onCashOutPlayer(player.id, amount, departureStatusInput);
    setIsCashOutDialogOpen(false); // Close dialog
    setCashOutAmountInput(''); 
  };

  return (
    <Dialog open={isCashOutDialogOpen || !!editingTransaction} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setEditingTransaction(null);
            setIsCashOutDialogOpen(false);
        }
    }}>
      <Card className={cn(
        "w-full shadow-xl flex flex-col h-full border transition-all duration-300",
        isCashedOut ? "border-muted/30 bg-card/50 opacity-70" : "border-border/50 hover:shadow-primary/20 hover:border-primary/50"
      )}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              {isEditingName && !isCashedOut ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input 
                    value={editingName} 
                    onChange={(e) => setEditingName(e.target.value)} 
                    className="text-2xl font-semibold p-1 h-auto bg-input"
                    aria-label={`Edit name for ${player.name}`}
                  />
                  <Button size="icon" variant="ghost" onClick={handleNameSave} aria-label="Save name"><Save className="h-5 w-5 text-primary" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setIsEditingName(false); setEditingName(player.name);}} aria-label="Cancel name edit"><XCircle className="h-5 w-5 text-muted-foreground" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl font-semibold text-foreground">{player.name}</CardTitle>
                  {!isCashedOut && <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)} aria-label={`Edit name for ${player.name}`} className="text-muted-foreground hover:text-primary"><Edit3 className="h-4 w-4" /></Button>}
                </div>
              )}
              <CardDescription className="text-sm">
                  {isEditingInitialBalance && !isCashedOut ? (
                       <div className="flex items-center gap-2 mt-1 text-xs">
                          <span>Initial Balance:</span>
                          <Input 
                              type="number" 
                              value={editingInitialBalance} 
                              onChange={(e) => setEditingInitialBalance(e.target.value)} 
                              className="p-1 h-7 w-20 bg-input text-xs"
                              aria-label={`Edit initial balance for ${player.name}`}
                          />
                          <Button size="icon" variant="ghost" onClick={handleInitialBalanceSave} aria-label="Save initial balance" className="h-6 w-6"><Save className="h-4 w-4 text-primary" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { setIsEditingInitialBalance(false); setEditingInitialBalance(player.initialBalance.toString());}} aria-label="Cancel initial balance edit" className="h-6 w-6"><XCircle className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                          <span>Initial: {player.initialBalance} Rs.</span>
                          {!isCashedOut && <Button size="icon" variant="ghost" onClick={() => setIsEditingInitialBalance(true)} aria-label={`Edit initial balance for ${player.name}`} className="h-6 w-6 text-muted-foreground hover:text-primary"><Edit3 className="h-3 w-3" /></Button>}
                      </div>
                  )}
              </CardDescription>
              {isCashedOut && player.cashedOutAmount !== undefined && (
                <div className="mt-2 text-xs space-y-1 p-2.5 rounded-md bg-muted/50 border border-dashed border-muted-foreground/30">
                  <p className="font-medium text-primary flex items-center"><LogOut className="h-3.5 w-3.5 mr-1.5"/>Cashed Out: {player.cashedOutAmount} Rs.</p>
                  <p className="flex items-center text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> 
                    {player.departureStatus === 'left_early' ? 'Left Early' : 'Stayed till End'}
                    {player.cashOutTimestamp && ` at ${format(new Date(player.cashOutTimestamp), 'p')}`}
                  </p>
                  <p className="flex items-center text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5 mr-1.5" />
                    Bank Settlement: 
                    {liveBalance < 0 ? ` Player paid bank ${Math.abs(liveBalance).toFixed(2)} Rs.` : 
                     liveBalance > 0 ? ` Bank paid player ${liveBalance.toFixed(2)} Rs.` : 
                     ' Even with bank.'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end">
              {isCashedOut && <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary/30 pointer-events-none text-xs py-0.5 px-1.5">Cashed Out</Badge>}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label={`Delete player ${player.name}`} disabled={isCashedOut && player.transactions.length > 0}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Player: {player.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this player and all their associated data from the current game.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeletePlayer(player.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 pt-0 pb-4">
          <Separator className="my-2 bg-border/40"/>
          <div className="flex-grow">
              <h4 className="font-semibold mb-2 text-base text-foreground/90">Transactions:</h4>
              {player.transactions.length === 0 && !isCashedOut ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
              ) : player.transactions.length === 0 && isCashedOut ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No transactions recorded before cash-out.</p>
              ) : (
              <ScrollArea className="h-[160px] pr-3 -mr-3"> 
                  <ul className="space-y-2">
                  {player.transactions.map((tx) => (
                      <li key={tx.id} className="text-sm flex justify-between items-center p-2.5 rounded-md border border-border/30 bg-card hover:bg-muted/30 transition-colors group">
                      <div>
                          <span className="font-medium text-foreground/90">{tx.description}</span>
                          <p className={`text-xs ${tx.amount < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount} Rs.</p>
                          <p className="text-xs text-muted-foreground/70 pt-0.5">{format(new Date(tx.timestamp), "MMM d, p")}</p>
                      </div>
                      {!isCashedOut && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DialogTrigger asChild>
                               <Button variant="ghost" size="icon" onClick={() => openEditTransactionModal(tx)} aria-label="Edit transaction" className="h-7 w-7 text-muted-foreground hover:text-primary">
                                 <Edit3 className="h-4 w-4" />
                               </Button>
                            </DialogTrigger>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" aria-label="Delete transaction">
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
                                  <AlertDialogAction onClick={() => onDeleteTransaction(player.id, tx.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
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
            <>
            <Separator className="my-2 bg-border/40"/>
            <form onSubmit={handleAddTransactionFormSubmit} className="space-y-3 pt-2">
              <h5 className="font-semibold text-sm text-foreground/90 flex items-center"><FilePlus className="h-4 w-4 mr-2 text-primary"/>Add Transaction</h5>
              <div>
                <Label htmlFor={`tx-desc-${player.id}`} className="text-xs font-medium text-muted-foreground">Description</Label>
                <Input
                  id={`tx-desc-${player.id}`}
                  type="text"
                  value={newTransactionDescription}
                  onChange={(e) => setNewTransactionDescription(e.target.value)}
                  placeholder="e.g., Buy-in, Food"
                  required
                  className="mt-1 h-9 bg-input text-sm"
                  disabled={isCashedOut}
                />
              </div>
              <div>
                <Label htmlFor={`tx-amount-${player.id}`} className="text-xs font-medium text-muted-foreground">Amount (Rs.)</Label>
                <Input
                  id={`tx-amount-${player.id}`}
                  type="number"
                  step="any"
                  value={newTransactionAmount}
                  onChange={(e) => setNewTransactionAmount(e.target.value)}
                  placeholder="e.g., 50 or -100"
                  required
                  className="mt-1 h-9 bg-input text-sm"
                  disabled={isCashedOut}
                />
                <p className="text-xs text-muted-foreground/70 mt-1">Positive if player gives to bank, negative if player takes from bank.</p>
              </div>
              <Button type="submit" size="sm" className="w-full" disabled={isCashedOut}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
              </Button>
            </form>
            </>
          )}
          
          {!isCashedOut && (
             <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsCashOutDialogOpen(true)} className="w-full mt-3 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary" disabled={isCashedOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Cash Out Player
                </Button>
            </DialogTrigger>
          )}

        </CardContent>
        <CardFooter className={cn(
            "p-4 mt-auto border-t",
            isCashedOut ? "bg-muted/20 border-muted/30" : "bg-card/50 border-border/40",
            balanceToDisplay > 0 ? "border-t-emerald-500/30" : balanceToDisplay < 0 ? "border-t-destructive/30" : "border-border/40"
        )}>
          <div className="w-full">
            <p className={`text-lg font-bold ${balanceToDisplay > 0 ? 'text-emerald-500' : balanceToDisplay < 0 ? 'text-destructive' : 'text-foreground'}`}>
              {isCashedOut ? 'Final Result: ' : (balanceToDisplay >= 0 ? 'Net Profit: ' : 'Net Loss: ')}
              {balanceToDisplay === 0 ? '0.00' : Math.abs(balanceToDisplay).toFixed(2)} Rs.
            </p>
            <p className={`text-xs ${balanceToDisplay > 0 ? 'text-emerald-500/80' : balanceToDisplay < 0 ? 'text-destructive/80' : 'text-muted-foreground'}`}>
              {isCashedOut 
                ? (balanceToDisplay > 0 ? 'Player took home this profit.' : balanceToDisplay < 0 ? 'Player incurred this loss.' : 'Player broke even.')
                : (balanceToDisplay > 0 ? 'Currently up this amount from bank.' : balanceToDisplay < 0 ? 'Currently owes bank this amount.' : 'Currently even with the bank.')
              }
            </p>
          </div>
        </CardFooter>

        {/* Edit Transaction Dialog */}
        {editingTransaction && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-primary"/>Edit Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTransactionFormSubmit} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-tx-desc" className="text-sm">Description</Label>
                <Input
                  id="edit-tx-desc"
                  type="text"
                  value={editTransactionDescription}
                  onChange={(e) => setEditTransactionDescription(e.target.value)}
                  required
                  className="mt-1 bg-input"
                />
              </div>
              <div>
                <Label htmlFor="edit-tx-amount" className="text-sm">Amount (Rs.)</Label>
                <Input
                  id="edit-tx-amount"
                  type="number"
                  step="any"
                  value={editTransactionAmount}
                  onChange={(e) => setEditTransactionAmount(e.target.value)}
                  required
                  className="mt-1 bg-input"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}

        {/* Cash Out Dialog */}
        {isCashOutDialogOpen && (
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center"><LogOut className="mr-2 h-5 w-5 text-primary"/>Cash Out: {player.name}</DialogTitle>
                    <CardDescription>Finalize this player's session by recording their cash-out amount and departure status.</CardDescription>
                </DialogHeader>
                <form onSubmit={handleCashOutFormSubmit} className="space-y-6 py-4">
                    <div>
                        <Label htmlFor="cash-out-amount" className="text-sm font-medium">Cash-Out Amount (Rs.)</Label>
                        <Input
                            id="cash-out-amount"
                            type="number"
                            step="any"
                            value={cashOutAmountInput}
                            onChange={(e) => setCashOutAmountInput(e.target.value)}
                            placeholder="Enter amount player is cashing out with"
                            required
                            className="mt-1 bg-input text-base py-2.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Player currently owes bank: <span className="font-semibold">{liveBalance < 0 ? Math.abs(liveBalance).toFixed(2) : "0.00"} Rs.</span>
                        </p>
                         <p className="text-xs text-muted-foreground">
                           This is the actual amount of money the player is taking from the table.
                        </p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium">Departure Status</Label>
                        <RadioGroup 
                            value={departureStatusInput} 
                            onValueChange={(value: 'left_early' | 'stayed_till_end') => setDepartureStatusInput(value)}
                            className="mt-2 space-y-2"
                        >
                            <div className="flex items-center space-x-3 p-3 rounded-md border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                <RadioGroupItem value="stayed_till_end" id={`status-end-${player.id}`} />
                                <Label htmlFor={`status-end-${player.id}`} className="font-normal cursor-pointer flex-1">Stayed till End of Game</Label>
                            </div>
                            <div className="flex items-center space-x-3 p-3 rounded-md border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                <RadioGroupItem value="left_early" id={`status-early-${player.id}`} />
                                <Label htmlFor={`status-early-${player.id}`} className="font-normal cursor-pointer flex-1">Left Game Early</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <DialogFooter className="mt-2">
                        <Button type="button" variant="outline" onClick={() => setIsCashOutDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">Confirm Cash Out</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        )}
      </Card>
    </Dialog>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none";
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    destructive: "border-transparent bg-destructive text-destructive-foreground",
    outline: "text-foreground border-current",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
  };
  return (
    <div className={cn(baseClasses, variant ? variants[variant] : variants.default, className)} {...props} />
  );
}
