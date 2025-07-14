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
const SUITS = 'CDHS';
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
    return evaluateBest5CardHand(player.id, all7Cards);
  });

  results.sort(compareHandResults);

  const winnerResults = findWinners(results);

  return formatOutput(results, winnerResults);
}

/**
 * Evaluates the best 5-card hand from a given 7 cards.
 * @param playerId - The ID of the player.
 * @param all7Cards - The 7 cards (2 hole + 5 community) available to the player.
 * @returns A PlayerHandResult object describing the best hand.
 */
function evaluateBest5CardHand(playerId: string, all7Cards: string[]): PlayerHandResult {
  const combinations = getCombinations(all7Cards, 5);
  let bestHand: PlayerHandResult | null = null;

  for (const combo of combinations) {
    const currentHand = evaluate5CardHand(combo);
    if (!bestHand || compareHandResults(currentHand, bestHand) > 0) {
      bestHand = currentHand;
    }
  }

  if (!bestHand) {
    throw new Error('Could not determine best hand.');
  }
  
  bestHand.playerId = playerId;
  return bestHand;
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
  const isStraight = values.every((v, i) => i === 0 || v === values[i - 1] - 1) ||
                     JSON.stringify(values) === '[12, 3, 2, 1, 0]'; // Ace-low straight A,5,4,3,2

  const counts: { [key: number]: number } = values.reduce((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {} as any);
  const groups = Object.values(counts).sort((a, b) => b - a);
  const groupKeys = Object.keys(counts).map(Number).sort((a,b) => counts[b] - counts[a] || b - a);


  if (isStraight && isFlush) {
    return {
      handName: values[0] === RANKS.indexOf('A') ? HAND_NAMES[9] : HAND_NAMES[8],
      handRank: values[0] === RANKS.indexOf('A') ? 9 : 8,
      handValue: values,
      handCards: hand
    };
  }
  if (groups[0] === 4) {
    return {
      handName: HAND_NAMES[7],
      handRank: 7,
      handValue: groupKeys,
      handCards: hand
    };
  }
  if (groups[0] === 3 && groups[1] === 2) {
    return {
      handName: HAND_NAMES[6],
      handRank: 6,
      handValue: groupKeys,
      handCards: hand
    };
  }
  if (isFlush) {
    return {
      handName: HAND_NAMES[5],
      handRank: 5,
      handValue: values,
      handCards: hand
    };
  }
  if (isStraight) {
    // Handle Ace-low straight value for comparison
    const straightValue = JSON.stringify(values) === '[12, 3, 2, 1, 0]' ? [3,2,1,0,-1] : values;
    return {
      handName: HAND_NAMES[4],
      handRank: 4,
      handValue: straightValue,
      handCards: hand
    };
  }
  if (groups[0] === 3) {
    return {
      handName: HAND_NAMES[3],
      handRank: 3,
      handValue: groupKeys,
      handCards: hand
    };
  }
  if (groups[0] === 2 && groups[1] === 2) {
    return {
      handName: HAND_NAMES[2],
      handRank: 2,
      handValue: groupKeys,
      handCards: hand
    };
  }
  if (groups[0] === 2) {
    return {
      handName: HAND_NAMES[1],
      handRank: 1,
      handValue: groupKeys,
      handCards: hand
    };
  }
  return {
    handName: HAND_NAMES[0],
    handRank: 0,
    handValue: values,
    handCards: hand
  };
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
  for (let i = 0; i < a.handValue.length; i++) {
    if (a.handValue[i] !== b.handValue[i]) {
      return a.handValue[i] - b.handValue[i];
    }
  }
  return 0;
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
function formatOutput(sortedResults: PlayerHandResult[], winners: PlayerHandResult[]): PokerHandResult {
  let winnerString: string;
  if (winners.length > 1) {
    const winnerNames = winners.map(w => w.playerId).join(' and ');
    winnerString = `Split Pot between ${winnerNames}`;
  } else {
    winnerString = winners[0].playerId;
  }

  // Sort by hand rank for the final display
  const finalRankedResults = [...sortedResults].sort((a, b) => compareHandResults(b, a));

  const explanation = generateExplanation(finalRankedResults, winners);

  return {
    winner: winnerString,
    rankedResults: finalRankedResults.map(r => ({ ...r, handCards: sortCards(r.handCards) })),
    explanation,
  };
}

/**
 * Generates a human-readable explanation of the result.
 */
function generateExplanation(sortedResults: PlayerHandResult[], winners: PlayerHandResult[]): string {
    if (winners.length === 0 || sortedResults.length === 0) {
        return "Could not determine a winner.";
    }

    const winnerIsPlural = winners.length > 1;
    const winnerNames = winners.map(w => w.playerId).join(' and ');
    const winningHandName = winners[0].handName;
    const verb = winnerIsPlural ? 'win' : 'wins';
    const possessive = winnerIsPlural ? "their" : (winners[0].playerId === 'You' ? 'your' : `${winners[0].playerId}'s`);

    let explanation = `${winnerNames} ${verb} with a ${winningHandName}.\n\n`;
    explanation += `Here's the ranking breakdown:\n`;

    sortedResults.forEach((result, index) => {
        explanation += `${index + 1}. ${result.playerId}: ${result.handName}\n`;
    });

    if (sortedResults.length > 1) {
        explanation += `\n**Why ${winnerNames} Won:**\n`;
        const winnerResult = winners[0];
        const runnerUpResult = sortedResults.find(r => !winners.some(w => w.playerId === r.playerId));

        if (!runnerUpResult) {
            explanation += `All winning hands are of equal value.`;
        } else if (winnerResult.handRank > runnerUpResult.handRank) {
            explanation += `${possessive} ${winnerResult.handName} is a higher-ranking hand than ${runnerUpResult.playerId}'s ${runnerUpResult.handName}.`;
        } else {
            // Same hand rank, explain tie-breaker (kickers)
            explanation += `Both hands are a ${winnerResult.handName}, so we look at the cards' values (kickers).\n`;
            explanation += `${possessive} hand (${formatCards(winnerResult.handCards)}) beats ${runnerUpResult.playerId}'s hand (${formatCards(runnerUpResult.handCards)}) due to higher-ranking cards.`
        }
    }
    
    return explanation;
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
    return cards.map(c => c.replace('T', '10')).join(', ');
}
