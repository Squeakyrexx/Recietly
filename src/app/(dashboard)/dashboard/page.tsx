import { TotalSpendingCard, TopSpendingCard } from '@/components/dashboard/dashboard-cards';
import { CategorySpendingChart } from '@/components/dashboard/category-spending-chart';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { getSpendingByCategory, getTotalSpending } from '@/lib/mock-data';

export default function DashboardPage() {
  // In a real app, this data would be fetched for the logged-in user
  const totalSpending = getTotalSpending();
  const spendingByCategory = getSpendingByCategory();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">A summary of your spending habits.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TotalSpendingCard total={totalSpending} />
        </div>
        <div className="lg:col-span-2">
          <CategorySpendingChart data={spendingByCategory} />
        </div>
        <div className="lg:col-span-1">
            <TopSpendingCard data={spendingByCategory} />
        </div>
        <div className="lg:col-span-2">
          <AiInsights />
        </div>
      </div>
    </div>
  );
}
