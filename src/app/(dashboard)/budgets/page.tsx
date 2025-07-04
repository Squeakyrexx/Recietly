
'use client';

import { useState, useEffect } from 'react';
import { getBudgets, getSpendingByCategory } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { CATEGORIES, type SpendingByCategory, type Category } from "@/lib/types";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetsPage() {
  const { user } = useAuth();
  const [initialBudgets, setInitialBudgets] = useState<{ [key: string]: number } | null>(null);
  const [spendingThisMonth, setSpendingThisMonth] = useState<SpendingByCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        const [budgetsData, spendingData] = await Promise.all([
          getBudgets(user.uid),
          getSpendingByCategory(user.uid, { month: 'current' }),
        ]);
        
        const budgetsWithDefaults = CATEGORIES.reduce((acc, category) => {
          acc[category] = budgetsData[category] || 0;
          return acc;
        }, {} as { [key: string]: number });

        setInitialBudgets(budgetsWithDefaults);
        setSpendingThisMonth(spendingData);
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Budgets</h1>
        <p className="text-muted-foreground">Set and manage your monthly spending budgets for each category.</p>
      </header>
      <Card>
        <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
            <CardDescription>Enter a budget for each category below. Receipts you upload will automatically count towards these budgets each month.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading || !initialBudgets ? (
              <div className="space-y-6">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                      <Skeleton className="h-6 w-24 rounded-md" />
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Skeleton className="h-10 w-32 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <BudgetForm initialBudgets={initialBudgets} spendingThisMonth={spendingThisMonth}/>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
