
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
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const currentReceipts = receipts.filter(r => r.date?.startsWith(currentMonth));
      
      const total = currentReceipts.reduce((sum, r) => sum + r.amount, 0);
      setTotalSpending(total);

      const spendingMap: { [key in Category]?: number } = {};
      currentReceipts.forEach((receipt) => {
          spendingMap[receipt.category] = (spendingMap[receipt.category] || 0) + receipt.amount;
      });
      const byCategory = Object.entries(spendingMap).map(([category, total]) => ({
          category: category as Category,
          total: total!,
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
        <p className="text-muted-foreground">A summary of your spending habits for this month.</p>
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
