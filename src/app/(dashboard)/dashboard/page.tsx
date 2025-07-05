
'use client';

import { useState, useEffect, useMemo } from 'react';
import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { listenToReceipts, listenToBudgets } from '@/lib/mock-data';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { useAuth } from '@/context/auth-context';
import type { SpendingByCategory, Category, Receipt } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, startOfMonth, startOfYear, endOfToday } from 'date-fns';

type DateRange = 'this-month' | 'last-3-months' | 'this-year' | 'all-time';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all-time', label: 'All Time' },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  
  const [allReceipts, setAllReceipts] = useState<Receipt[] | null>(null);
  const [budgets, setBudgets] = useState<{ [key in Category]?: number } | null>(null);

  // Memoized calculations based on allReceipts and dateRange
  const filteredData = useMemo(() => {
    if (!allReceipts) return null;

    const now = endOfToday();
    let startDate: Date;

    switch (dateRange) {
      case 'this-month':
        startDate = startOfMonth(now);
        break;
      case 'last-3-months':
        startDate = subMonths(now, 3);
        break;
      case 'this-year':
        startDate = startOfYear(now);
        break;
      case 'all-time':
      default:
        startDate = new Date(0); // A very long time ago
        break;
    }
    
    // Filter receipts for the selected date range
    const receiptsInRange = allReceipts.filter(r => new Date(r.date.replace(/-/g, '/')) >= startDate);
    
    // Calculate total spending for the range
    const totalSpending = receiptsInRange.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);

    // Calculate spending by category for the range
    const spendingMap = receiptsInRange.reduce((acc, receipt) => {
        const category = receipt.category;
        const amount = Number(receipt.amount) || 0;
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as { [key in Category]?: number });

    const spendingByCategory = Object.entries(spendingMap).map(([category, total]) => ({
        category: category as Category,
        total: parseFloat(total!.toFixed(2)),
    }));
    
    return {
      receipts: receiptsInRange,
      totalSpending,
      spendingByCategory,
    }
  }, [allReceipts, dateRange]);

  // Memoized calculation for *this month's* spending, specifically for the budget summary
  const spendingThisMonth = useMemo(() => {
    if (!allReceipts) return null;
    
    const currentMonthStart = startOfMonth(new Date());
    const receiptsThisMonth = allReceipts.filter(r => new Date(r.date.replace(/-/g, '/')) >= currentMonthStart);
    
    const spendingMap = receiptsThisMonth.reduce((acc, receipt) => {
      const category = receipt.category;
      const amount = Number(receipt.amount) || 0;
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as { [key in Category]?: number });
    
    return Object.entries(spendingMap).map(([category, total]) => ({
        category: category as Category,
        total: parseFloat(total!.toFixed(2)),
    }));

  }, [allReceipts]);


  useEffect(() => {
    if (loading || !user) {
      setAllReceipts(null);
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

    const unsubscribeReceipts = listenToReceipts(user.uid, setAllReceipts, handleFetchError);
    const unsubscribeBudgets = listenToBudgets(user.uid, setBudgets, handleFetchError);

    return () => {
      unsubscribeReceipts();
      unsubscribeBudgets();
    };
  }, [user, loading, toast]);

  const isLoading = !filteredData || !budgets || !spendingThisMonth;
  const cardTitle = `Total Spending (${dateRangeOptions.find(o => o.value === dateRange)?.label})`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">A summary of your spending habits.</p>
        </div>
        <div className="w-full sm:w-auto">
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                    {dateRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
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
              <TotalSpendingCard total={filteredData.totalSpending} title={cardTitle} />
            </div>
            <div className="lg:col-span-2">
              <BudgetSummary budgets={budgets} spending={spendingThisMonth} />
            </div>
            <div className="lg:col-span-2">
              <CategorySpendingChart data={filteredData.spendingByCategory} />
            </div>
            <div className="lg:col-span-1">
              <TopSpendingCard data={filteredData.spendingByCategory} />
            </div>
            <div className="lg:col-span-3">
              <AiInsights receiptsForInsight={filteredData.receipts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
