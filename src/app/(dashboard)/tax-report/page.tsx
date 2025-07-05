
'use client';

import { useState, useEffect, useMemo } from 'react';
import { listenToReceipts } from '@/lib/mock-data';
import { useAuth } from '@/context/auth-context';
import type { Receipt, TaxCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportRow {
  category: TaxCategory | 'Uncategorized';
  count: number;
  total: number;
}

export default function TaxReportPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [allReceipts, setAllReceipts] = useState<Receipt[] | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const availableYears = useMemo(() => {
    if (!allReceipts) return [new Date().getFullYear().toString()];
    const years = new Set(allReceipts.map(r => new Date(r.date.replace(/-/g, '/')).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allReceipts]);

  const reportData = useMemo(() => {
    if (!allReceipts) return null;
    
    const yearReceipts = allReceipts.filter(r => 
        r.isBusinessExpense && new Date(r.date.replace(/-/g, '/')).getFullYear().toString() === selectedYear
    );

    const report: { [key: string]: { count: number, total: number }} = {};

    for (const receipt of yearReceipts) {
      const category = receipt.taxCategory || 'Uncategorized';
      if (!report[category]) {
        report[category] = { count: 0, total: 0 };
      }
      const amount = parseFloat(String(receipt.amount)) || 0;
      report[category].count++;
      report[category].total += amount;
    }

    const reportRows: ReportRow[] = Object.entries(report).map(([category, data]) => ({
      category: category as TaxCategory | 'Uncategorized',
      ...data,
      total: parseFloat(data.total.toFixed(2)),
    }));

    reportRows.sort((a, b) => b.total - a.total);
    
    return reportRows;
  }, [allReceipts, selectedYear]);
  
  const totalAmount = useMemo(() => {
    return reportData?.reduce((sum, row) => sum + row.total, 0) || 0;
  }, [reportData]);

  useEffect(() => {
    if (loading || !user) {
        setAllReceipts(null);
        return;
    }

    const unsubscribe = listenToReceipts(user.uid, setAllReceipts, (error) => {
        console.error("Failed to fetch receipts:", error);
        toast({
            title: 'Error Loading Data',
            description: 'Could not load your receipt data. Please try again later.',
            variant: 'destructive'
        });
    });
    
    return () => unsubscribe();
  }, [user, loading, toast]);

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      toast({ title: 'Nothing to Export', description: 'No business expenses found for the selected year.' });
      return;
    }

    const headers = ['Tax Category', 'Number of Receipts', 'Total Amount'];
    const csvRows = [headers.join(',')];

    for (const row of reportData) {
      const values = [ `"${row.category}"`, row.count, row.total.toFixed(2) ];
      csvRows.push(values.join(','));
    }
    
    // Add Total row
    csvRows.push(['"Total"', reportData.reduce((sum, r) => sum + r.count, 0), totalAmount.toFixed(2)].join(','));

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `recietly-tax-report-${selectedYear}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = allReceipts === null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Tax Report</h1>
        <p className="text-muted-foreground">A summary of your business expenses for tax purposes.</p>
      </header>
      <Card>
        <CardHeader className="flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Business Expense Summary</CardTitle>
                <CardDescription>Select a year to see your potential tax deductions.</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isLoading}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport} disabled={isLoading || !reportData || reportData.length === 0}>
                    <Download className="mr-2 h-4 w-4"/>
                    Export CSV
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                    <Skeleton className="h-12 w-full mt-2" />
                </div>
            ) : reportData && reportData.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tax Category</TableHead>
                            <TableHead className="text-right">Receipts</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.map((row) => (
                            <TableRow key={row.category}>
                                <TableCell className="font-medium">{row.category}</TableCell>
                                <TableCell className="text-right">{row.count}</TableCell>
                                <TableCell className="text-right">${row.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={2} className="font-bold text-lg">Total</TableCell>
                            <TableCell className="text-right font-bold text-lg">${totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="font-semibold text-lg">No Business Expenses Found</p>
                    <p>No business expenses were recorded for {selectedYear}.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
