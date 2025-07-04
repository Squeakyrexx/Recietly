'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { extractReceiptDataAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud, File, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { type ExtractedReceiptData } from '@/lib/types';
import Image from 'next/image';

const initialState = {
  message: '',
  data: null,
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Process Receipt'
      )}
    </Button>
  );
}

export function UploadForm() {
  const [state, formAction] = useFormState(extractReceiptDataAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.message && state.data) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      formRef.current?.reset();
      setFile(null);
      setPreviewUrl(null);
    } else if (state.message && !state.data) {
       toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if(formRef.current) {
        const fileInput = formRef.current.querySelector('input[type="file"]') as HTMLInputElement;
        if(fileInput) fileInput.value = "";
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="photo">Receipt Photo</Label>
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
          {previewUrl ? (
            <div className="relative h-48 w-48">
              <Image src={previewUrl} alt="Receipt preview" layout="fill" objectFit="contain" />
              <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 bg-background rounded-full h-7 w-7" onClick={handleRemoveFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                <Label
                  htmlFor="photo"
                  className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                >
                  <span>Upload a file</span>
                  <Input id="photo" name="photo" type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleFileChange} required />
                </Label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>
        {state.errors?.photo && <p className="text-sm text-destructive mt-1">{state.errors.photo}</p>}
      </div>

      <p className="text-sm text-center text-muted-foreground">Or override with manual entry:</p>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="merchant">Merchant</Label>
          <Input id="merchant" name="merchant" placeholder="e.g., FreshMart" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" placeholder="e.g., 75.42" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category">
            <SelectTrigger>
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
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="e.g., Weekly groceries" />
        </div>
      </div>

      <SubmitButton />

      {state.data && (
        <Card className="mt-6 bg-secondary">
            <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Successfully Extracted Data</h3>
                </div>
                <div className="text-sm space-y-1 bg-background p-3 rounded-md">
                    <p><strong>Merchant:</strong> {(state.data as ExtractedReceiptData).merchant}</p>
                    <p><strong>Amount:</strong> ${(state.data as ExtractedReceiptData).amount.toFixed(2)}</p>
                    <p><strong>Date:</strong> {new Date((state.data as ExtractedReceiptData).date).toLocaleDateString()}</p>
                    <p><strong>Category:</strong> {(state.data as ExtractedReceiptData).category}</p>
                    <p><strong>Description:</strong> {(state.data as ExtractedReceiptData).description}</p>
                </div>
            </CardContent>
        </Card>
      )}
    </form>
  );
}
