import { type Receipt, type SpendingByCategory, type Category, CATEGORIES } from '@/lib/types';

/**
 * In-memory store for receipts.
 * This is a simple solution for this demo application.
 * In a real-world application, you would use a database.
 *
 * We use a global object to persist the data across hot reloads in development.
 */
const globalForReceipts = global as unknown as {
    receipts: Receipt[] | undefined
}
const globalForBudgets = global as unknown as {
    budgets: { [key in Category]?: number } | undefined
}

// Initialize receipts only once. Start with an empty array.
let receipts: Receipt[] = globalForReceipts.receipts ?? [];
let budgets: { [key in Category]?: number } = globalForBudgets.budgets ?? 
    CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {});


if (process.env.NODE_ENV !== 'production') {
    globalForReceipts.receipts = receipts;
    globalForBudgets.budgets = budgets;
}


export const getReceipts = (): Receipt[] => {
  // Return receipts sorted by date, newest first.
  return [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addReceipt = (receipt: Omit<Receipt, 'id'>) => {
    const d = new Date(receipt.date);
    // The `.toISOString()` method will throw a RangeError for an invalid date.
    // We check if the date is valid. If not, we default to the current date to avoid a crash.
    const isValidDate = !isNaN(d.getTime());
    
    const newReceipt: Receipt = {
        id: (receipts.length + 1).toString() + Date.now(), // Make ID more unique
        ...receipt,
        // The date from the form is a string like 'YYYY-MM-DD'.
        // A simple approach is to just store the YYYY-MM-DD and parse it carefully on the client.
        date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    };
    receipts.unshift(newReceipt); // Add to the beginning of the array
};

export const updateReceipt = (updatedReceipt: Receipt) => {
    const index = receipts.findIndex(r => r.id === updatedReceipt.id);
    if (index !== -1) {
        receipts[index] = updatedReceipt;
    }
};

export const deleteReceipt = (id: string) => {
    receipts = receipts.filter(r => r.id !== id);
    if (process.env.NODE_ENV !== 'production') {
        globalForReceipts.receipts = receipts;
    }
}

export const getSpendingByCategory = ({ month }: { month: 'current' | 'all' }): SpendingByCategory[] => {
  const spendingMap: { [key: string]: number } = {};
  
  let receiptsToProcess = getReceipts();
  
  if (month === 'current') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // Make sure to include the entire last day of the month
    
    receiptsToProcess = receiptsToProcess.filter(r => {
        // By replacing hyphens with slashes, we parse the date in the local timezone,
        // which avoids "off-by-one-day" errors across different timezones.
        const receiptDate = new Date(r.date.replace(/-/g, '\/'));
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
    let receiptsToProcess = getReceipts();
    if (month === 'current') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999); // Make sure to include the entire last day of the month

        receiptsToProcess = receiptsToProcess.filter(r => {
            // By replacing hyphens with slashes, we parse the date in the local timezone,
            // which avoids "off-by-one-day" errors across different timezones.
            const receiptDate = new Date(r.date.replace(/-/g, '\/'));
            return receiptDate >= startOfMonth && receiptDate <= endOfMonth;
        });
    }
  return receiptsToProcess.reduce((total, receipt) => total + receipt.amount, 0);
};

export const getBudgets = (): { [key in Category]?: number } => {
    return budgets;
}

export const setBudget = ({ category, amount }: { category: Category, amount: number }) => {
    budgets[category] = amount;
     if (process.env.NODE_ENV !== 'production') {
        globalForBudgets.budgets = budgets;
    }
}
