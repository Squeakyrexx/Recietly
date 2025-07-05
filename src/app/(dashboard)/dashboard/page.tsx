
'use client';

import { useState, useEffect } from 'react';
import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { getSpendingByCategory, getTotalSpending, getBudgets } from '@/lib/mock-data';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { useAuth } from '@/context/auth-context';
import type { SpendingByCategory, Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const [totalSpending, setTotalSpending] = useState<number | null>(null);
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategory[] | null>(null);
  const [budgets, setBudgets] = useState<{ [key in Category]?: number } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const [total, byCategory, budgetData] = await Promise.all([
          getTotalSpending(user.uid, { month: 'current' }),
          getSpendingByCategory(user.uid, { month: 'current' }),
          getBudgets(user.uid),
        ]);
        setTotalSpending(total);
        setSpendingByCategory(byCategory);
        setBudgets(budgetData);
      };
      fetchData();
    }
  }, [user]);

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
