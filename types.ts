
export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  TRANSFER_DEBIT = 'Transfer (Debit)',
  TRANSFER_CREDIT = 'Transfer (Credit)',
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  timestamp: string;
  description: string;
}

export interface Account {
  accountNumber: string;
  userId: string;
  balance: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  pinHash: string;
  role: 'user' | 'admin';
}
