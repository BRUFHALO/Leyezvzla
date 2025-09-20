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
  name: 'Error al cargar leyes',
  price: 0,
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
export const thickLawIds: number[] = [];