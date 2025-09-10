import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8005'; 

export interface BackendLaw {
  _id: string;
  nombre: string;
  precio: number;
  grosor: string;
  categoria: string;
  fecha_actualizacion: string;
}

export interface Law {
  id: number;
  name: string;
  price: number;
  thickness: 'low' | 'medium' | 'high' | 'very_high';
}

// Mapear de backend a frontend
const mapThickness = (grosor: string): 'low' | 'medium' | 'high' | 'very_high' => {
  const thicknessMap: Record<string, 'low' | 'medium' | 'high' | 'very_high'> = {
    'Bajo': 'low',
    'Medio': 'medium', 
    'Alto': 'high',
    'Muy Alto': 'very_high'
  };
  return thicknessMap[grosor] || 'medium';
};

// Mapear de frontend a backend
const mapThicknessToBackend = (thickness: 'low' | 'medium' | 'high' | 'very_high'): string => {
  const thicknessMap: Record<string, string> = {
    'low': 'Bajo',
    'medium': 'Medio', 
    'high': 'Alto',
    'very_high': 'Muy Alto'
  };
  return thicknessMap[thickness] || 'Medio';
};

// Variable para almacenar las leyes
export let lawsCatalog: Law[] = [];


// Leyes estáticas como fallback
export const staticLawsCatalog: Law[] = [{
  id: 1,
  name: 'CONSTITUCIÓN',
  price: 10,
  thickness: 'high'
}, {
  id: 2,
  name: 'CÓDIGO ORGÁNICO PROC. PENAL',
  price: 10,
  thickness: 'medium'
}, {
  id: 3,
  name: 'CÓDIGO PENAL',
  price: 10,
  thickness: 'high'
}, {
  id: 4,
  name: 'CÓDIGO CIVIL',
  price: 20,
  thickness: 'very_high'
}, {
  id: 5,
  name: 'CÓDIGO TRIBUTARIO',
  price: 8,
  thickness: 'medium'
}, {
  id: 6,
  name: 'CÓDIGO DE COMERCIO',
  price: 12,
  thickness: 'high'
}, {
  id: 7,
  name: 'CÓDIGO DE TRABAJO',
  price: 15,
  thickness: 'very_high'
}, {
  id: 8,
  name: 'LEY DE COMPAÑÍAS',
  price: 8,
  thickness: 'medium'
}, {
  id: 9,
  name: 'LEY DE PROPIEDAD INTELECTUAL',
  price: 7,
  thickness: 'low'
}, {
  id: 10,
  name: 'LEY DE ARBITRAJE Y MEDIACIÓN',
  price: 6,
  thickness: 'low'
}, {
  id: 11,
  name: 'LEY ORGÁNICA DE GARANTÍAS JURISDICCIONALES',
  price: 9,
  thickness: 'medium'
}, {
  id: 12,
  name: 'LEY DE INQUILINATO',
  price: 5,
  thickness: 'low'
}, {
  id: 13,
  name: 'LEY NOTARIAL',
  price: 7,
  thickness: 'medium'
}, {
  id: 14,
  name: 'LEY DE MERCADO DE VALORES',
  price: 8,
  thickness: 'medium'
}, {
  id: 15,
  name: 'LEY ORGÁNICA DE SALUD',
  price: 9,
  thickness: 'medium'
}, {
  id: 16,
  name: 'LEY ORGÁNICA DE EDUCACIÓN',
  price: 8,
  thickness: 'medium'
}, {
  id: 17,
  name: 'LEY DE SEGURIDAD SOCIAL',
  price: 10,
  thickness: 'high'
}, {
  id: 18,
  name: 'LEY DE RÉGIMEN TRIBUTARIO',
  price: 12,
  thickness: 'high'
}, {
  id: 19,
  name: 'LEY DE CONTRATACIÓN PÚBLICA',
  price: 9,
  thickness: 'medium'
}, {
  id: 20,
  name: 'LEY DE HIDROCARBUROS',
  price: 7,
  thickness: 'medium'
}, {
  id: 21,
  name: 'LEY DE MINERÍA',
  price: 6,
  thickness: 'low'
}, {
  id: 22,
  name: 'LEY DE COMUNICACIÓN',
  price: 8,
  thickness: 'medium'
}, {
  id: 23,
  name: 'LEY DE TRÁNSITO',
  price: 7,
  thickness: 'medium'
}, {
  id: 24,
  name: 'CÓDIGO ORGÁNICO GENERAL DE PROCESOS',
  price: 15,
  thickness: 'very_high'
}];

// Variable que se actualizará con las leyes del backend


// Función para cargar leyes desde el backend
export const loadLawsFromBackend = async (): Promise<Law[]> => {
  try {
    const response = await axios.get<BackendLaw[]>(`${API_BASE_URL}/leyes`);
    
    const convertedLaws: Law[] = response.data.map((law, index) => ({
      id: index + 1,
      name: law.nombre,
      price: law.precio,
      thickness: mapThickness(law.grosor)
    }));
    
    lawsCatalog = convertedLaws;
    return convertedLaws;
  } catch (error) {
    console.error('Error al cargar leyes desde backend:', error);
    lawsCatalog = staticLawsCatalog;
    throw new Error('No se pudieron cargar las leyes desde el servidor');
  }
};

// Función para crear una nueva ley en el backend
export const createLawInBackend = async (law: Omit<Law, 'id'>): Promise<BackendLaw> => {
  try {
    const backendLaw = {
      nombre: law.name,
      precio: law.price,
      grosor: mapThicknessToBackend(law.thickness),
      categoria: 'General',
      fecha_actualizacion: new Date().toISOString()
    };

    const response = await axios.post<BackendLaw>(`${API_BASE_URL}/leyes`, backendLaw);
    return response.data;
  } catch (error) {
    console.error('Error al crear ley en backend:', error);
    throw new Error('No se pudo crear la ley en el servidor');
  }
};

// Función para actualizar una ley en el backend
export const updateLawInBackend = async (id: string, law: Omit<Law, 'id'>): Promise<void> => {
  try {
    const backendLaw = {
      nombre: law.name,
      precio: law.price,
      grosor: mapThicknessToBackend(law.thickness),
      categoria: 'General',
      fecha_actualizacion: new Date().toISOString()
    };

    const response = await axios.put(`${API_BASE_URL}/leyes/${id}`, backendLaw);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar ley en backend:', error);
    throw new Error('No se pudo actualizar la ley en el servidor');
  }
};

// Función para eliminar una ley del backend
export const deleteLawFromBackend = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/leyes/${id}`);
  } catch (error) {
    console.error('Error al eliminar ley del backend:', error);
    throw new Error('No se pudo eliminar la ley del servidor');
  }
};

// Función para obtener todas las leyes con sus IDs de MongoDB
export const getLawsWithMongoIds = async (): Promise<(Law & { mongoId: string })[]> => {
  try {
    const response = await axios.get<BackendLaw[]>(`${API_BASE_URL}/leyes`);
    
    return response.data.map((law, index) => ({
      id: index + 1,
      name: law.nombre,
      price: law.precio,
      thickness: mapThickness(law.grosor),
      mongoId: law._id
    }));
  } catch (error) {
    console.error('Error al obtener leyes con IDs de MongoDB:', error);
    throw new Error('No se pudieron obtener las leyes');
  }
};

// Leyes que requieren volúmenes separados
export const thickLawIds: number[] = [4, 7, 24];