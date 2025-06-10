import { config } from 'dotenv';
config();

import '@/ai/flows/validate-license-plate-format.ts';
import '@/ai/flows/detect-license-plate.ts';
import '@/ai/flows/enhance-license-plate-image.ts';
import '@/ai/flows/extract-license-plate-text.ts';