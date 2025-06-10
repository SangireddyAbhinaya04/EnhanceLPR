# **App Name**: PlateDetective

## Core Features:

- Image Upload: Accept image uploads via a drag-and-drop interface, handling common image formats.
- License Plate Detection: Detect license plate regions within uploaded images using a Roboflow-trained YOLOv8 model.
- Image Enhancement: Enhance the detected license plate region using Real ESRGAN for better character clarity.
- Character Recognition: Extract text from the enhanced license plate image using EasyOCR.
- Format Validation: Validate the extracted text against common license plate formats as a tool, improving accuracy.
- Results Display: Display the original image, detected license plate region, recognized text, and validation status.
- Logging and History: Log all processed plates, detection confidence, and recognition results for auditing.

## Style Guidelines:

- Primary color: Dark moderate blue (#4A64FE), chosen to suggest both authority and precision without being as cold as pure blue. This aligns well with the law enforcement applications implied by the user's prompt.
- Background color: Very light desaturated blue (#F0F2FF).
- Accent color: Soft orange (#FCA311), to highlight key actionable items without being alarming.
- Headline font: 'Space Grotesk', a geometric sans-serif to reflect technology. Body font: 'Inter', for clear readability.
- Use flat, vector-based icons for clarity and scalability.
- Maintain a clean, organized layout with clear visual hierarchy to guide users through the analysis process.
- Use subtle animations, such as fade-ins and transitions, to provide feedback without being distracting.