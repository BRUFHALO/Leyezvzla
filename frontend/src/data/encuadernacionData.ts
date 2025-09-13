export interface EncuadernacionType {
  _id?: string;
  material: string;
  tamano: string;
  precio: number;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

const API_BASE_URL = 'http://127.0.0.1:8005';

// Función para obtener todas las encuadernaciones activas
export const getEncuadernacionesFromBackend = async (): Promise<EncuadernacionType[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener encuadernaciones:', error);
    throw error;
  }
};

// Función para obtener todas las encuadernaciones (incluyendo inactivas) para admin
export const getAllEncuadernacionesFromBackend = async (): Promise<EncuadernacionType[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion/admin`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener todas las encuadernaciones:', error);
    throw error;
  }
};

// Función para crear una nueva encuadernación
export const createEncuadernacionInBackend = async (encuadernacion: Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>): Promise<EncuadernacionType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encuadernacion),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al crear encuadernación:', error);
    throw error;
  }
};

// Función para actualizar una encuadernación
export const updateEncuadernacionInBackend = async (id: string, encuadernacion: Partial<Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>>): Promise<EncuadernacionType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(encuadernacion),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar encuadernación:', error);
    throw error;
  }
};

// Función para eliminar (desactivar) una encuadernación
export const deleteEncuadernacionFromBackend = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error al eliminar encuadernación:', error);
    throw error;
  }
};

// Función para alternar el estado activo/inactivo de una encuadernación
export const toggleEncuadernacionStatusInBackend = async (id: string): Promise<EncuadernacionType> => {
  try {
    const response = await fetch(`${API_BASE_URL}/encuadernacion/${id}/toggle`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al cambiar estado de encuadernación:', error);
    throw error;
  }
};

// Función para calcular el costo de encuadernación basado en el número de volúmenes
export const calculateEncuadernacionCost = (selectedEncuadernacion: EncuadernacionType | null, volumeCount: number): number => {
  if (!selectedEncuadernacion || volumeCount === 0) {
    return 0;
  }
  return selectedEncuadernacion.precio * volumeCount;
};

// Función para determinar si las leyes seleccionadas pueden caber en un solo volumen
export const canFitInSingleVolume = (selectedLaws: any[], veryThickLawIds: number[]): boolean => {
  // Si hay leyes muy gruesas, cada una necesita su propio volumen
  const hasVeryThickLaws = selectedLaws.some(law => veryThickLawIds.includes(law.id));
  if (hasVeryThickLaws) {
    return false;
  }
  
  // Si hay más de 3 leyes o alguna es gruesa (thickness: 'high'), necesita múltiples volúmenes
  const hasThickLaws = selectedLaws.some(law => law.thickness === 'high');
  if (selectedLaws.length > 3 || (hasThickLaws && selectedLaws.length > 1)) {
    return false;
  }
  
  return true;
};

// Datos iniciales de encuadernación basados en la imagen proporcionada
export const initialEncuadernacionData: Omit<EncuadernacionType, '_id' | 'fecha_creacion' | 'fecha_actualizacion'>[] = [
  { material: 'MDF', tamano: 'Carta', precio: 20, activo: true },
  { material: 'MDF', tamano: 'Pequeño', precio: 15, activo: true },
  { material: 'Cartón Gris', tamano: 'Pequeño', precio: 15, activo: true },
  { material: 'Plastificado', tamano: 'Carta', precio: 10, activo: true },
  { material: 'Plastificado', tamano: 'Pequeño', precio: 5, activo: true },
];
