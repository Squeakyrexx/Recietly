import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type SpendingByCategory } from "@/lib/types";
import { DollarSign, TrendingUp } from "lucide-react";
import { getIconForCategory, Icons } from "@/components/icons";

export function TotalSpendingCard({ total }: { total: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Spending (This Month)</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
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
                <CardDescription>Your biggest spending areas this month.</CardDescription>
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
                               <p className="font-medium">{item.category}</p>
                           </div>
                           <p className="font-semibold">${item.total.toLocaleString('en-US')}</p>
                        </li>
                       )
                    })}
                </ul>
               ) : (
                <div className="text-center text-muted-foreground py-4">
                    No spending recorded this month.
                </div>
               )}
            </CardContent>
        </Card>
    );
}
