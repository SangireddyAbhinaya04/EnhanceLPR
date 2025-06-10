
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { detectLicensePlate, DetectLicensePlateInput, DetectLicensePlateOutput } from '@/ai/flows/detect-license-plate';
import { enhanceLicensePlateImage, EnhanceLicensePlateImageInput, EnhanceLicensePlateImageOutput } from '@/ai/flows/enhance-license-plate-image';
import { extractLicensePlateText, ExtractLicensePlateTextInput, ExtractLicensePlateTextOutput } from '@/ai/flows/extract-license-plate-text';
import { validateLicensePlateFormat, ValidateLicensePlateFormatInput, ValidateLicensePlateFormatOutput } from '@/ai/flows/validate-license-plate-format';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileImage, ScanSearch, Sparkles, ClipboardCheck, Loader2, AlertCircle } from 'lucide-react';

const ResultDisplayCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; isLoading?: boolean; hasContent?: boolean }> = ({ title, icon, children, isLoading = false, hasContent = false }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasContent ? (
          children
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <FileImage className="h-12 w-12" />
            <p className="ml-2">No data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export default function EnhanceLPRForm() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [detectedPlateImage, setDetectedPlateImage] = useState<string | null>(null);
  const [processedPlateImage, setProcessedPlateImage] = useState<string | null>(null); // Renamed from enhancedPlateImage
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateLicensePlateFormatOutput | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detectionOutputStore, setDetectionOutputStore] = useState<DetectLicensePlateOutput | null>(null);


  const { toast } = useToast();

  useEffect(() => {
    if (error && !isLoading) { // only show error toast if not loading, to prevent toast stack during processing
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: error,
      });
    }
  }, [error, toast, isLoading]);

  const resetState = () => {
    setDetectedPlateImage(null);
    setProcessedPlateImage(null);
    setExtractedText(null);
    setValidationResult(null);
    setError(null);
    setCurrentStep(null);
    setProgressValue(0);
    setDetectionOutputStore(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Invalid file type. Please upload an image.");
        setOriginalImage(null);
        event.target.value = ''; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        resetState(); 
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    resetState(); // Reset previous results and errors

    let stageError = null;

    try {
      setCurrentStep("Detecting & Cropping plate...");
      setProgressValue(20);
      const detectionInput: DetectLicensePlateInput = { photoDataUri: originalImage };
      const localDetectionOutput: DetectLicensePlateOutput = await detectLicensePlate(detectionInput);
      setDetectionOutputStore(localDetectionOutput); // Store for conditional rendering
      setDetectedPlateImage(localDetectionOutput.licensePlateRegion);

      setCurrentStep(localDetectionOutput.isBlurry && localDetectionOutput.licensePlateRegion !== originalImage ? "Enhancing image..." : "Processing image...");
      setProgressValue(40);
      const enhancementInput: EnhanceLicensePlateImageInput = { 
        licensePlateDataUri: localDetectionOutput.licensePlateRegion,
        isDetectedPlateBlurry: localDetectionOutput.isBlurry && localDetectionOutput.licensePlateRegion !== originalImage // Only enhance if actually detected & blurry
      };
      const enhancementOutput: EnhanceLicensePlateImageOutput = await enhanceLicensePlateImage(enhancementInput);
      setProcessedPlateImage(enhancementOutput.processedLicensePlateDataUri);
      
      setCurrentStep("Extracting text...");
      setProgressValue(60);
      // Ensure we use the processed (potentially enhanced) image for extraction
      const plateToExtractFrom = enhancementOutput.processedLicensePlateDataUri;
      if (!plateToExtractFrom || plateToExtractFrom === "") {
        throw new Error("No valid plate image to extract text from after processing stage.");
      }
      const extractionInput: ExtractLicensePlateTextInput = { enhancedPlateDataUri: plateToExtractFrom };
      const extractionOutput: ExtractLicensePlateTextOutput = await extractLicensePlateText(extractionInput);
      setExtractedText(extractionOutput.extractedText);

      setCurrentStep("Validating format...");
      setProgressValue(80);
      if (!extractionOutput.extractedText || extractionOutput.extractedText.trim() === "") {
         setValidationResult({ isValidFormat: false, validationMessage: "No text extracted to validate." });
      } else {
        const validationInput: ValidateLicensePlateFormatInput = { licensePlateText: extractionOutput.extractedText };
        const validationOutput: ValidateLicensePlateFormatOutput = await validateLicensePlateFormat(validationInput);
        setValidationResult(validationOutput);
      }

      setCurrentStep("Analysis Complete!");
      setProgressValue(100);
      toast({
        title: "Success",
        description: "License plate analysis completed.",
      });

    } catch (err) {
      console.error("Processing error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during processing.";
      stageError = `Failed at step: ${currentStep || 'Unknown'}. Error: ${errorMessage}`;
      setError(stageError); // Set error state here to be caught by useEffect
      setProgressValue(progressValue); // Keep current progress on error
    } finally {
      setIsLoading(false);
      // Error toast is handled by useEffect watching `error` and `isLoading`
    }
  };

  const showProcessedPlateCard = !!processedPlateImage;
  const isProcessedPlateLoading = isLoading && progressValue >= 20 && progressValue < 60 && !processedPlateImage;
  // Determine if enhancement step was actually run for the "Enhanced Plate" card title
  const enhancementWasAttempted = detectionOutputStore?.isBlurry && detectionOutputStore?.licensePlateRegion !== originalImage;


  return (
    <Card className="w-full max-w-4xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center">EnhanceLPR</CardTitle>
        <CardDescription className="text-center">
          Upload an image of a vehicle to detect, enhance, and read its license plate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="image-upload" className="text-lg font-medium">Upload Vehicle Image</Label>
          <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary file:font-semibold hover:file:bg-primary/10" />
        </div>

        {originalImage && (
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-semibold mb-2 font-headline">Original Image</h3>
            <Image src={originalImage} alt="Uploaded vehicle" width={400} height={300} className="rounded-md object-contain max-h-80 w-auto mx-auto shadow-md" data-ai-hint="vehicle car" />
          </div>
        )}

        <Button onClick={processImage} disabled={isLoading || !originalImage} className="w-full text-lg py-6 bg-primary hover:bg-primary/90 active:bg-primary/80 transition-all duration-150 ease-in-out transform active:scale-95">
          {isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <ScanSearch className="mr-2 h-6 w-6" />
          )}
          {isLoading ? currentStep || "Processing..." : "Analyze Plate"}
        </Button>

        {isLoading && <Progress value={progressValue} className="w-full mt-2" />}
        
        {error && !isLoading && ( // Show persistent error message if processing is done and error exists
          <div className="p-4 mt-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ResultDisplayCard title="Detected & Cropped Plate" icon={<ScanSearch />} isLoading={isLoading && progressValue < 20} hasContent={!!detectedPlateImage}>
            {detectedPlateImage && <Image src={detectedPlateImage} alt="Detected license plate" width={300} height={150} className="rounded-md object-contain max-h-40 w-auto mx-auto shadow-sm" data-ai-hint="license plate" />}
          </ResultDisplayCard>

          <ResultDisplayCard 
            title={enhancementWasAttempted ? "Enhanced Plate" : "Processed Plate"} 
            icon={<Sparkles />} 
            isLoading={isProcessedPlateLoading} 
            hasContent={showProcessedPlateCard}
          >
            {processedPlateImage && <Image src={processedPlateImage} alt="Processed license plate" width={300} height={150} className="rounded-md object-contain max-h-40 w-auto mx-auto shadow-sm" data-ai-hint="license plate" />}
          </ResultDisplayCard>

          <ResultDisplayCard title="Extracted Text" icon={<ClipboardCheck />} isLoading={isLoading && progressValue >= 60 && progressValue < 80} hasContent={!!extractedText}>
            {extractedText && <p className="text-2xl font-mono text-center p-4 bg-muted rounded-md shadow-inner">{extractedText}</p>}
          </ResultDisplayCard>

          <ResultDisplayCard title="Validation" icon={<ClipboardCheck />} isLoading={isLoading && progressValue >= 80 && progressValue < 100 && !validationResult} hasContent={!!validationResult}>
            {validationResult && (
              <div className="space-y-1 text-center">
                <p className={`text-xl font-semibold ${validationResult.isValidFormat ? 'text-green-600' : 'text-red-600'}`}>
                  {validationResult.isValidFormat ? "Valid Format" : "Invalid Format"}
                </p>
                <p className="text-sm text-muted-foreground">{validationResult.validationMessage}</p>
              </div>
            )}
          </ResultDisplayCard>
        </div>
      </CardContent>
    </Card>
  );
}
