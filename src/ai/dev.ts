import { config } from 'dotenv';
config();

import '@/ai/flows/generate-spending-insights.ts';
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/generate-receipt-narration.ts';
