'use server';
/**
 * @fileOverview A poker hand analyzer AI agent for multi-way pots.
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
  opponentHands: z.array(z.array(cardSchema).length(2)).min(1).max(5).describe("An array of opponent hands. Each opponent hand must have two cards."),
  communityCards: z.array(cardSchema).min(3).max(5).describe("The community cards on the board (flop, turn, river)."),
});
export type AnalyzePokerHandInput = z.infer<typeof AnalyzePokerHandInputSchema>;

const PlayerResultSchema = z.object({
  playerId: z.string().describe("The identifier for the player (e.g., 'You', 'Opponent 1')."),
  handName: z.string().describe("The name of the player's best 5-card hand (e.g., 'Full House', 'Flush')."),
  handCards: z.array(cardSchema).length(5).describe("The 5 cards that make up the player's best hand."),
});

const AnalyzePokerHandOutputSchema = z.object({
  winner: z.string().describe("A string declaring the winner(s), e.g., 'You', 'Opponent 1', or 'Split Pot between You and Opponent 2'."),
  rankedResults: z.array(PlayerResultSchema).describe("An array of all players' results, ranked from best hand to worst."),
  explanation: z.string().describe("A clear, concise explanation of the result, including why the winning hand is best. If there's a split pot, explain why the hands are of equal value. Explain it like you are teaching a new player."),
});
export type AnalyzePokerHandOutput = z.infer<typeof AnalyzePokerHandOutputSchema>;


export async function analyzePokerHand(input: AnalyzePokerHandInput): Promise<AnalyzePokerHandOutput> {
  return analyzePokerHandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePokerHandPrompt',
  input: { schema: AnalyzePokerHandInputSchema },
  output: { schema: AnalyzePokerHandOutputSchema },
  prompt: `You are an expert Texas Hold'em poker analyst. Your task is to determine the winner among multiple hands given a set of community cards.

  **Rules:**
  1.  A hand is composed of the best 5 cards from the 2 hole cards and the 5 community cards.
  2.  Evaluate all hands (Your Hand and all Opponent Hands) and determine the best 5-card combination for each player.
  3.  Rank all the hands from best to worst.
  4.  Declare a winner. If multiple hands are tied for the best, it's a split pot among them.
  5.  Provide a clear, simple explanation for a beginner, detailing the rankings and why the winning hand(s) are superior.

  **Card Representation:**
  - Rank: 2, 3, 4, 5, 6, 7, 8, 9, T (10), J (Jack), Q (Queen), K (King), A (Ace)
  - Suit: S (Spades), H (Hearts), D (Diamonds), C (Clubs)
  - Example: 'AS' is Ace of Spades.

  **Player and Board Information:**
  - Your Hand: {{{json myHand}}}
  - Opponent Hands: {{{json opponentHands}}}
  - Community Cards: {{{json communityCards}}}

  Assign player IDs as 'You' for your hand, and 'Opponent 1', 'Opponent 2', etc., for the opponent hands based on their order in the input array.

  Analyze the hands and provide the result in the specified JSON format. The 'rankedResults' array should be ordered from the best hand to the worst.`,
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
