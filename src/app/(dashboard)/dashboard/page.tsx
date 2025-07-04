import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { getSpendingByCategory, getTotalSpending, getBudgets } from '@/lib/mock-data';
import { BudgetSummary } from '@/components/dashboard/budget-summary';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // In a real app, this data would be fetched for the logged-in user
  const totalSpending = await getTotalSpending({ month: 'current' });
  const spendingByCategory = await getSpendingByCategory({ month: 'current' });
  const budgets = await getBudgets();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A summary of your spending habits for this month.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TotalSpendingCard total={totalSpending} />
        </div>
        <div className="lg:col-span-2">
          <BudgetSummary budgets={budgets} spending={spendingByCategory} />
        </div>
        <div className="lg:col-span-2">
          <CategorySpendingChart data={spendingByCategory} />
        </div>
        <div className="lg:col-span-1">
            <TopSpendingCard data={spendingByCategory} />
        </div>
        <div className="lg:col-span-3">
          <AiInsights />
        </div>
      </div>
    </div>
  );
}
