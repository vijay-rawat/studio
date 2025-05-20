
export interface Transaction {
  id: string;
  amount: number; // Positive for money given to bank, negative for money taken from bank
  description: string;
  timestamp: string; // ISO string for date
}

export interface Player {
  id: string;
  name: string;
  initialBalance: number;
  transactions: Transaction[];
  cashedOutAmount?: number;
  cashOutTimestamp?: string; // ISO string for date
  departureStatus?: 'active' | 'left_early' | 'stayed_till_end';
}
