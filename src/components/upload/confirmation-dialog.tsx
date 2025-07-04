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
import { type ExtractedReceiptData } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ExtractedReceiptData | null;
  setReceiptData: (data: ExtractedReceiptData | null) => void;
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

  const handleFieldChange = (field: keyof ExtractedReceiptData, value: string | number) => {
    setReceiptData({ ...receiptData, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            Please check the information extracted by the AI. You can make corrections before saving.
          </DialogDescription>
        </DialogHeader>
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
                  <SelectItem value="Groceries">Groceries</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Dining">Dining</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
          </div>
        </div>
        <DialogFooter>
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
