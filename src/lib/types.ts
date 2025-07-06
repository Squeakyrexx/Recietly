import { type z } from 'zod';
import { type extractReceiptData } from '@/ai/flows/extract-receipt-data';

export const CATEGORIES = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Dining', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

// New tax categories
export const TAX_CATEGORIES = [
  'Office Supplies',
  'Meals & Entertainment',
  'Business Travel',
  'Software & Subscriptions',
  'Utilities',
  'Vehicle Expenses',
  'Home Office',
  'Other Business Expense',
] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

// New LineItem type
export type LineItem = {
  name: string;
  price: number;
};

export type Receipt = {
  id: string;
  merchant: string;
  amount: number;
  date: string; // Storing as YYYY-MM-DD string
  category: Category;
  description: string;
  imageUrl: string; // Changed from imageDataUri
  isBusinessExpense: boolean;
  taxCategory?: TaxCategory;
  items?: LineItem[];
};

export type SpendingByCategory = {
  category: Category;
  total: number;
};

export type ExtractedReceiptData = z.infer<typeof extractReceiptData.outputSchema>;

export type Budget = {
  category: Category;
  amount: number;
};
