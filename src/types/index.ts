

export type TransactionAction = 'created' | 'edited' | 'deleted';

export interface TransactionState {
  amount: number;
  description: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  amount: number; // Current amount
  description: string; // Current description
  timestamp: string; // Timestamp of last action
  action: TransactionAction;
  previousStates: TransactionState[]; // Log of previous states
}

export interface Player {
  id:string;
  name: string;
  initialBalance: number;
  transactions: Transaction[];
  cashedOutAmount?: number;
  cashOutTimestamp?: string; // ISO string for date
  departureStatus?: 'active' | 'left_early' | 'stayed_till_end' | 'stayed_till_end_auto';
}

export interface GameSession {
  id: string;
  startTime: string;
  endTime: string;
  players: Player[];
}
