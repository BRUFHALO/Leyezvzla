import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
  Law, 
  loadLawsFromBackend, 
  lawsCatalog, 
  thickLawIds, 
  createLawInBackend, 
  updateLawInBackend, 
  deleteLawFromBackend,
  getLawsWithMongoIds 
} from '../data/lawsData';
import { 
  Quotation, 
  saveQuotationToBackend, 
  getQuotationsFromBackend, 
  deleteQuotationFromBackend, 
  updateQuotationStatus 
} from '../data/quotationsData';
import {
  EncuadernacionType,
  getEncuadernacionesFromBackend,
  getAllEncuadernacionesFromBackend,
  createEncuadernacionInBackend,
  updateEncuadernacionInBackend,
  deleteEncuadernacionFromBackend,
  toggleEncuadernacionStatusInBackend
} from '../data/encuadernacionData';

interface AdminContextType {
  laws: Law[];
  updateLaw: (law: Law, mongoId: string) => Promise<void>;
  addLaw: (law: Omit<Law, 'id'>) => Promise<Law>;
  deleteLaw: (mongoId: string) => Promise<void>;
  paymentOptions: number[];
  updatePaymentOptions: (options: number[]) => void;
  veryThickLawIds: number[];
  updateVeryThickLawIds: (ids: number[]) => void;
  customerSelections: CustomerSelection[];
  addCustomerSelection: (selection: Omit<CustomerSelection, 'id' | 'timestamp'>) => void;
  deleteCustomerSelection: (id: string) => void;
  loading: boolean;
  error: string | null;
  refreshLaws: () => Promise<void>;
  lawsWithMongoIds: (Law & { mongoId: string })[];
  // Nuevas propiedades para quotations
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, '_id'>) => Promise<Quotation>;
  loadQuotations: () => Promise<void>;
  removeQuotation: (id: string) => Promise<void>;
  updateQuotationStatus: (id: string, estado: string, fechaEntrega?: string) => Promise<Quotation>;
  // Propiedades para encuadernación
  encuadernaciones: EncuadernacionType[];
  allEncuadernaciones: EncuadernacionType[];
  loadEncuadernaciones: () => Promise<void>;
  loadAllEncuadernaciones: () => Promise<void>;
  addEncuadernacion: (encuadernacion: Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>) => Promise<EncuadernacionType>;
  updateEncuadernacion: (id: string, encuadernacion: Partial<Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>>) => Promise<EncuadernacionType>;
  deleteEncuadernacion: (id: string) => Promise<void>;
  toggleEncuadernacionStatus: (id: string) => Promise<EncuadernacionType>;
}

export interface CustomerSelection {
  id: string;
  customerEmail: string;
  selectedLaws: Law[];
  totalPrice: number;
  bindingCost: number;
  grandTotal: number;
  paymentOption: number;
  timestamp: Date;
  volumes: Law[][];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const createSampleCustomerSelection = (): CustomerSelection => {
  const sampleLaws: Law[] = [
    { id: 1, name: 'CONSTITUCIÓN', price: 10, thickness: 'high' } as const,
    { id: 3, name: 'CÓDIGO PENAL', price: 10, thickness: 'high' } as const
  ];

  const totalPrice = sampleLaws.reduce((sum, law) => sum + law.price, 0);
  const volumes: Law[][] = [[sampleLaws[0]], [sampleLaws[1]]];
  const bindingCost = volumes.length * 10;
  const grandTotal = totalPrice + bindingCost;

  return {
    id: 'sample123',
    customerEmail: 'cliente.ejemplo@gmail.com',
    selectedLaws: sampleLaws,
    totalPrice,
    bindingCost,
    grandTotal,
    paymentOption: 3,
    timestamp: new Date(),
    volumes
  };
};

export const AdminProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawsWithMongoIds, setLawsWithMongoIds] = useState<(Law & { mongoId: string })[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('paymentOptions');
      return saved ? JSON.parse(saved) : [1, 2, 3, 4];
    } catch {
      return [1, 2, 3, 4];
    }
  });
  // Cargar veryThickLawIds desde localStorage al inicializar
  const [veryThickLawIds, setVeryThickLawIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('veryThickLawIds');
      return saved ? JSON.parse(saved) : [...thickLawIds];
    } catch (error) {
      console.error('Error al cargar veryThickLawIds:', error);
      return [...thickLawIds];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerSelections, setCustomerSelections] = useState<CustomerSelection[]>([createSampleCustomerSelection()]);
  // Mover el estado de quotations dentro del componente
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  // Estados para encuadernación
  const [encuadernaciones, setEncuadernaciones] = useState<EncuadernacionType[]>([]);
  const [allEncuadernaciones, setAllEncuadernaciones] = useState<EncuadernacionType[]>([]);

  useEffect(() => {
    refreshLaws();
    loadQuotations(); // Cargar quotations al inicializar
    loadEncuadernaciones(); // Cargar encuadernaciones al inicializar
  }, []);

    // Persistir paymentOptions en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('paymentOptions', JSON.stringify(paymentOptions));
  }, [paymentOptions]);

  // Persistir veryThickLawIds en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('veryThickLawIds', JSON.stringify(veryThickLawIds));
    } catch (error) {
      console.error('Error al guardar veryThickLawIds:', error);
    }
  }, [veryThickLawIds]);

  // Mover las funciones de quotations dentro del componente
  const addQuotation = async (quotation: Omit<Quotation, '_id'>): Promise<Quotation> => {
    try {
      const newQuotation = await saveQuotationToBackend(quotation);
      setQuotations(prev => [newQuotation, ...prev]);
      return newQuotation;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo guardar la cotización');
    }
  };

  const loadQuotations = async (): Promise<void> => {
    try {
      const quotationsData = await getQuotationsFromBackend();
      setQuotations(quotationsData);
    } catch (error: any) {
      console.error('Error al cargar cotizaciones:', error);
    }
  };

  const removeQuotation = async (id: string): Promise<void> => {
    try {
      await deleteQuotationFromBackend(id);
      setQuotations(prev => prev.filter(q => {
        const quotationId = typeof q._id === 'object' ? q._id.$oid : q._id;
        return quotationId !== id;
      }));
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo eliminar la cotización');
    }
  };

  // Funciones para encuadernación
  const loadEncuadernaciones = async (): Promise<void> => {
    try {
      console.log('Cargando encuadernaciones...');
      const encuadernacionesData = await getEncuadernacionesFromBackend();
      console.log('Encuadernaciones cargadas:', encuadernacionesData);
      setEncuadernaciones(encuadernacionesData);
    } catch (error: any) {
      console.error('Error al cargar encuadernaciones:', error);
      setError('Error al cargar tipos de encuadernación: ' + error.message);
    }
  };

  const loadAllEncuadernaciones = async (): Promise<void> => {
    try {
      const allEncuadernacionesData = await getAllEncuadernacionesFromBackend();
      setAllEncuadernaciones(allEncuadernacionesData);
    } catch (error: any) {
      console.error('Error al cargar todas las encuadernaciones:', error);
    }
  };

  const addEncuadernacion = async (encuadernacion: Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<EncuadernacionType> => {
    try {
      const newEncuadernacion = await createEncuadernacionInBackend(encuadernacion);
      await loadEncuadernaciones();
      await loadAllEncuadernaciones();
      return newEncuadernacion;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo crear la encuadernación');
    }
  };

  const updateEncuadernacion = async (id: string, encuadernacion: Partial<Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>>): Promise<EncuadernacionType> => {
    try {
      const updatedEncuadernacion = await updateEncuadernacionInBackend(id, encuadernacion);
      await loadEncuadernaciones();
      await loadAllEncuadernaciones();
      return updatedEncuadernacion;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo actualizar la encuadernación');
    }
  };

  const deleteEncuadernacion = async (id: string): Promise<void> => {
    try {
      await deleteEncuadernacionFromBackend(id);
      await loadEncuadernaciones();
      await loadAllEncuadernaciones();
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo eliminar la encuadernación');
    }
  };

  const toggleEncuadernacionStatus = async (id: string): Promise<EncuadernacionType> => {
    try {
      const updatedEncuadernacion = await toggleEncuadernacionStatusInBackend(id);
      await loadEncuadernaciones();
      await loadAllEncuadernaciones();
      return updatedEncuadernacion;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo cambiar el estado de la encuadernación');
    }
  };

  const refreshLaws = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await loadLawsFromBackend();
      const lawsWithIds = await getLawsWithMongoIds();
      setLaws(lawsCatalog);
      setLawsWithMongoIds(lawsWithIds);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las leyes desde el servidor');
      setLaws([]);
      setLawsWithMongoIds([]);
    } finally {
      setLoading(false);
    }
  };


  

  const updateLaw = async (updatedLaw: Law, mongoId: string): Promise<void> => {
    try {
      await updateLawInBackend(mongoId, updatedLaw);
      await refreshLaws();
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo actualizar la ley en el servidor');
    }
  };

  const addLaw = async (newLaw: Omit<Law, 'id'>): Promise<Law> => {
    try {
      await createLawInBackend(newLaw);
      await refreshLaws();
      
      const lawsWithIds = await getLawsWithMongoIds();
      const createdLaw = lawsWithIds.find(law => 
        law.name === newLaw.name && 
        law.price === newLaw.price
      );
      
      if (!createdLaw) {
        throw new Error('No se pudo encontrar la ley creada');
      }
      
      return createdLaw;
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo agregar la ley en el servidor');
    }
  };

  const deleteLaw = async (mongoId: string): Promise<void> => {
    try {
      await deleteLawFromBackend(mongoId);
      await refreshLaws();
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo eliminar la ley del servidor');
    }
  };

 const updatePaymentOptions = (options: number[]) => {
  // Validar que las opciones sean números válidos
  const validOptions = options.filter(opt => typeof opt === 'number' && opt > 0);
  setPaymentOptions(validOptions);
};


useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'paymentOptions' && e.newValue) {
      try {
        const newOptions = JSON.parse(e.newValue);
        if (Array.isArray(newOptions)) {
          setPaymentOptions(newOptions);
        }
      } catch (error) {
        console.error('Error al sincronizar paymentOptions:', error);
      }
    }
    
    if (e.key === 'veryThickLawIds' && e.newValue) {
      try {
        const newIds = JSON.parse(e.newValue);
        if (Array.isArray(newIds)) {
          setVeryThickLawIds(newIds);
        }
      } catch (error) {
        console.error('Error al sincronizar veryThickLawIds:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

  const updateVeryThickLawIds = (ids: number[]) => {
    try {
      // Asegurarse de que los IDs sean únicos
      const uniqueIds = [...new Set(ids)];
      setVeryThickLawIds(uniqueIds);
    } catch (error) {
      console.error('Error al actualizar veryThickLawIds:', error);
    }
  };

  const addCustomerSelection = (selection: Omit<CustomerSelection, 'id' | 'timestamp'>) => {
    const newSelection: CustomerSelection = {
      ...selection,
      id: generateId(),
      timestamp: new Date()
    };
    setCustomerSelections(prev => [newSelection, ...prev]);
  };

  const deleteCustomerSelection = (id: string) => {
    setCustomerSelections(prev => prev.filter(selection => selection.id !== id));
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  return (
    <AdminContext.Provider value={{
      laws,
      updateLaw,
      addLaw,
      deleteLaw,
      paymentOptions,
      updatePaymentOptions,
      veryThickLawIds,
      updateVeryThickLawIds,
      customerSelections,
      addCustomerSelection,
      deleteCustomerSelection,
      loading,
      error,
      refreshLaws,
      lawsWithMongoIds,
      quotations,
      addQuotation,
      loadQuotations,
      removeQuotation,
      updateQuotationStatus: async (id: string, estado: string, fechaEntrega?: string) => {
        try {
          const updatedQuotation = await updateQuotationStatus(id, estado, fechaEntrega);
          setQuotations(prev => prev.map(q => 
            (typeof q._id === 'object' ? q._id.$oid : q._id) === id 
              ? updatedQuotation 
              : q
          ));
          return updatedQuotation;
        } catch (error: any) {
          throw new Error(error.message || 'Error al actualizar estado de cotización');
        }
      },
      encuadernaciones,
      allEncuadernaciones,
      loadEncuadernaciones,
      loadAllEncuadernaciones,
      addEncuadernacion,
      updateEncuadernacion,
      deleteEncuadernacion,
      toggleEncuadernacionStatus
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
