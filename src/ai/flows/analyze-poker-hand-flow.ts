'use server';
/**
 * @fileOverview A poker hand analyzer AI agent.
 *
 * - analyzePokerHand - A function that handles the poker hand analysis.
 * - AnalyzePokerHandInput - The input type for the analyzePokerHand function.
 * - AnalyzePokerHandOutput - The return type for the analyzePokerHand function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const cardSchema = z.string().describe("A single playing card in the format 'RS' where R is rank (2-9, T, J, Q, K, A) and S is suit (C, D, H, S). Example: 'AS' for Ace of Spades, 'TC' for 10 of Clubs.");

const AnalyzePokerHandInputSchema = z.object({
  myHand: z.array(cardSchema).length(2).describe("The two cards in your hand."),
  opponentHand: z.array(cardSchema).length(2).describe("The two cards in your opponent's hand."),
  communityCards: z.array(cardSchema).min(3).max(5).describe("The community cards on the board (flop, turn, river)."),
});
export type AnalyzePokerHandInput = z.infer<typeof AnalyzePokerHandInputSchema>;

const AnalyzePokerHandOutputSchema = z.object({
  winner: z.enum(['You', 'Opponent', 'Split pot']).describe("Who the winner is."),
  yourBestHand: z.object({
    handName: z.string().describe("The name of your best 5-card hand (e.g., 'Full House', 'Flush')."),
    handCards: z.array(cardSchema).length(5).describe("The 5 cards that make up your best hand."),
  }),
  opponentBestHand: z.object({
    handName: z.string().describe("The name of the opponent's best 5-card hand."),
    handCards: z.array(cardSchema).length(5).describe("The 5 cards that make up the opponent's best hand."),
  }),
  explanation: z.string().describe("A clear, concise explanation of the result, including why one hand beats the other (e.g., which cards make the straight, what the kicker is, etc.). Explain it like you are teaching a new player."),
});
export type AnalyzePokerHandOutput = z.infer<typeof AnalyzePokerHandOutputSchema>;


export async function analyzePokerHand(input: AnalyzePokerHandInput): Promise<AnalyzePokerHandOutput> {
  return analyzePokerHandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePokerHandPrompt',
  input: { schema: AnalyzePokerHandInputSchema },
  output: { schema: AnalyzePokerHandOutputSchema },
  prompt: `You are an expert Texas Hold'em poker analyst. Your task is to determine the winner between two hands given a set of community cards.

  **Rules:**
  1.  A hand is composed of the best 5 cards from the 2 hole cards and the 5 community cards.
  2.  Evaluate both hands and determine the best 5-card combination for each player.
  3.  Compare the two 5-card hands to declare a winner. If the hands are identical, it's a split pot.
  4.  Provide a clear, simple explanation for a beginner, detailing what each player's best hand is and why one is superior. For example, mention kickers if they are relevant.

  **Card Representation:**
  - Rank: 2, 3, 4, 5, 6, 7, 8, 9, T (10), J (Jack), Q (Queen), K (King), A (Ace)
  - Suit: S (Spades), H (Hearts), D (Diamonds), C (Clubs)
  - Example: 'AS' is Ace of Spades.

  **Player and Board Information:**
  - Your Hand: {{{json myHand}}}
  - Opponent's Hand: {{{json opponentHand}}}
  - Community Cards: {{{json communityCards}}}

  Analyze the hands and provide the result in the specified JSON format.`,
});

const analyzePokerHandFlow = ai.defineFlow(
  {
    name: 'analyzePokerHandFlow',
    inputSchema: AnalyzePokerHandInputSchema,
    outputSchema: AnalyzePokerHandOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Unable to get a valid analysis from the AI model.");
    }
    return output;
  }
);
