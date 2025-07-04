import { type Receipt, type SpendingByCategory, type Category, CATEGORIES } from '@/lib/types';

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
  // Return receipts sorted by date, newest first.
  return [...globalForStore.receipts!].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addReceipt = (receipt: Omit<Receipt, 'id'>) => {
    // By replacing hyphens with slashes, we parse the date in the local timezone,
    // which avoids "off-by-one-day" errors across different timezones.
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

const getCurrentMonthAndYear = () => {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(), // 0-indexed (0 for January)
    };
}

export const getSpendingByCategory = ({ month }: { month: 'current' | 'all' }): SpendingByCategory[] => {
  const spendingMap: { [key: string]: number } = {};
  
  let receiptsToProcess = getReceipts();
  
  if (month === 'current') {
    const { year: currentYear, month: currentMonth } = getCurrentMonthAndYear();
    
    receiptsToProcess = receiptsToProcess.filter(r => {
        try {
            const [year, month] = r.date.split('-').map(Number);
            // month in date string is 1-indexed, so we subtract 1 for comparison
            return year === currentYear && (month - 1) === currentMonth;
        } catch (e) {
            // In case date format is wrong for some reason
            console.error(`Invalid date format for receipt ${r.id}: ${r.date}`);
            return false;
        }
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
        const { year: currentYear, month: currentMonth } = getCurrentMonthAndYear();

        receiptsToProcess = receiptsToProcess.filter(r => {
            try {
                const [year, month] = r.date.split('-').map(Number);
                 // month in date string is 1-indexed, so we subtract 1 for comparison
                return year === currentYear && (month - 1) === currentMonth;
            } catch(e) {
                console.error(`Invalid date format for receipt: ${r.date}`);
                return false;
            }
        });
    }
  return receiptsToProcess.reduce((total, receipt) => total + receipt.amount, 0);
};

export const getBudgets = (): { [key in Category]?: number } => {
    return globalForStore.budgets!;
}

export const setBudget = ({ category, amount }: { category: Category, amount: number }) => {
    globalForStore.budgets![category] = amount;
}
