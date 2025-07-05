import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type SpendingByCategory } from "@/lib/types";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { getIconForCategory, Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

export function TotalSpendingCard({ total, title, previousTotal }: { total: number, title: string, previousTotal?: number }) {
  const hasComparison = previousTotal !== undefined && previousTotal !== null;
  let percentageChange: number | null = null;
  
  if (hasComparison && previousTotal > 0) {
    percentageChange = ((total - previousTotal) / previousTotal) * 100;
  } else if (hasComparison && previousTotal === 0 && total > 0) {
    percentageChange = 100; // If previous was 0, any spending is infinite % increase, show 100%
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-bold">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
         {percentageChange !== null && (
            <p className={cn(
                "text-xs text-muted-foreground flex items-center",
                 percentageChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
                {percentageChange >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {percentageChange.toFixed(0)}% vs previous period
            </p>
         )}
      </CardContent>
    </Card>
  );
}

export function TopSpendingCard({ data }: { data: SpendingByCategory[] }) {
    const topCategories = [...data].sort((a,b) => b.total - a.total).slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Top Categories</CardTitle>
                <CardDescription>Your biggest spending areas in this period.</CardDescription>
            </CardHeader>
            <CardContent>
               {topCategories.length > 0 ? (
                 <ul className="space-y-4">
                    {topCategories.map(item => {
                       const Icon = getIconForCategory(item.category);
                       return (
                        <li key={item.category} className="flex items-center gap-4">
                           <div className="p-2 bg-muted rounded-md">
                               <Icon className="h-5 w-5 text-muted-foreground"/>
                           </div>
                           <div className="flex-1">
                               <p className="font-medium text-md">{item.category}</p>
                           </div>
                           <p className="font-semibold text-md">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </li>
                       )
                    })}
                </ul>
               ) : (
                <div className="text-center text-muted-foreground py-4">
                    No spending recorded for this period.
                </div>
               )}
            </CardContent>
        </Card>
    );
}
