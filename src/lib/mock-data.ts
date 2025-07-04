import { type Receipt, type SpendingByCategory, type Category, CATEGORIES } from '@/lib/types';
import { headers } from 'next/headers';

/**
 * In-memory store for receipts and budgets.
 * This is a simple solution for this demo application.
 * In a real-world application, you would use a database.
 *
 * We use a global object to persist the data across hot reloads in development.
 */
const globalForStore = global as unknown as {
    receipts?: Receipt[];
    budgets?: { [key in Category]?: number };
}

// Initialize the global store if it doesn't exist
if (!globalForStore.receipts) {
    globalForStore.receipts = [];
}
if (!globalForStore.budgets) {
    globalForStore.budgets = CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as { [key in Category]?: number });
}

export const getReceipts = (): Receipt[] => {
  // Opt out of caching
  headers();
  // Return receipts sorted by date, newest first.
  return [...globalForStore.receipts!].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addReceipt = (receipt: Omit<Receipt, 'id'>) => {
    const d = new Date(receipt.date.replace(/-/g, '/'));
    const isValidDate = !isNaN(d.getTime());
    
    const newReceipt: Receipt = {
        id: Date.now().toString() + Math.random().toString(36), // Make ID more unique
        ...receipt,
        date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    };
    globalForStore.receipts!.unshift(newReceipt); // Add to the beginning of the array
};

export const updateReceipt = (updatedReceipt: Receipt) => {
    const index = globalForStore.receipts!.findIndex(r => r.id === updatedReceipt.id);
    if (index !== -1) {
        globalForStore.receipts![index] = updatedReceipt;
    }
};

export const deleteReceipt = (id: string) => {
    globalForStore.receipts = globalForStore.receipts!.filter(r => r.id !== id);
}

const getMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // Ensure to include the entire last day
    return { startOfMonth, endOfMonth };
}

export const getSpendingByCategory = ({ month }: { month: 'current' | 'all' }): SpendingByCategory[] => {
  // Opt out of caching
  headers();
  const spendingMap: { [key: string]: number } = {};
  
  // We call getReceipts() here which is now also dynamic
  let receiptsToProcess = getReceipts();
  
  if (month === 'current') {
    const { startOfMonth, endOfMonth } = getMonthDateRange();
    
    receiptsToProcess = receiptsToProcess.filter(r => {
        // By replacing hyphens with slashes, we parse the date in the local timezone,
        // which avoids "off-by-one-day" errors across different timezones.
        const receiptDate = new Date(r.date.replace(/-/g, '/'));
        return receiptDate >= startOfMonth && receiptDate <= endOfMonth;
    });
  }
  
  receiptsToProcess.forEach((receipt) => {
    if (spendingMap[receipt.category]) {
      spendingMap[receipt.category] += receipt.amount;
    } else {
      spendingMap[receipt.category] = receipt.amount;
    }
  });

  return Object.entries(spendingMap).map(([category, total]) => ({
    category: category as Category,
    total: parseFloat(total.toFixed(2)),
  }));
};

export const getTotalSpending = ({ month }: { month: 'current' | 'all' }): number => {
    // Opt out of caching
    headers();
    // We call getReceipts() here which is now also dynamic
    let receiptsToProcess = getReceipts();
    if (month === 'current') {
        const { startOfMonth, endOfMonth } = getMonthDateRange();

        receiptsToProcess = receiptsToProcess.filter(r => {
            const receiptDate = new Date(r.date.replace(/-/g, '/'));
            return receiptDate >= startOfMonth && receiptDate <= endOfMonth;
        });
    }
  return receiptsToProcess.reduce((total, receipt) => total + receipt.amount, 0);
};

export const getBudgets = (): { [key in Category]?: number } => {
    // Opt out of caching
    headers();
    return globalForStore.budgets!;
}

export const setBudget = ({ category, amount }: { category: Category, amount: number }) => {
    globalForStore.budgets![category] = amount;
}
