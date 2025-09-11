import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MailIcon, CalendarIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, EyeIcon, XIcon, RefreshCwIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { thicknessOptions } from '../../data/adminData';
import { Quotation, getQuotationsFromBackend, deleteQuotationFromBackend } from '../../data/quotationsData';

export const AdminCustomerSelections: React.FC = () => {
  const {
    removeQuotation,
    loadQuotations,
    quotations,
    loading,
    error
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'fecha_creacion' | 'customerEmail' | 'grandTotal'>('fecha_creacion');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Cargar cotizaciones al montar el componente
  useEffect(() => {
    const initializeQuotations = async () => {
      try {
        setLocalLoading(true);
        await loadQuotations();
      } catch (err) {
        console.error('Error loading quotations:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    initializeQuotations();
  }, []);

  // Filtrar y ordenar cotizaciones
  const filteredSelections = quotations
    .filter(quotation => 
      quotation.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      quotation.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.leyes_seleccionadas.items.some(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
     .sort((a, b) => {
      const dateA = new Date(a.fecha_creacion);
      const dateB = new Date(b.fecha_creacion);

      if (sortField === 'fecha_creacion') {
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      if (sortField === 'customerEmail') {
        return sortDirection === 'asc' ? 
          a.cliente.email.localeCompare(b.cliente.email) : 
          b.cliente.email.localeCompare(a.cliente.email);
      }
      // grandTotal
      return sortDirection === 'asc' ? 
        a.resumen_costo.total - b.resumen_costo.total : 
        b.resumen_costo.total - a.resumen_costo.total;
    });
  const handleSort = (field: 'fecha_creacion' | 'customerEmail' | 'grandTotal') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta cotización?')) {
      try {
        await removeQuotation(id);
        if (selectedSelection === id) {
          setSelectedSelection(null);
        }
      } catch (error: any) {
        alert('Error al eliminar: ' + error.message);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setLocalLoading(true);
      await loadQuotations();
    } catch (error: any) {
      console.error('Error refreshing:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", {
      locale: es
    });
  };

  const getThicknessLabel = (grosor: string) => {
    const thicknessMap: Record<string, string> = {
      'Bajo': 'Bajo',
      'Medio': 'Medio', 
      'Alto': 'Alto',
      'Muy Alto': 'Muy Alto'
    };
    return thicknessMap[grosor] || grosor;
  };

  if (loading || localLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <RefreshCwIcon className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Cargando cotizaciones...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Cotizaciones de Clientes
        </h2>
        <div className="flex space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por correo, nombre o ley..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-64" 
            />
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            title="Actualizar"
          >
            <RefreshCwIcon size={16} />
          </button>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <MailIcon size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            No hay cotizaciones guardadas
          </h3>
          <p className="text-gray-500">
            Las cotizaciones guardadas por los clientes aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('fecha_creacion')}>
                  <div className="flex items-center">
                    <span>Fecha</span>
                    {sortField === 'fecha_creacion' && (sortDirection === 'asc' ? <ChevronUpIcon size={16} className="ml-1" /> : <ChevronDownIcon size={16} className="ml-1" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customerEmail')}>
                  <div className="flex items-center">
                    <span>Email</span>
                    {sortField === 'customerEmail' && (sortDirection === 'asc' ? <ChevronUpIcon size={16} className="ml-1" /> : <ChevronDownIcon size={16} className="ml-1" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leyes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('grandTotal')}>
                  <div className="flex items-center">
                    <span>Total</span>
                    {sortField === 'grandTotal' && (sortDirection === 'asc' ? <ChevronUpIcon size={16} className="ml-1" /> : <ChevronDownIcon size={16} className="ml-1" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSelections.map(quotation => (             
                <tr key={quotation._id} className={`hover:bg-gray-50 ${selectedSelection === quotation._id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {quotation.fecha.fecha_completa}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {quotation.cliente.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <MailIcon size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {quotation.cliente.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {quotation.leyes_seleccionadas.cantidad} leyes
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${quotation.resumen_costo.total}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {quotation.opcion_pago.cantidad_cuotas} cuota
                      {quotation.opcion_pago.cantidad_cuotas > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedSelection(quotation._id)} 
                        className="text-blue-600 hover:text-blue-800" 
                        title="Ver detalles"
                      >
                        <EyeIcon size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(quotation._id || '')} 
                        className="text-red-600 hover:text-red-800" 
                        title="Eliminar"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Detalles de Cotización
              </h3>
              <button onClick={() => setSelectedSelection(null)} className="text-gray-500 hover:text-gray-700">
                <XIcon size={20} />
              </button>
            </div>

            {quotations.find(q => q._id === selectedSelection) && (() => {
              const quotation = quotations.find(q => q._id === selectedSelection)!;
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Cliente
                      </h4>
                      <div className="flex items-center">
                        <MailIcon size={16} className="text-gray-500 mr-2" />
                        <div>
                          <p className="text-lg text-gray-800">{quotation.cliente.nombre}</p>
                          <p className="text-sm text-gray-600">{quotation.cliente.email}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Fecha
                      </h4>
                      <div className="flex items-center">
                        <CalendarIcon size={16} className="text-gray-500 mr-2" />
                        <p className="text-lg text-gray-800">
                          { quotation.fecha.fecha_completa}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Leyes Seleccionadas ({quotation.leyes_seleccionadas.cantidad})
                    </h4>
                    <div className="bg-gray-50 rounded-md p-4">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Nombre
                            </th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Grosor
                            </th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                              Precio
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quotation.leyes_seleccionadas.items.map((item, index) => (
                            <tr key={index}>
                              <td className="py-2 text-sm text-gray-800">
                                {item.nombre}
                              </td>
                              <td className="py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full 
                                  ${item.grosor === 'Bajo' ? 'bg-green-100 text-green-800' : 
                                    item.grosor === 'Medio' ? 'bg-yellow-100 text-yellow-800' : 
                                    item.grosor === 'Alto' ? 'bg-orange-100 text-orange-800' : 
                                    'bg-red-100 text-red-800'}`}>
                                  {getThicknessLabel(item.grosor)}
                                </span>
                              </td>
                              <td className="py-2 text-sm text-gray-800 text-right">
                                ${item.precio}
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={2} className="py-2 text-sm font-medium text-gray-800">
                              Subtotal Leyes
                            </td>
                            <td className="py-2 text-sm font-medium text-gray-800 text-right">
                              ${quotation.resumen_costo.subtotal_leyes}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Agrupamiento de Volúmenes ({quotation.agrupamiento_volumenes.cantidad_volumenes})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quotation.agrupamiento_volumenes.volumenes.map((volume, idx) => (
                        <div key={idx} className="border rounded-md p-3 bg-blue-50 border-blue-200">
                          <div className="font-medium text-blue-800 mb-1">
                            Volumen {volume.numero}
                          </div>
                          <p className="text-sm text-gray-700">{volume.leyes}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 border rounded-md bg-gray-50">
                      <div className="flex justify-between">
                        <span>Costo de encuadernación ({quotation.agrupamiento_volumenes.cantidad_volumenes} × ${quotation.agrupamiento_volumenes.costo_encuadernacion.total})</span>
                        <span className="font-medium">
                          ${quotation.agrupamiento_volumenes.costo_encuadernacion.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Resumen de Costos
                      </h4>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal Leyes:</span>
                            <span>${quotation.resumen_costo.subtotal_leyes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Costo Encuadernación:</span>
                            <span>${quotation.agrupamiento_volumenes.costo_encuadernacion.total}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2 font-medium">
                            <span>Total:</span>
                            <span>${quotation.resumen_costo.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Opción de Pago
                      </h4>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex justify-between items-center">
                          <span>
                            {quotation.opcion_pago.cantidad_cuotas} cuota
                            {quotation.opcion_pago.cantidad_cuotas > 1 ? 's' : ''}
                          </span>
                          <span className="text-lg font-bold text-green-700">
                            $
                            {Math.ceil(quotation.resumen_costo.total / quotation.opcion_pago.cantidad_cuotas)}{' '}
                            c/u
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};