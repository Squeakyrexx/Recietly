
'use client';

import { useState, useEffect } from 'react';
import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { listenToReceipts, listenToBudgets } from '@/lib/mock-data';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { useAuth } from '@/context/auth-context';
import type { SpendingByCategory, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [totalSpending, setTotalSpending] = useState<number | null>(null);
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategory[] | null>(null);
  const [budgets, setBudgets] = useState<{ [key in Category]?: number } | null>(null);

  useEffect(() => {
    if (loading || !user) {
      setTotalSpending(null);
      setSpendingByCategory(null);
      setBudgets(null);
      return;
    }

    const handleFetchError = (error: Error) => {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            title: 'Error Loading Dashboard',
            description: 'Could not load your spending summary. Please try again later.',
            variant: 'destructive'
        });
    };

    const unsubscribeReceipts = listenToReceipts(user.uid, (receipts) => {
      // The `receipts` from the listener are already sanitized to have numeric amounts.
      
      // Calculate total spending for ALL receipts.
      const calculatedTotal = receipts.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);
      setTotalSpending(calculatedTotal);

      // Calculate spending by category for ALL receipts.
      const spendingMap = receipts.reduce((acc, receipt) => {
          const category = receipt.category;
          const amount = Number(receipt.amount) || 0;
          acc[category] = (acc[category] || 0) + amount;
          return acc;
      }, {} as { [key in Category]?: number });

      const byCategory = Object.entries(spendingMap).map(([category, total]) => ({
          category: category as Category,
          total: parseFloat(total!.toFixed(2)),
      }));
      setSpendingByCategory(byCategory);

    }, handleFetchError);

    const unsubscribeBudgets = listenToBudgets(user.uid, setBudgets, handleFetchError);

    return () => {
      unsubscribeReceipts();
      unsubscribeBudgets();
    };
  }, [user, loading, toast]);

  const isLoading = totalSpending === null || spendingByCategory === null || budgets === null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A summary of your all-time spending habits.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <div className="lg:col-span-1"><Skeleton className="h-32 rounded-lg" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-32 rounded-lg" /></div>
            <div className="lg:col-span-2"><Skeleton className="h-[400px] rounded-lg" /></div>
            <div className="lg:col-span-1"><Skeleton className="h-[400px] rounded-lg" /></div>
            <div className="lg:col-span-3"><Skeleton className="h-48 rounded-lg" /></div>
          </>
        ) : (
          <>
            <div className="lg:col-span-1">
              <TotalSpendingCard total={totalSpending!} />
            </div>
            <div className="lg:col-span-2">
              <BudgetSummary budgets={budgets!} spending={spendingByCategory!} />
            </div>
            <div className="lg:col-span-2">
              <CategorySpendingChart data={spendingByCategory!} />
            </div>
            <div className="lg:col-span-1">
              <TopSpendingCard data={spendingByCategory!} />
            </div>
            <div className="lg:col-span-3">
              <AiInsights />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
