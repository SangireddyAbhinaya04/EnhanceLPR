
# EnhanceLPR: AI-Powered License Plate Recognition

## Introduction

EnhanceLPR is an advanced web application designed for the detection, enhancement, and validation of vehicle license plates from images. Utilizing a sophisticated AI pipeline, it can:

1.  **Detect & Crop**: Identify and isolate license plates from a larger vehicle image, even if the plate is at an angle.
2.  **Enhance**: Improve the clarity of blurry or low-resolution cropped license plates.
3.  **Extract Text**: Perform Optical Character Recognition (OCR) on the processed plate image to extract the license plate number.
4.  **Validate**: Check the extracted text against standard Indian license plate formats.

This application is built using Next.js for the frontend, Genkit (with Google's Gemini models) for the AI backend functionalities, and ShadCN UI components with Tailwind CSS for a modern and responsive user interface.

## Features

-   **Image Upload**: Users can upload images of vehicles.
-   **Automated AI Pipeline**:
    -   Detection of the license plate region within the uploaded image.
    -   Cropping of the detected license plate.
    -   Assessment of blurriness on the cropped plate.
    -   Conditional enhancement of the plate image if it's deemed blurry.
    -   Text extraction (OCR) from the (potentially enhanced) plate.
    -   Validation of the extracted text against Indian license plate formatting rules.
-   **Visual Feedback**: Displays the original image, detected/cropped plate, enhanced plate (if applicable), extracted text, and validation results.
-   **Progress Indication**: Shows the current step and overall progress during the analysis.
-   **Error Handling**: Provides feedback for processing errors.
-   **Responsive Design**: Adapts to various screen sizes.

## Getting Started / Installation

This project is set up to run within Firebase Studio, which handles much of the environment configuration.

To run the project locally after cloning or setting it up in your environment:

1.  **Install Dependencies**:
    Open a terminal in the project's root directory and run:
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Environment Variables**:
    This project uses Genkit, which typically requires an API key for the underlying AI models (e.g., Google AI Studio API key for Gemini).
    - Create a `.env` file in the root of the project.
    - Add your API key like this:
      ```
      GOOGLE_API_KEY=YOUR_API_KEY_HERE
      ```
    *Note: Ensure this `.env` file is listed in your `.gitignore` to prevent committing sensitive keys.*

3.  **Run the Development Server**:
    To start the Next.js development server:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will typically start the application on `http://localhost:9002` (or another port if 9002 is in use).

4.  **Run the Genkit Development Server (Optional but Recommended for AI development)**:
    Genkit flows can be tested and debugged using the Genkit developer UI. To start it:
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch # (for auto-reloading on changes)
    ```
    This usually starts the Genkit UI on `http://localhost:4000`.

## Expected Results

When a user uploads a vehicle image:

-   The application will process the image through the AI pipeline.
-   **Detected & Cropped Plate**: A card will display the region of the image identified as the license plate, tightly cropped.
-   **Enhanced/Processed Plate**: If the detected plate was blurry, this card shows an enhanced version. Otherwise, it shows the cropped plate.
-   **Extracted Text**: The license plate characters recognized by the OCR process will be displayed.
-   **Validation**: The system will indicate whether the extracted text conforms to a standard Indian license plate format and provide a brief explanation.

The accuracy of detection, enhancement, OCR, and validation depends on the quality of the uploaded image and the capabilities of the AI models.

## Technology Stack

-   **Frontend**: Next.js (with App Router), React, TypeScript
-   **Styling**: Tailwind CSS, ShadCN UI
-   **AI Backend/Orchestration**: Genkit
-   **AI Models**: Google Gemini (via `@genkit-ai/googleai`)
-   **IDE (Recommended)**: VS Code

---

This README provides a basic overview. For more detailed insights into specific components or AI flows, please refer to the source code comments and documentation within the respective files.
