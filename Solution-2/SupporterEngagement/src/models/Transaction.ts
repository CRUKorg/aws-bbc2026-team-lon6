/**
 * Transaction Data Model
 * Represents financial transactions and donations
 */

export type TransactionType = 'one_time' | 'recurring';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  transactionId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  timestamp: Date;
  paymentMethod: string;
  
  // Campaign association
  campaignId?: string;
  
  metadata: Record<string, any>;
}

export interface DonationSummary {
  userId: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  recurringDonations: number;
  lastDonationDate?: Date;
  suggestedNextAmount: number;
}

export interface TransactionValidation {
  transactionId: string;
  isValid: boolean;
  validationErrors?: string[];
  validatedAt: Date;
}
