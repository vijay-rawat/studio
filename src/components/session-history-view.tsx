
"use client";

import React from 'react';
import type { GameSession, Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { History, Users, TrendingUp, TrendingDown, Scale, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SessionHistoryViewProps {
  sessions: GameSession[];
}

const calculateFinalNetResult = (player: Player): number => {
    const liveBalance = player.initialBalance + player.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    return (player.cashedOutAmount ?? 0) + liveBalance;
};

export function SessionHistoryView({ sessions }: SessionHistoryViewProps) {

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <History className="mr-3 h-6 w-6 text-primary" />
            Game Session History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 text-center min-h-[300px] flex flex-col justify-center items-center">
          <Users className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">No historical sessions found.</p>
          <p className="text-sm text-muted-foreground/80">
            Once you end a game and reset, it will be archived here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
          <History className="mr-3 h-6 w-6 text-primary" />
          Game Session History
        </CardTitle>
        <CardDescription>
          A log of all your past poker games. Expand any session to see detailed results.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full">
          {sessions.map((session) => {
            const sortedPlayers = [...session.players]
              .map(p => ({ ...p, finalNetResult: calculateFinalNetResult(p) }))
              .sort((a, b) => b.finalNetResult - a.finalNetResult);
            
            const totalPlayerNet = sortedPlayers.reduce((sum, p) => sum + p.finalNetResult, 0);
            const bankNetPosition = -totalPlayerNet;

            return (
              <AccordionItem value={session.id} key={session.id}>
                <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors text-lg w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-left">
                       <span className="font-medium text-base sm:text-lg">
                        Game of {format(new Date(session.startTime), "MMMM d, yyyy")}
                      </span>
                       <Badge variant="outline">{session.players.length} Players</Badge>
                    </div>
                     <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground hidden sm:inline">Bank Net:</span>
                      <span
                          className={cn(
                            "font-semibold text-base",
                            bankNetPosition > 0 ? "text-emerald-500" : "text-destructive"
                          )}
                        >
                          {bankNetPosition >= 0 ? '+' : ''}{bankNetPosition.toFixed(2)} Rs.
                        </span>
                     </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-muted/20">
                   <div className="overflow-x-auto p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedPlayers.map((player) => (
                          <Card key={player.id} className="bg-card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-base font-medium">{player.name}</CardTitle>
                               {player.finalNetResult > 0 && <TrendingUp className="h-5 w-5 text-emerald-500" />}
                               {player.finalNetResult < 0 && <TrendingDown className="h-5 w-5 text-destructive" />}
                               {player.finalNetResult === 0 && <Scale className="h-5 w-5 text-muted-foreground" />}
                            </CardHeader>
                            <CardContent>
                               <div className={cn(
                                "text-2xl font-bold",
                                player.finalNetResult > 0 && "text-emerald-500",
                                player.finalNetResult < 0 && "text-destructive",
                               )}>
                                {player.finalNetResult >= 0 ? '+' : ''}{player.finalNetResult.toFixed(2)} Rs.
                               </div>
                               <p className="text-xs text-muted-foreground">
                                {player.transactions.length} transactions recorded
                               </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                   </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

    