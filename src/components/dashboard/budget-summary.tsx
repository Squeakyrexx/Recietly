import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type SpendingByCategory, type Category } from "@/lib/types";
import { PiggyBank } from "lucide-react";
import { Progress } from "../ui/progress";
import Link from "next/link";
import { Button } from "../ui/button";

interface BudgetSummaryProps {
    budgets: { [key in Category]?: number };
    spending: SpendingByCategory[];
}

export function BudgetSummary({ budgets, spending }: BudgetSummaryProps) {
    const spendingMap = spending.reduce((acc, item) => {
        acc[item.category] = item.total;
        return acc;
    }, {} as { [key: string]: number });

    const budgetedItems = Object.entries(budgets)
        .filter(([, amount]) => amount !== undefined && amount > 0)
        .map(([category, budget]) => ({ category, budget: budget! }));

    if (budgetedItems.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-primary" /> Budget Summary
                    </CardTitle>
                    <CardDescription>Your monthly budget status.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground">
                    <p>You haven't set any budgets yet.</p>
                    <Link href="/budgets" className="mt-2">
                       <Button variant="secondary" size="sm">Set Budgets Now</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    const getProgressIndicatorClass = (progress: number) => {
        if (progress >= 100) return 'bg-destructive';
        if (progress >= 75) return 'bg-warning';
        return 'bg-primary';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" /> Budget Summary
                </CardTitle>
                <CardDescription>Your spending progress for this month.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {budgetedItems.map(({ category, budget }) => {
                       const spent = spendingMap[category] || 0;
                       const progress = budget > 0 ? (spent / budget) * 100 : 0;
                       const indicatorClass = getProgressIndicatorClass(progress);
                       
                       return (
                        <li key={category} className="space-y-1">
                           <div className="flex justify-between items-baseline">
                                <span className="font-medium">{category}</span>
                                <span className="text-sm text-muted-foreground">
                                    ${spent.toFixed(2)} / ${budget.toFixed(2)}
                                </span>
                           </div>
                           <Progress value={progress} className="h-2" indicatorClassName={indicatorClass} />
                        </li>
                       )
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
