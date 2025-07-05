
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { revalidateAllAction } from '@/lib/actions';
import { setBudget } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { type Category, type SpendingByCategory, CATEGORIES } from '@/lib/types';
import { Progress } from '../ui/progress';
import { useAuth } from '@/context/auth-context';
import { z } from 'zod';
import { getCategoryBgStyle } from '@/lib/utils';

interface BudgetFormProps {
  initialBudgets: { [key: string]: number };
  spendingThisMonth: SpendingByCategory[];
}

const budgetSchema = z.object({
    category: z.enum(CATEGORIES),
    amount: z.coerce.number().min(0, 'Budget amount cannot be negative.')
});

export function BudgetForm({ initialBudgets, spendingThisMonth }: BudgetFormProps) {
  const [budgets, setBudgets] = useState(initialBudgets);
  const [pendingSaves, setPendingSaves] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleBudgetChange = (category: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setBudgets((prev) => ({ ...prev, [category]: amount }));
  };

  const handleSave = (category: Category) => {
    if (!user) {
        toast({ title: 'Not authenticated', variant: 'destructive'});
        return;
    }
    const amount = budgets[category];
    const validation = budgetSchema.safeParse({ category, amount });

    if (!validation.success) {
        toast({ title: 'Invalid Input', description: validation.error.errors.map(e => e.message).join(', '), variant: 'destructive' });
        return;
    }

    setPendingSaves((prev) => ({ ...prev, [category]: true }));

    startTransition(async () => {
      try {
        await setBudget(user.uid, validation.data);
        await revalidateAllAction();
        toast({
          title: 'Budget Saved',
          description: `Your budget for ${category} has been updated.`,
        });
      } catch (e) {
        const err = e as Error;
        toast({
          title: 'Error',
          description: err.message || "Could not save budget.",
          variant: 'destructive',
        });
      } finally {
        setPendingSaves((prev) => ({ ...prev, [category]: false }));
      }
    });
  };

  const spendingMap = spendingThisMonth.reduce((acc, item) => {
    acc[item.category] = item.total;
    return acc;
  }, {} as { [key: string]: number });

  const getProgressIndicatorClass = (progress: number, category: Category) => {
    if (progress >= 100) return 'bg-destructive';
    if (progress >= 75) return 'bg-warning';
    return getCategoryBgStyle(category);
  };

  return (
    <div className="space-y-6">
      {Object.entries(budgets).map(([category, amount]) => {
        const spent = spendingMap[category] || 0;
        const budgetAmount = amount || 0;
        const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        const remaining = budgetAmount - spent;
        const indicatorClass = getProgressIndicatorClass(progress, category as Category);

        return (
          <div key={category} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              <Label htmlFor={`budget-${category}`} className="font-medium text-base md:col-span-1">{category}</Label>
              <div className="flex items-center gap-2 md:col-span-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id={`budget-${category}`}
                  type="number"
                  placeholder="e.g., 500"
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => handleBudgetChange(category, e.target.value)}
                  className="max-w-[150px]"
                />
                <Button 
                    onClick={() => handleSave(category as Category)} 
                    disabled={pendingSaves[category] || isPending}
                    size="sm"
                >
                  {pendingSaves[category] ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  <span className="sr-only">Save</span>
                </Button>
              </div>
            </div>
            {budgetAmount > 0 && (
                <div className='pl-2 pr-1'>
                    <Progress value={progress} className="h-2" indicatorClassName={indicatorClass} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>${spent.toFixed(2)} spent</span>
                        <span>${remaining.toFixed(2)} remaining</span>
                    </div>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
