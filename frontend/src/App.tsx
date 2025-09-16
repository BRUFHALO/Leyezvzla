// App.tsx
import { useMemo, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LawCatalog } from './components/LawCatalog';
import { QuoteSummary } from './components/QuoteSummary';
import { lawsCatalog, loadLawsFromBackend, staticLawsCatalog } from './data/lawsData';
import { BookIcon } from 'lucide-react';
import { AdminButton } from './components/AdminButton';

export function App() {
  const [selectedLawIds, setSelectedLawIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLaws, setCurrentLaws] = useState(staticLawsCatalog);

  // Cargar leyes al iniciar
  useEffect(() => {
    const initializeLaws = async () => {
      try {
        setIsLoading(true);
        await loadLawsFromBackend();
        setCurrentLaws(lawsCatalog);
      } catch (error) {
        console.error('Error inicializando leyes:', error);
        setCurrentLaws(staticLawsCatalog);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLaws();
  }, []);

  // Toggle selection of a law
  const handleSelectLaw = (lawId: number) => {
    setSelectedLawIds(prev => prev.includes(lawId) ? prev.filter(id => id !== lawId) : [...prev, lawId]);
  };

  // Función para resetear la selección
  const handleResetSelection = () => {
    setSelectedLawIds([]);
  };

  // Get full law objects for selected IDs
  const selectedLaws = useMemo(() => {
    return currentLaws.filter(law => selectedLawIds.includes(law.id));
  }, [selectedLawIds, currentLaws]);

  // Calculate total price of selected laws
  const totalPrice = useMemo(() => {
    return selectedLaws.reduce((sum, law) => sum + law.price, 0);
  }, [selectedLaws]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando catálogo de leyes...</p>
        </div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />
      <header className="bg-blue-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookIcon size={28} className="mr-2" />
              <h1 className="text-2xl font-bold">
                Sistema de Cotización Legal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                Seleccione leyes, reciba cotizaciones al instante
              </div>
              <AdminButton />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LawCatalog 
            laws={currentLaws} 
            selectedLaws={selectedLawIds} 
            onSelectLaw={handleSelectLaw} 
          />
          <QuoteSummary 
            selectedLaws={selectedLaws} 
            totalPrice={totalPrice} 
            onResetSelection={handleResetSelection} 
          />
        </div>
      </main>
      <footer className="bg-gray-800 text-gray-300 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm">
          Sistema de Selección y Cotización de Leyes &copy;{' '}
          {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}