import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { type Receipt, type SpendingByCategory, type Category, CATEGORIES } from '@/lib/types';

// For this demo, we'll hardcode a user ID.
// In a real app, this would come from an authentication system.
const userId = 'demo-user';

const receiptsCollection = collection(db, 'users', userId, 'receipts');
const budgetsDoc = doc(db, 'users', userId, 'budgets', 'data');


export const getReceipts = async (): Promise<Receipt[]> => {
  const q = query(receiptsCollection, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  const receipts: Receipt[] = [];
  querySnapshot.forEach((doc) => {
    receipts.push({ id: doc.id, ...doc.data() } as Receipt);
  });
  return receipts;
};

export const addReceipt = async (receipt: Omit<Receipt, 'id'>) => {
  const d = new Date(receipt.date.replace(/-/g, '/'));
  const isValidDate = !isNaN(d.getTime());

  const newReceipt: Omit<Receipt, 'id'> = {
    ...receipt,
    date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    isBusinessExpense: receipt.isBusinessExpense || false,
  };
  await addDoc(receiptsCollection, newReceipt);
};

export const updateReceipt = async (updatedReceipt: Receipt) => {
  const receiptDoc = doc(db, 'users', userId, 'receipts', updatedReceipt.id);
  const { id, ...data } = updatedReceipt;
  await updateDoc(receiptDoc, data);
};

export const deleteReceipt = async (id: string) => {
  const receiptDoc = doc(db, 'users', userId, 'receipts', id);
  await deleteDoc(receiptDoc);
};

export const getSpendingByCategory = async ({ month }: { month: 'current' | 'all' }): Promise<SpendingByCategory[]> => {
  const spendingMap: { [key: string]: number } = {};
  
  let receiptsToProcess = await getReceipts();
  
  if (month === 'current') {
    const now = new Date();
    const currentYearMonth = now.toISOString().slice(0, 7); // "YYYY-MM"
    
    receiptsToProcess = receiptsToProcess.filter(r => {
        if (!r.date || typeof r.date !== 'string') return false;
        return r.date.startsWith(currentYearMonth);
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

export const getTotalSpending = async ({ month }: { month: 'current' | 'all' }): Promise<number> => {
    let receiptsToProcess = await getReceipts();
    if (month === 'current') {
        const now = new Date();
        const currentYearMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

        receiptsToProcess = receiptsToProcess.filter(r => {
            if (!r.date || typeof r.date !== 'string') return false;
            return r.date.startsWith(currentYearMonth);
        });
    }
  return receiptsToProcess.reduce((total, receipt) => total + receipt.amount, 0);
};

export const getBudgets = async (): Promise<{ [key in Category]?: number }> => {
    const docSnap = await getDoc(budgetsDoc);
    if (docSnap.exists()) {
        return docSnap.data() as { [key in Category]?: number };
    } else {
        // Return default budgets if none are set
        return CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as { [key in Category]?: number });
    }
}

export const setBudget = async ({ category, amount }: { category: Category, amount: number }) => {
    // We use setDoc with merge: true to create or update the document
    await setDoc(budgetsDoc, { [category]: amount }, { merge: true });
}
