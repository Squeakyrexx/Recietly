
'use client';

import { useState, useEffect, useMemo } from 'react';
import { type Receipt, CATEGORIES } from '@/lib/types';
import { ReceiptCard } from './receipt-card';
import { ReceiptDetailsDialog } from './receipt-details-dialog';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';

export function ReceiptsList({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const { toast } = useToast();
  
  // State for filters and sorting
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'business'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('date-desc');

  useEffect(() => {
    setReceipts(initialReceipts);
  }, [initialReceipts]);

  const handleReceiptUpdate = (updatedReceipt: Receipt) => {
    setReceipts(receipts.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };
  
  const handleReceiptDelete = (deletedReceiptId: string) => {
    setReceipts(receipts.filter(r => r.id !== deletedReceiptId));
    setSelectedReceipt(null);
  };

  const processedReceipts = useMemo(() => {
    let result = [...receipts];

    // 1. Tab filter (All / Business)
    if (activeTab === 'business') {
      result = result.filter(r => r.isBusinessExpense);
    }

    // 2. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(r => r.category === categoryFilter);
    }

    // 3. Sorting logic
    // By replacing hyphens with slashes, we parse dates in the local timezone,
    // which avoids "off-by-one-day" errors across different timezones.
    switch (sortOrder) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.date.replace(/-/g, '/')).getTime() - new Date(b.date.replace(/-/g, '/')).getTime());
        break;
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'date-desc':
      default:
        result.sort((a, b) => new Date(b.date.replace(/-/g, '/')).getTime() - new Date(a.date.replace(/-/g, '/')).getTime());
        break;
    }

    return result;
  }, [receipts, activeTab, categoryFilter, sortOrder]);


  const businessExpenseCount = useMemo(() => receipts.filter(r => r.isBusinessExpense).length, [receipts]);
  const allReceiptsCount = receipts.length;

  const handleExport = () => {
    if (activeTab !== 'business' || processedReceipts.length === 0) {
      toast({
        title: 'Nothing to Export',
        description: 'The export function is only available for business expenses.',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Date', 'Merchant', 'Amount', 'Category', 'Description'];
    const csvRows = [headers.join(',')];

    for (const receipt of processedReceipts) {
      const values = [
        receipt.date,
        `"${receipt.merchant.replace(/"/g, '""')}"`, // Handle quotes
        receipt.amount,
        receipt.category,
        `"${receipt.description.replace(/"/g, '""')}"`, // Handle quotes
      ];
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const date = new Date();
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    const filename = `recietly-business-export-${dateString}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (allReceiptsCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <h3 className="text-xl font-semibold">No receipts yet</h3>
        <p className="text-sm text-muted-foreground mb-4">Upload your first receipt to get started.</p>
        <Link href="/upload">
          <Button>Upload Receipt</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <ReceiptDetailsDialog
        open={!!selectedReceipt}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReceipt(null);
          }
        }}
        receipt={selectedReceipt}
        onReceiptUpdate={handleReceiptUpdate}
        onReceiptDelete={handleReceiptDelete}
      />

      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
                <TabsTrigger value="all">
                    <FileText className="mr-2 h-4 w-4"/> All Receipts ({allReceiptsCount})
                </TabsTrigger>
                <TabsTrigger value="business">
                    <Briefcase className="mr-2 h-4 w-4"/> Business ({businessExpenseCount})
                </TabsTrigger>
            </TabsList>
        </Tabs>

        {/* Filter and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end p-4 bg-card border rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="grid gap-1.5 w-full sm:w-[180px]">
                    <Label htmlFor="category-filter" className="text-sm font-medium">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger id="category-filter">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5 w-full sm:w-[180px]">
                    <Label htmlFor="sort-order" className="text-sm font-medium">Sort By</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger id="sort-order">
                            <SelectValue placeholder="Sort receipts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date-desc">Date (Newest)</SelectItem>
                            <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                            <SelectItem value="amount-desc">Amount (High-Low)</SelectItem>
                            <SelectItem value="amount-asc">Amount (Low-High)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid w-full sm:w-auto flex-shrink-0">
                <Button
                    onClick={handleExport}
                    disabled={activeTab !== 'business' || processedReceipts.length === 0}
                    variant="outline"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>
        </div>
        
        {processedReceipts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {processedReceipts.map((receipt) => (
                <div key={receipt.id} onClick={() => setSelectedReceipt(receipt)} className="cursor-pointer">
                <ReceiptCard receipt={receipt} />
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No Receipts Found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or upload a new receipt.</p>
            </div>
        )}
      </div>
    </>
  );
}
