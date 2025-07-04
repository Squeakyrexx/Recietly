import { getBudgets, getSpendingByCategory } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { CATEGORIES } from "@/lib/types";

export default function BudgetsPage() {
  const initialBudgets = getBudgets();
  const spendingThisMonth = getSpendingByCategory({ month: 'current' });

  // Ensure all categories have a budget entry, defaulting to 0
  const budgetsWithDefaults = CATEGORIES.reduce((acc, category) => {
    acc[category] = initialBudgets[category] || 0;
    return acc;
  }, {} as { [key: string]: number });

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
            <BudgetForm initialBudgets={budgetsWithDefaults} spendingThisMonth={spendingThisMonth}/>
        </CardContent>
      </Card>
    </div>
  );
}
