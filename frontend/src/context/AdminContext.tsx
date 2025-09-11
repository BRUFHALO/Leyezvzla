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
import { adminCredentials } from '../data/adminData';
import { 
  Quotation, 
  saveQuotationToBackend, 
  getQuotationsFromBackend,
  deleteQuotationFromBackend 
} from '../data/quotationsData';

interface AdminContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
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
  const sampleLaws = [
    { id: 1, name: 'CONSTITUCIÓN', price: 10, thickness: 'high' },
    { id: 3, name: 'CÓDIGO PENAL', price: 10, thickness: 'high' }
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawsWithMongoIds, setLawsWithMongoIds] = useState<(Law & { mongoId: string })[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<number[]>([1, 2, 3, 4]);
  const [veryThickLawIds, setVeryThickLawIds] = useState<number[]>(thickLawIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerSelections, setCustomerSelections] = useState<CustomerSelection[]>([createSampleCustomerSelection()]);
  // Mover el estado de quotations dentro del componente
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    refreshLaws();
    loadQuotations(); // Cargar quotations al inicializar
  }, []);

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
      setQuotations(prev => prev.filter(q => q._id?.$oid !== id));
    } catch (error: any) {
      throw new Error(error.message || 'No se pudo eliminar la cotización');
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

  const login = (username: string, password: string): boolean => {
    if (username === adminCredentials.username && password === adminCredentials.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
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
    setPaymentOptions(options);
  };

  const updateVeryThickLawIds = (ids: number[]) => {
    setVeryThickLawIds(ids);
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
      isAuthenticated,
      login,
      logout,
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
      removeQuotation
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