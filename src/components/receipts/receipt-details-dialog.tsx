
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Receipt, CATEGORIES } from '@/lib/types';
import { Loader2, Save, Trash2, Briefcase } from 'lucide-react';
import { updateReceiptAction, deleteReceiptAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Switch } from '../ui/switch';

interface ReceiptDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: Receipt | null;
  onReceiptUpdate: (updatedReceipt: Receipt) => void;
  onReceiptDelete: (deletedReceiptId: string) => void;
}

export function ReceiptDetailsDialog({
  open,
  onOpenChange,
  receipt,
  onReceiptUpdate,
  onReceiptDelete,
}: ReceiptDetailsDialogProps) {
  const [isSaving, startSavingTransition] = useTransition();
  const [isDeleting, startDeletingTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const [editedReceipt, setEditedReceipt] = useState<Receipt | null>(receipt);

  useEffect(() => {
    setEditedReceipt(receipt);
  }, [receipt]);

  if (!editedReceipt) return null;

  const handleFieldChange = (field: keyof Omit<Receipt, 'id' | 'imageDataUri'>, value: string | number | boolean) => {
    setEditedReceipt({ ...editedReceipt, [field]: value } as Receipt);
  };
  
  const handleSave = () => {
    if (!editedReceipt || !user) return;
    
    startSavingTransition(async () => {
      const result = await updateReceiptAction(user.uid, editedReceipt);
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

  const handleDelete = () => {
    if (!editedReceipt || !user) return;
    
    startDeletingTransition(async () => {
      const result = await deleteReceiptAction(user.uid, editedReceipt.id);
      if (result.success) {
        toast({
          title: 'Receipt Deleted',
        });
        onReceiptDelete(editedReceipt.id);
        onOpenChange(false);
      } else {
        toast({
          title: 'Error Deleting',
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
            <div className="flex items-center space-x-3 rounded-md border p-3">
              <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="edit-is-business-expense" className="font-medium cursor-pointer">
                  Business Expense
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark this if it's a tax-deductible expense.
                </p>
              </div>
              <Switch
                id="edit-is-business-expense"
                checked={!!editedReceipt.isBusinessExpense}
                onCheckedChange={(checked) => handleFieldChange('isBusinessExpense', checked)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className='sm:justify-between'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className='mr-auto' disabled={isDeleting}>
                    <Trash2 className="mr-2" /> Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this receipt from your records.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                        ) : (
                            'Yes, delete it'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className='flex gap-2'>
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
