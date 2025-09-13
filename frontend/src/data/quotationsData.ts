// src/data/quotationsData.ts
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8005';

export interface QuotationLaw {
  nombre: string;
  grosor: string;
  precio: number;
}

export interface Volume {
  numero: number;
  leyes: string;
}

export interface TipoEncuadernacion {
  material: string;
  tamano: string;
  precio: number;
}

export interface CostoEncuadernacion {
  cantidad: number;
  costo_unitario: number;
  total: number;
  tipo_encuadernacion?: TipoEncuadernacion;
}

export interface AgrupamientoVolumenes {
  cantidad_volumenes: number;
  volumenes: Volume[];
  costo_encuadernacion: CostoEncuadernacion;
}

export interface ResumenCosto {
  subtotal_leyes: number;
  costo_encuadernacion: number;
  total: number;
}

export interface OpcionPago {
  tipo: string;
  valor_cuota: number;
  cantidad_cuotas: number;
}

export interface Cliente {
  nombre: string;
  email: string;
}

export interface Fecha {
  fecha_completa: string;
  timestamp: string;  // Cambiado de objeto a string
}

export interface Quotation {
  _id?: {
    $oid: string;
  };
  cliente: Cliente;
  fecha: Fecha;
  leyes_seleccionadas: {
    cantidad: number;
    items: QuotationLaw[];
    subtotal: number;
  };
  agrupamiento_volumenes: AgrupamientoVolumenes;
  resumen_costo: ResumenCosto;
  opcion_pago: OpcionPago;
  fecha_creacion: string;  // Cambiado de objeto a string
  estado: string;
}
// Función para guardar una cotización en el backend
export const saveQuotationToBackend = async (quotation: Omit<Quotation, '_id'>): Promise<Quotation> => {
  try {
    const response = await axios.post<Quotation>(`${API_BASE_URL}/cotizaciones`, quotation);
    return response.data;
  } catch (error) {
    console.error('Error al guardar cotización:', error);
    throw new Error('No se pudo guardar la cotización en el servidor');
  }
};

// Función para obtener todas las cotizaciones
export const getQuotationsFromBackend = async (): Promise<Quotation[]> => {
  try {
    const response = await axios.get<Quotation[]>(`${API_BASE_URL}/cotizaciones`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    throw new Error('No se pudieron obtener las cotizaciones del servidor');
  }
};

// Función para eliminar una cotización
export const deleteQuotationFromBackend = async (id: string): Promise<void> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cotizaciones/${id}`);
    if (response.status !== 204) {
      throw new Error(`Error ${response.status}: No se pudo eliminar la cotización`);
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Error ${error.response.status}: ${error.response.data?.detail || 'Error del servidor'}`);
    }
    throw new Error('Error de conexión al eliminar la cotización');
  }
};

export const updateQuotationStatus = async (id: string, estado: string): Promise<Quotation> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/cotizaciones/${id}/estado`, {
      estado: estado
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Error ${error.response.status}: ${error.response.data?.detail || 'Error del servidor'}`);
    }
    throw new Error('Error de conexión al actualizar el estado');
  }
};