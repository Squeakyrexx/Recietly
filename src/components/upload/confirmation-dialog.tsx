
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type ExtractedReceiptData, CATEGORIES, TAX_CATEGORIES, type TaxCategory, type LineItem } from '@/lib/types';
import { Loader2, Save, Briefcase, ClipboardList } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type EditableReceiptData = ExtractedReceiptData & { isBusinessExpense?: boolean; taxCategory?: TaxCategory; items?: LineItem[] };

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: EditableReceiptData | null;
  setReceiptData: (data: EditableReceiptData | null) => void;
  previewUrl: string | null;
  onSave: () => void;
  isSaving: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  receiptData,
  setReceiptData,
  previewUrl,
  onSave,
  isSaving,
}: ConfirmationDialogProps) {
  if (!receiptData) return null;

  const handleFieldChange = (field: keyof EditableReceiptData, value: string | number | boolean | undefined) => {
    if (receiptData) {
      setReceiptData({ ...receiptData, [field]: value });
    }
  };

  const handleBusinessExpenseToggle = (checked: boolean) => {
    if (receiptData) {
      const newData = { ...receiptData, isBusinessExpense: checked };
      if (!checked) {
        delete newData.taxCategory;
      }
      setReceiptData(newData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm md:max-w-2xl lg:max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] grid h-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            Please check the information extracted by the AI. You can make corrections before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto py-4 -mr-6 pr-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="relative h-96 w-full rounded-lg overflow-hidden border">
                    {previewUrl ? (
                    <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
                    ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <p className="text-muted-foreground">No image preview</p>
                    </div>
                    )}
                </div>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                    <Label htmlFor="confirm-merchant">Merchant</Label>
                    <Input
                        id="confirm-merchant"
                        value={receiptData.merchant}
                        onChange={(e) => handleFieldChange('merchant', e.target.value)}
                    />
                    </div>
                    <div className="space-y-1.5">
                    <Label htmlFor="confirm-amount">Amount</Label>
                    <Input
                        id="confirm-amount"
                        type="number"
                        step="0.01"
                        value={receiptData.amount}
                        onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                    />
                    </div>
                    <div className="space-y-1.5">
                    <Label htmlFor="confirm-date">Date</Label>
                    <Input
                        id="confirm-date"
                        type="date"
                        value={receiptData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                    />
                    </div>
                    <div className="space-y-1.5">
                    <Label htmlFor="confirm-category">Category</Label>
                    <Select
                        value={receiptData.category}
                        onValueChange={(value) => handleFieldChange('category', value)}
                    >
                        <SelectTrigger id="confirm-category">
                        <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                        {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                            {category}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-1.5">
                    <Label htmlFor="confirm-description">Description</Label>
                    <Textarea
                        id="confirm-description"
                        value={receiptData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                    />
                    </div>
                    {receiptData.items && receiptData.items.length > 0 && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Key Items</Label>
                        <ScrollArea className="h-56 rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 [&_tr>td]:py-2">
                                {receiptData.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium truncate py-2">{item.name}</TableCell>
                                        <TableCell className="text-right py-2">${item.price.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </div>
                    )}
                    <div className="flex items-center space-x-3 rounded-md border p-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                        <Label htmlFor="is-business-expense" className="font-medium cursor-pointer">
                        Business Expense
                        </Label>
                        <p className="text-xs text-muted-foreground">
                        Mark this if it's a tax-deductible expense.
                        </p>
                    </div>
                    <Switch
                        id="is-business-expense"
                        checked={!!receiptData.isBusinessExpense}
                        onCheckedChange={handleBusinessExpenseToggle}
                    />
                    </div>
                    {receiptData.isBusinessExpense && (
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-tax-category">Tax Category</Label>
                            <Select
                                value={receiptData.taxCategory}
                                onValueChange={(value: TaxCategory) => handleFieldChange('taxCategory', value)}
                            >
                                <SelectTrigger id="confirm-tax-category">
                                <SelectValue placeholder="Select a tax category" />
                                </SelectTrigger>
                                <SelectContent>
                                {TAX_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                    {category}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2" /> Save Receipt</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
