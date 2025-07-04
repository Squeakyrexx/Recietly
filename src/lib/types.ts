import { type z } from 'zod';
import { type extractReceiptData } from '@/ai/flows/extract-receipt-data';

export type Receipt = {
  id: string;
  merchant: string;
  amount: number;
  date: string; // ISO string for simplicity
  category: 'Groceries' | 'Transport' | 'Entertainment' | 'Utilities' | 'Dining' | 'Other';
  description: string;
  imageUrl: string;
};

export type SpendingByCategory = {
  category: string;
  total: number;
};

export type ExtractedReceiptData = z.infer<typeof extractReceiptData.outputSchema>;
