'use client';

import { useRef, useState, useTransition } from 'react';
import { extractReceiptDataAction, saveReceiptAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { type ExtractedReceiptData } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
import { useRouter } from 'next/navigation';

export function UploadForm() {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<ExtractedReceiptData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleProcessReceipt = () => {
    if (!file) {
      toast({
        title: 'Upload Error',
        description: 'Please select a file to process.',
        variant: 'destructive',
      });
      return;
    }

    startExtractionTransition(async () => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const result = await extractReceiptDataAction(formData);

      if (result.data) {
        setReceiptData(result.data);
        setIsConfirming(true);
        toast({
          title: 'Data Extracted',
          description: 'Please review the information below and save.',
        });
      } else {
        toast({
          title: 'Extraction Error',
          description: result.errors?._form?.[0] || 'Could not extract data from the image.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = () => {
    if (!receiptData) return;
    
    startSavingTransition(async () => {
        const result = await saveReceiptAction({ receiptData });
        if (result.success) {
            toast({
                title: 'Success!',
                description: result.message,
            });
            resetForm();
            router.push('/receipts');
        } else {
            toast({
                title: 'Error Saving',
                description: result.message,
                variant: 'destructive',
            });
        }
    });
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setReceiptData(null);
    setIsConfirming(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleManualEntry = () => {
    setReceiptData({
        merchant: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        description: '',
    });
    setPreviewUrl(null);
    setIsConfirming(true);
  };
  
  return (
    <>
      <ConfirmationDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        receiptData={receiptData}
        setReceiptData={setReceiptData}
        previewUrl={previewUrl}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <div className="space-y-6">
        <div>
          <Label htmlFor="photo">Receipt Photo</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
            {previewUrl ? (
              <div className="relative h-48 w-48">
                <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 bg-background rounded-full h-7 w-7"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
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
                    <Input
                      id="photo"
                      name="photo"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                  </Label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
              Want to skip the upload? <Button variant="link" type="button" className="p-0 h-auto" onClick={handleManualEntry}>Enter details manually</Button>
          </p>
        </div>
        
        {file && (
          <Button onClick={handleProcessReceipt} disabled={isExtracting} className="w-full">
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting Data...
              </>
            ) : (
              'Process Receipt'
            )}
          </Button>
        )}
      </div>
    </>
  );
}
