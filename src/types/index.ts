
export interface Transaction {
  id: string;
  amount: number; // Positive for money given to bank/player, negative for money taken from bank/player
  description: string;
  timestamp: string; // ISO string for date
  transactionType?: 'bank' | 'player_to_player_send' | 'player_to_player_receive';
  relatedPlayerId?: string;
  relatedPlayerName?: string;
  p2pGroupId?: string; // To link send and receive transactions
}

export interface Player {
  id: string;
  name: string;
  initialBalance: number;
  transactions: Transaction[];
  cashedOutAmount?: number;
  cashOutTimestamp?: string; // ISO string for date
  departureStatus?: 'active' | 'left_early' | 'stayed_till_end' | 'stayed_till_end_auto';
}
