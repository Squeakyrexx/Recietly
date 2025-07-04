'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { type Receipt, CATEGORIES } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';
import { updateReceiptAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt | null;
  onReceiptUpdate: (updatedReceipt: Receipt) => void;
}

export function ReceiptDetailsDialog({
  open,
  onOpenChange,
  receipt,
  onReceiptUpdate,
}: ReceiptDetailsDialogProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const [editedReceipt, setEditedReceipt] = useState<Receipt | null>(receipt);

  useEffect(() => {
    setEditedReceipt(receipt);
  }, [receipt]);

  if (!editedReceipt) return null;

  const handleFieldChange = (field: keyof Omit<Receipt, 'id' | 'imageDataUri'>, value: string | number) => {
    setEditedReceipt({ ...editedReceipt, [field]: value });
  };
  
  const handleSave = () => {
    if (!editedReceipt) return;
    
    startSavingTransition(async () => {
      const result = await updateReceiptAction(editedReceipt);
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        onReceiptUpdate(editedReceipt);
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Saving',
          description: result.message,
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
          <DialogDescription>
            View or edit the details for this receipt.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative h-96 w-full rounded-lg overflow-hidden border">
            {editedReceipt.imageDataUri ? (
              <Image src={editedReceipt.imageDataUri} alt="Receipt preview" fill className="object-contain" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <p className="text-muted-foreground">No image preview</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-merchant">Merchant</Label>
              <Input
                id="edit-merchant"
                value={editedReceipt.merchant}
                onChange={(e) => handleFieldChange('merchant', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editedReceipt.amount}
                onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editedReceipt.date.split('T')[0]} // Show only date part
                onChange={(e) => handleFieldChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editedReceipt.category}
                onValueChange={(value) => handleFieldChange('category', value)}
              >
                <SelectTrigger id="edit-category">
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedReceipt.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</>
            ) : (
              <><Save className="mr-2" /> Save Changes</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
