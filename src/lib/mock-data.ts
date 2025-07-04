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
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { type Receipt, type SpendingByCategory, type Category, CATEGORIES } from '@/lib/types';

// NOTE: All functions now require a userId to operate on user-specific data.
// The hardcoded 'demo-user' has been removed.

export const getReceipts = async (userId: string): Promise<Receipt[]> => {
  if (!userId) return [];
  const receiptsCollection = collection(db, 'users', userId, 'receipts');
  const q = query(receiptsCollection, orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  const receipts: Receipt[] = [];
  querySnapshot.forEach((doc) => {
    receipts.push({ id: doc.id, ...doc.data() } as Receipt);
  });
  return receipts;
};

export const addReceipt = async (userId: string, receipt: Omit<Receipt, 'id'>) => {
  if (!userId) throw new Error('User not authenticated');
  const d = new Date(receipt.date.replace(/-/g, '/'));
  const isValidDate = !isNaN(d.getTime());

  const newReceipt: Omit<Receipt, 'id'> = {
    ...receipt,
    date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    isBusinessExpense: receipt.isBusinessExpense || false,
  };
  const receiptsCollection = collection(db, 'users', userId, 'receipts');
  await addDoc(receiptsCollection, newReceipt);
};

export const updateReceipt = async (userId: string, updatedReceipt: Receipt) => {
  if (!userId) throw new Error('User not authenticated');
  const receiptDoc = doc(db, 'users', userId, 'receipts', updatedReceipt.id);
  const { id, ...data } = updatedReceipt;
  await updateDoc(receiptDoc, data);
};

export const deleteReceipt = async (userId: string, id: string) => {
  if (!userId) throw new Error('User not authenticated');
  const receiptDoc = doc(db, 'users', userId, 'receipts', id);
  await deleteDoc(receiptDoc);
};

export const getSpendingByCategory = async (userId: string, { month }: { month: 'current' | 'all' }): Promise<SpendingByCategory[]> => {
  if (!userId) return [];
  const spendingMap: { [key: string]: number } = {};
  
  let receiptsToProcess = await getReceipts(userId);
  
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

export const getTotalSpending = async (userId: string, { month }: { month: 'current' | 'all' }): Promise<number> => {
    if (!userId) return 0;
    let receiptsToProcess = await getReceipts(userId);
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

export const getBudgets = async (userId: string): Promise<{ [key in Category]?: number }> => {
    if (!userId) return {};
    const budgetsDocRef = doc(db, 'users', userId, 'budgets', 'data');
    const docSnap = await getDoc(budgetsDocRef);
    if (docSnap.exists()) {
        return docSnap.data() as { [key in Category]?: number };
    } else {
        // Return default budgets if none are set
        return CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as { [key in Category]?: number });
    }
}

export const setBudget = async (userId: string, { category, amount }: { category: Category, amount: number }) => {
    if (!userId) throw new Error('User not authenticated');
    const budgetsDocRef = doc(db, 'users', userId, 'budgets', 'data');
    // We use setDoc with merge: true to create or update the document
    await setDoc(budgetsDocRef, { [category]: amount }, { merge: true });
}
