export enum PensionStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  WITHDRAWN = 'WITHDRAWN'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: TransactionStatus;
}

export interface PensionAccount {
  id: string;
  accountNumber: string;
  balance: number;
  ownerName: string;
  status: PensionStatus;
  eligibleForWithdrawal: boolean;
  withdrawalHistory: Transaction[];
}

export interface PensionRules {
  minimumAge: number;
  maximumWithdrawalPercentage: number;
  taxFreeAmount: number;
}

export interface WithdrawalResult {
  success: boolean;
  message?: string;
  transaction?: Transaction;
} 