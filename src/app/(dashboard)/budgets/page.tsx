
'use client';

import { useState, useEffect } from 'react';
import { listenToBudgets, listenToReceipts } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { CATEGORIES, type SpendingByCategory, type Category } from "@/lib/types";
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function BudgetsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [initialBudgets, setInitialBudgets] = useState<{ [key: string]: number } | null>(null);
  const [spendingThisMonth, setSpendingThisMonth] = useState<SpendingByCategory[] | null>(null);

  useEffect(() => {
    if (loading || !user) {
        setInitialBudgets(null);
        setSpendingThisMonth(null);
        return;
    }

    const handleFetchError = (error: Error) => {
        console.error("Failed to fetch budget data:", error);
        toast({
            title: 'Error Loading Data',
            description: 'Could not load your budget information. Please try again later.',
            variant: 'destructive'
        });
    };

    const unsubscribeBudgets = listenToBudgets(user.uid, (budgetsData) => {
        const budgetsWithDefaults = CATEGORIES.reduce((acc, category) => {
          acc[category] = budgetsData[category] || 0;
          return acc;
        }, {} as { [key: string]: number });
        setInitialBudgets(budgetsWithDefaults);
    }, handleFetchError);

    const unsubscribeReceipts = listenToReceipts(user.uid, (receiptsData) => {
        const now = new Date();
        const currentYearMonth = now.toISOString().slice(0, 7);
        const currentMonthReceipts = receiptsData.filter(r => r.date && r.date.startsWith(currentYearMonth));
        
        const spendingMap: { [key in Category]?: number } = {};
        for (const receipt of currentMonthReceipts) {
          const amount = parseFloat(String(receipt.amount)) || 0;
          const category = receipt.category;
          spendingMap[category] = (spendingMap[category] || 0) + amount;
        }

        const spendingByCategory = Object.entries(spendingMap).map(([category, total]) => ({
          category: category as Category,
          total: parseFloat(total.toFixed(2)),
        }));
        setSpendingThisMonth(spendingByCategory);
    }, handleFetchError);

    return () => {
        unsubscribeBudgets();
        unsubscribeReceipts();
    };
  }, [user, loading, toast]);

  const isLoading = !initialBudgets || !spendingThisMonth;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
            {isLoading ? (
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
              <BudgetForm initialBudgets={initialBudgets!} spendingThisMonth={spendingThisMonth!}/>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
