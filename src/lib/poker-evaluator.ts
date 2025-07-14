
/**
 * @fileoverview A local, rule-based Texas Hold'em hand evaluator.
 * This file contains the logic to determine the winning hand(s) from a set of player hands and community cards.
 * It is a deterministic replacement for the previous AI-based solution.
 */

// --- Type Definitions ---

export interface PokerHandInput {
  myHand: string[];
  opponentHands: string[][];
  communityCards: string[];
}

interface PlayerHandResult {
  playerId: string;
  handName: string;
  handCards: string[];
  handRank: number;
  handValue: number[]; // For tie-breaking
}

export interface PokerHandResult {
  winner: string;
  rankedResults: PlayerHandResult[];
  explanation: string;
}

// --- Constants ---

const RANKS = '23456789TJQKA';
const HAND_NAMES = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
];

// --- Core Evaluation Logic ---

/**
 * Main function to evaluate multiple poker hands.
 * @param input - The player hands and community cards.
 * @returns The result of the evaluation, including winner and explanation.
 */
export function evaluatePokerHands(input: PokerHandInput): PokerHandResult {
  const allPlayerHoleCards = [
    { id: 'You', cards: input.myHand },
    ...input.opponentHands.map((hand, i) => ({ id: `Opponent ${i + 1}`, cards: hand })),
  ];

  const results: PlayerHandResult[] = allPlayerHoleCards.map(player => {
    const all7Cards = [...player.cards, ...input.communityCards];
    if (new Set(all7Cards).size !== all7Cards.length) {
      throw new Error("Duplicate cards detected in input.");
    }
    return evaluateBest5CardHand(player.id, all7Cards);
  });

  const rankedResults = [...results].sort((a, b) => compareHandResults(b, a));

  const winnerResults = findWinners(rankedResults);

  return formatOutput(rankedResults, winnerResults);
}

/**
 * Evaluates the best 5-card hand from a given 7 cards.
 * @param playerId - The ID of the player.
 * @param all7Cards - The 7 cards (2 hole + 5 community) available to the player.
 * @returns A PlayerHandResult object describing the best hand.
 */
function evaluateBest5CardHand(playerId: string, all7Cards: string[]): PlayerHandResult {
  const combinations = getCombinations(all7Cards, 5);
  let bestHand: Omit<PlayerHandResult, 'playerId'> | null = null;

  for (const combo of combinations) {
    const currentHand = evaluate5CardHand(combo);
    if (!bestHand || compareHandResults(currentHand as PlayerHandResult, bestHand as PlayerHandResult) > 0) {
      bestHand = currentHand;
    }
  }

  if (!bestHand) {
    throw new Error('Could not determine best hand.');
  }
  
  return { ...bestHand, playerId };
}

/**
 * Evaluates a single 5-card hand.
 * This is the heart of the evaluation logic.
 * @param hand - An array of 5 card strings.
 * @returns A PlayerHandResult object (without playerId).
 */
function evaluate5CardHand(hand: string[]): Omit<PlayerHandResult, 'playerId'> {
  const values = hand.map(c => RANKS.indexOf(c[0])).sort((a, b) => b - a);
  const suits = hand.map(c => c[1]);

  const isFlush = new Set(suits).size === 1;
  const isWheel = JSON.stringify(values) === '[12, 3, 2, 1, 0]'; // Ace-low straight: A, 5, 4, 3, 2
  const isStraight = values.every((v, i) => i === 0 || v === values[i - 1] - 1) || isWheel;

  const counts: { [key: number]: number } = values.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {} as any);
  
  // Sort card ranks by their frequency, then by their value (highest first)
  const groupKeys = Object.keys(counts).map(Number).sort((a,b) => {
    const countDiff = counts[b] - counts[a];
    if (countDiff !== 0) return countDiff;
    return b - a;
  });

  if (isStraight && isFlush) {
    const handRank = isWheel ? 8 : (values[0] === RANKS.indexOf('A') ? 9 : 8);
    const handName = handRank === 9 ? HAND_NAMES[9] : HAND_NAMES[8];
    const handValue = isWheel ? [3, 2, 1, 0, -1] : values; // Treat Ace as low for 'wheel' comparison
    return { handName, handRank, handValue, handCards: hand };
  }
  if (isFlush) return { handName: HAND_NAMES[5], handRank: 5, handValue: values, handCards: hand };
  if (isStraight) {
    const handValue = isWheel ? [3, 2, 1, 0, -1] : values;
    return { handName: HAND_NAMES[4], handRank: 4, handValue, handCards: hand };
  }

  const groups = Object.values(counts);
  if (groups.some(c => c === 4)) return { handName: HAND_NAMES[7], handRank: 7, handValue: groupKeys, handCards: hand };
  if (groups.some(c => c === 3) && groups.some(c => c === 2)) return { handName: HAND_NAMES[6], handRank: 6, handValue: groupKeys, handCards: hand };
  if (groups.some(c => c === 3)) return { handName: HAND_NAMES[3], handRank: 3, handValue: groupKeys, handCards: hand };
  if (groups.filter(c => c === 2).length === 2) return { handName: HAND_NAMES[2], handRank: 2, handValue: groupKeys, handCards: hand };
  if (groups.some(c => c === 2)) return { handName: HAND_NAMES[1], handRank: 1, handValue: groupKeys, handCards: hand };

  return { handName: HAND_NAMES[0], handRank: 0, handValue: values, handCards: hand };
}


// --- Comparison and Formatting ---

/**
 * Compares two hand results to determine the winner.
 * @returns >0 if a wins, <0 if b wins, 0 for a tie.
 */
function compareHandResults(a: PlayerHandResult, b: PlayerHandResult): number {
  if (a.handRank !== b.handRank) {
    return a.handRank - b.handRank;
  }
  // If hand ranks are the same, compare card values (kickers)
  for (let i = 0; i < a.handValue.length; i++) {
    if (a.handValue[i] !== b.handValue[i]) {
      return a.handValue[i] - b.handValue[i];
    }
  }
  return 0; // It's a tie
}

/**
 * Finds all winning players from a sorted list of results.
 */
function findWinners(sortedResults: PlayerHandResult[]): PlayerHandResult[] {
  if (sortedResults.length === 0) return [];
  const bestHand = sortedResults[0];
  return sortedResults.filter(result => compareHandResults(result, bestHand) === 0);
}


/**
 * Formats the final output object, including generating the explanation.
 */
function formatOutput(rankedResults: PlayerHandResult[], winners: PlayerHandResult[]): PokerHandResult {
  let winnerString: string;
  if (winners.length > 1) {
    const winnerNames = winners.map(w => w.playerId).join(' and ');
    winnerString = `Split Pot between ${winnerNames}`;
  } else {
    winnerString = winners[0].playerId;
  }
  
  const explanation = generateExplanation(rankedResults, winners);

  return {
    winner: winnerString,
    rankedResults: rankedResults.map(r => ({ ...r, handCards: sortCards(r.handCards) })),
    explanation,
  };
}

/**
 * Generates a human-readable explanation of the result.
 */
function generateExplanation(rankedResults: PlayerHandResult[], winners: PlayerHandResult[]): string {
    if (winners.length === 0 || rankedResults.length === 0) {
        return "Could not determine a winner.";
    }

    const winnerIsPlural = winners.length > 1;
    const winnerNames = winners.map(w => w.playerId).join(' and ');
    const winningHandName = winners[0].handName;
    const verb = winnerIsPlural ? 'win' : 'wins';
    
    let explanation = `${winnerNames} ${verb} with a ${winningHandName}.`;
    
    const runnerUpResult = rankedResults.find(r => !winners.some(w => w.playerId === r.playerId));

    if (runnerUpResult) {
        const winnerResult = winners[0];
        if (winnerResult.handRank > runnerUpResult.handRank) {
            explanation += ` This beats ${runnerUpResult.playerId}'s ${runnerUpResult.handName}.`;
        } else {
            // Tie-breaker explanation
            explanation += ` This beats ${runnerUpResult.playerId}'s ${runnerUpResult.handName} on kickers. The deciding card(s) were higher.`;
        }
    } else if (winnerIsPlural) {
        explanation += ` All winning players had hands of equal value.`
    }

    explanation += `\n\n**Full Ranking:**\n`;
    rankedResults.forEach((result, index) => {
        explanation += `${index + 1}. ${result.playerId}: ${result.handName} (${formatCards(result.handCards)})\n`;
    });
    
    return explanation.trim();
}


// --- Utility Functions ---

/**
 * Generates all k-sized combinations of elements from an array.
 */
function getCombinations<T>(array: T[], k: number): T[][] {
  const result: T[][] = [];
  function comb(data: T[], start: number, index: number) {
    if (index === k) {
      result.push([...data]);
      return;
    }
    if (start >= array.length) return;
    for (let i = start; i < array.length && array.length - i >= k - index; i++) {
      data[index] = array[i];
      comb(data, i + 1, index + 1);
    }
  }
  comb(new Array(k), 0, 0);
  return result;
}

/** Sorts cards by rank descending */
function sortCards(cards: string[]): string[] {
  return [...cards].sort((a, b) => RANKS.indexOf(b[0]) - RANKS.indexOf(a[0]));
}

/** Formats an array of card strings for display */
function formatCards(cards: string[]): string {
    return sortCards(cards).map(c => c.replace('T', '10')).join(', ');
}
