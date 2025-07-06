
'use client';

import { useState, useEffect, useMemo } from 'react';
import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { listenToReceipts, listenToBudgets } from '@/lib/mock-data';
import { BudgetSummary } from '@/components/dashboard/budget-summary';
import { useAuth } from '@/context/auth-context';
import { type SpendingByCategory, type Category, type Receipt, CATEGORIES } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subYears, endOfToday, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveCalendarView } from '@/components/dashboard/interactive-calendar-view';
import { LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type DateRange = 'this-month' | 'last-3-months' | 'this-year' | 'all-time';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all-time', label: 'All Time' },
];

const getPreviousDateRange = (range: DateRange, currentStartDate: Date) => {
    const now = endOfToday();
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (range) {
        case 'this-month':
            prevStartDate = startOfMonth(subMonths(now, 1));
            prevEndDate = endOfMonth(subMonths(now, 1));
            break;
        case 'last-3-months':
             // Previous 3 months, starting from the end of the current 3-month period.
            prevStartDate = subMonths(currentStartDate, 3);
            prevEndDate = subDays(currentStartDate, 1);
            break;
        case 'this-year':
            prevStartDate = startOfYear(subYears(now, 1));
            prevEndDate = endOfYear(subYears(now, 1));
            break;
        case 'all-time':
        default:
            return { prevStartDate: null, prevEndDate: null };
    }
    return { prevStartDate, prevEndDate };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange>('this-month');
  
  const [allReceipts, setAllReceipts] = useState<Receipt[] | null>(null);
  const [budgets, setBudgets] = useState<{ [key in Category]?: number } | null>(null);

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
        startDate = new Date(0);
        break;
    }
    
    const receiptsInRange = allReceipts.filter(r => new Date(r.date.replace(/-/g, '/')) >= startDate);
    const totalSpending = receiptsInRange.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);
    const spendingMap = receiptsInRange.reduce((acc, receipt) => {
        const category = receipt.category;
        const amount = Number(receipt.amount) || 0;
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as { [key in Category]?: number });

    // Previous period calculations
    const { prevStartDate, prevEndDate } = getPreviousDateRange(dateRange, startDate);
    let previousPeriodReceipts: Receipt[] = [];
    if (prevStartDate && prevEndDate) {
        previousPeriodReceipts = allReceipts.filter(r => {
            const receiptDate = new Date(r.date.replace(/-/g, '/'));
            return receiptDate >= prevStartDate && receiptDate <= prevEndDate;
        });
    }
    const previousTotalSpending = previousPeriodReceipts.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);
    const previousSpendingMap = previousPeriodReceipts.reduce((acc, receipt) => {
        const category = receipt.category;
        const amount = Number(receipt.amount) || 0;
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as { [key in Category]?: number });

    // Combine current and previous data for the chart
    const spendingByCategoryWithComparison = CATEGORIES.map(category => {
        const currentTotal = spendingMap[category] || 0;
        const previousTotal = previousSpendingMap[category] || 0;
        return {
            category,
            total: parseFloat(currentTotal.toFixed(2)),
            previousTotal: parseFloat(previousTotal.toFixed(2)),
        };
    }).filter(d => d.total > 0 || d.previousTotal > 0);

    // Sort for TopSpendingCard
    const spendingByCategory = Object.entries(spendingMap).map(([category, total]) => ({
        category: category as Category,
        total: parseFloat(total!.toFixed(2)),
    }));
    
    return {
      receipts: receiptsInRange,
      totalSpending,
      previousTotalSpending,
      spendingByCategory,
      spendingByCategoryWithComparison,
    }
  }, [allReceipts, dateRange]);

  const { spendingThisMonth } = useMemo(() => {
    if (!allReceipts) return { spendingThisMonth: null };
    
    const currentMonthStart = startOfMonth(new Date());
    const receiptsInMonth = allReceipts.filter(r => new Date(r.date.replace(/-/g, '/')) >= currentMonthStart);
    
    const spendingMap = receiptsInMonth.reduce((acc, receipt) => {
      const category = receipt.category;
      const amount = Number(receipt.amount) || 0;
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as { [key in Category]?: number });
    
    const spendingByCategory = Object.entries(spendingMap).map(([category, total]) => ({
        category: category as Category,
        total: parseFloat(total!.toFixed(2)),
    }));
    
    return { spendingThisMonth: spendingByCategory };

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

  const isLoading = !filteredData || !budgets || !spendingThisMonth || !allReceipts;
  const cardTitle = `Total Spending (${dateRangeOptions.find(o => o.value === dateRange)?.label})`;
  const showComparison = dateRange !== 'all-time';

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A summary of your spending habits.</p>
      </header>

      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
              <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/>Overview</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarIcon className="mr-2 h-4 w-4"/>Calendar</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="flex justify-end">
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
            </div>
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
                    <TotalSpendingCard 
                      total={filteredData.totalSpending} 
                      title={cardTitle} 
                      previousTotal={showComparison ? filteredData.previousTotalSpending : undefined}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <BudgetSummary budgets={budgets!} spending={spendingThisMonth!} />
                  </div>
                  <div className="lg:col-span-2">
                    <CategorySpendingChart data={filteredData.spendingByCategoryWithComparison} showComparison={showComparison} />
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
          </TabsContent>
          <TabsContent value="calendar">
            {isLoading ? (
              <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-[520px] w-full" />
                  </CardContent>
               </Card>
            ) : (
              <InteractiveCalendarView receipts={allReceipts!} setAllReceipts={setAllReceipts} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
