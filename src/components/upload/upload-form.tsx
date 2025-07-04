'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { extractReceiptDataAction, saveReceiptAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, UploadCloud, X, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type ExtractedReceiptData } from '@/lib/types';
import Image from 'next/image';

const initialState = {
  message: '',
  data: null,
  errors: null,
};

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Extracting Data...
        </>
      ) : (
        'Process Receipt'
      )}
    </Button>
  );
}

export function UploadForm() {
  const [extractionState, formAction, isExtracting] = useActionState(extractReceiptDataAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [view, setView] = useState<'upload' | 'confirm'>('upload');
  const [receiptData, setReceiptData] = useState<ExtractedReceiptData | null>(null);
  const [isSaving, startSavingTransition] = useTransition();

  useEffect(() => {
    if (isExtracting) return; // Don't show toasts while the action is pending

    if (extractionState.data) {
      setReceiptData(extractionState.data);
      setView('confirm');
      toast({
        title: 'Data Extracted',
        description: 'Please review the information below and save.',
      });
    } else if (extractionState.errors) {
       toast({
        title: 'Upload Error',
        description: extractionState.errors?.photo?.[0] || extractionState.errors?._form?.[0] || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }
  }, [extractionState, isExtracting, toast]);

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

  const handleSave = () => {
    if (!receiptData) return;
    
    startSavingTransition(async () => {
        const result = await saveReceiptAction(receiptData);
        if (result.success) {
            toast({
                title: 'Success!',
                description: result.message,
            });
            // Reset the entire form state
            setView('upload');
            setFile(null);
            setPreviewUrl(null);
            setReceiptData(null);
            formRef.current?.reset();
        } else {
            toast({
                title: 'Error Saving',
                description: result.message,
                variant: 'destructive',
            });
        }
    });
  }
  
  const handleManualEntry = () => {
    setReceiptData({
        merchant: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        description: '',
    });
    setView('confirm');
  };

  const handleDiscard = () => {
      setView('upload');
      setReceiptData(null);
      // Keep file and preview so user can retry extraction
  }

  if (view === 'confirm' && receiptData) {
    return (
        <div className="space-y-6">
            <div className="relative h-64 w-full rounded-lg overflow-hidden border">
                {previewUrl ? (
                    <Image src={previewUrl} alt="Receipt preview" layout="fill" objectFit="contain" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                )}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Review Extracted Data</CardTitle>
                    <CardDescription>
                        Please check the information extracted by the AI. You can make corrections before saving.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-merchant">Merchant</Label>
                            <Input id="confirm-merchant" value={receiptData.merchant} onChange={e => setReceiptData({...receiptData, merchant: e.target.value})} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="confirm-amount">Amount</Label>
                            <Input id="confirm-amount" type="number" step="0.01" value={receiptData.amount} onChange={e => setReceiptData({...receiptData, amount: parseFloat(e.target.value) || 0})} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="confirm-date">Date</Label>
                            <Input id="confirm-date" type="date" value={receiptData.date.split('T')[0]} onChange={e => setReceiptData({...receiptData, date: e.target.value})} />
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="confirm-category">Category</Label>
                            <Select value={receiptData.category} onValueChange={value => setReceiptData({...receiptData, category: value})}>
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
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label htmlFor="confirm-description">Description</Label>
                            <Textarea id="confirm-description" value={receiptData.description} onChange={e => setReceiptData({...receiptData, description: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
                        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2" /> Save Receipt</>}
                        </Button>
                        <Button variant="outline" onClick={handleDiscard} className="w-full sm:w-auto">
                           <ArrowLeft className="mr-2"/> Re-upload or Edit
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
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
                  <Input id="photo" name="photo" type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleFileChange} required/>
                </Label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, WEBP, GIF up to 10MB</p>
            </div>
          )}
        </div>
        {extractionState?.errors?.photo && !isExtracting && <p className="text-sm text-destructive mt-1">{extractionState.errors.photo[0]}</p>}
      </div>

       <div className="text-center">
        <p className="text-sm text-muted-foreground">
            Want to skip the upload? <Button variant="link" type="button" className="p-0 h-auto" onClick={handleManualEntry}>Enter details manually</Button>
        </p>
       </div>
       
      {file && <UploadButton />}
    </form>
  );
}
