
import EnhanceLPRForm from '@/components/plate-detective/PlateDetectiveForm';
import { Car } from 'lucide-react';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8_lg:p-12 bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto max-w-5xl py-8">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Car className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tight">
            Enhance<span className="text-primary">LPR</span>
          </h1>
          <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered license plate recognition and validation.
          </p>
        </header>
        <EnhanceLPRForm />
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EnhanceLPR. All rights reserved.</p>
          <p className="mt-1">Powered by BackBenchers.</p>
        </footer>
      </div>
    </main>
  );
}

