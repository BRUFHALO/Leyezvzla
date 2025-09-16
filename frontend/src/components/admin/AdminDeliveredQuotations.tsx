import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MailIcon, CalendarIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, XIcon, RefreshCwIcon, PackageIcon, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { thicknessOptions } from '../../data/adminData';

export const AdminDeliveredQuotations: React.FC = () => {
  const {
    loadQuotations,
    quotations,
    loading,
    error,
    removeQuotation
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'fecha_entrega' | 'customerEmail' | 'grandTotal'>('fecha_entrega');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Cargar cotizaciones al montar el componente
  useEffect(() => {
    const initializeQuotations = async () => {
      try {
        await loadQuotations();
      } catch (err) {
        console.error('Error loading quotations:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    initializeQuotations();
  }, []);

  // Filtrar cotizaciones entregadas y ordenar
  const filteredSelections = quotations
    .filter(quotation => quotation.estado === 'entregado')
    .filter(quotation => 
      quotation.cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      quotation.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.leyes_seleccionadas.items.some(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
     .sort((a, b) => {
      // Usar fecha_entrega si está disponible, de lo contrario usar fecha_creacion
      const dateA = new Date(a.fecha_entrega || a.fecha_creacion);
      const dateB = new Date(b.fecha_entrega || b.fecha_creacion);
      
      if (sortField === 'fecha_entrega') {
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else if (sortField === 'customerEmail') {
        const emailA = a.cliente.email.toLowerCase();
        const emailB = b.cliente.email.toLowerCase();
        return sortDirection === 'asc' ? emailA.localeCompare(emailB) : emailB.localeCompare(emailA);
      } else if (sortField === 'grandTotal') {
        return sortDirection === 'asc' ? a.resumen_costo.total - b.resumen_costo.total : b.resumen_costo.total - a.resumen_costo.total;
      }
      return 0;
    });

  const handleSort = (field: 'fecha_entrega' | 'customerEmail' | 'grandTotal') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar permanentemente esta cotización entregada?')) {
      try {
        setLocalLoading(true);
        await removeQuotation(id);
        if (selectedSelection === id) {
          setSelectedSelection(null);
        }
        // La tabla se actualiza automáticamente porque removeQuotation actualiza el estado
      } catch (error: any) {
        alert('Error al eliminar: ' + error.message);
      } finally {
        setLocalLoading(false);
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

  const getSortIcon = (field: 'fecha_entrega' | 'customerEmail' | 'grandTotal') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />;
  };

  if (localLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <PackageIcon className="text-green-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Cotizaciones Entregadas</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          <RefreshCwIcon className="mr-2" size={16} />
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por email, nombre o ley..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabla de cotizaciones entregadas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('fecha_entrega')}
              >
                <div className="flex items-center">
                  Fecha de Entrega
                  {getSortIcon('fecha_entrega')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('customerEmail')}
              >
                <div className="flex items-center">
                  Cliente
                  {getSortIcon('customerEmail')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leyes
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('grandTotal')}
              >
                <div className="flex items-center">
                  Total
                  {getSortIcon('grandTotal')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSelections.map((quotation) => (
              <tr key={typeof quotation._id === 'object' ? quotation._id.$oid : quotation._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 text-gray-400" size={16} />
                    <div className="text-sm text-gray-900">
                      {quotation.fecha_entrega 
                        ? format(new Date(quotation.fecha_entrega), 'dd/MM/yyyy HH:mm', { locale: es })
                        : format(new Date(quotation.fecha_creacion), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MailIcon className="mr-2 text-gray-400" size={16} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quotation.cliente.nombre}</div>
                      <div className="text-sm text-gray-500">{quotation.cliente.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {quotation.leyes_seleccionadas.items.length} ley{quotation.leyes_seleccionadas.items.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="text-sm text-gray-500">
                    {quotation.leyes_seleccionadas.items.slice(0, 2).map(item => item.nombre).join(', ')}
                    {quotation.leyes_seleccionadas.items.length > 2 && '...'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${quotation.resumen_costo.total}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedSelection(typeof quotation._id === 'object' ? quotation._id.$oid : quotation._id || '')}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="Ver detalles"
                  >
                    <EyeIcon size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(typeof quotation._id === 'object' ? quotation._id.$oid : quotation._id || '')}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar cotización"
                  >
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSelections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron cotizaciones entregadas.
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedSelection && (() => {
        const quotation = quotations.find(q => 
          (typeof q._id === 'object' ? q._id.$oid : q._id) === selectedSelection
        );
        
        if (!quotation) return null;

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-semibold text-gray-900">
                  Detalles de Cotización Entregada
                </h3>
                <button
                  onClick={() => setSelectedSelection(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Información del cliente */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Cliente</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Nombre:</span>
                        <p className="font-medium">{quotation.cliente.nombre}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email:</span>
                        <p className="font-medium">{quotation.cliente.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leyes seleccionadas */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Leyes Seleccionadas ({quotation.leyes_seleccionadas.items.length})
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid gap-2">
                      {quotation.leyes_seleccionadas.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <div>
                            <span className="font-medium">{item.nombre}</span>
                            <span className="ml-2 text-sm text-gray-500">
                              ({thicknessOptions.find(opt => opt.value === item.grosor)?.label || item.grosor})
                            </span>
                          </div>
                          <span className="font-medium">${item.precio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Encuadernación */}
                {(quotation as any).encuadernacion && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Encuadernación</h4>
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Material:</span>
                          <p className="font-medium">{(quotation as any).encuadernacion.material}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Tamaño:</span>
                          <p className="font-medium">{(quotation as any).encuadernacion.tamano}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Precio:</span>
                          <p className="font-medium">${(quotation as any).encuadernacion.precio}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen de costos */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Resumen de Costos</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal Leyes:</span>
                        <span>${quotation.resumen_costo.subtotal_leyes}</span>
                      </div>
                      {quotation.resumen_costo.costo_encuadernacion > 0 && (
                        <div className="flex justify-between">
                          <span>Costo Encuadernación:</span>
                          <span>${quotation.resumen_costo.costo_encuadernacion}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-medium">
                        <span>Total:</span>
                        <span>${quotation.resumen_costo.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción de pago */}
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

                {/* Fecha de entrega */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Información de Entrega</h4>
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex items-center">
                      <PackageIcon className="mr-2 text-green-600" size={20} />
                      <div>
                        <span className="text-sm text-gray-500">Entregado el:</span>
                        <p className="font-medium text-green-700">
                          {quotation.fecha_entrega 
                            ? format(new Date(quotation.fecha_entrega), 'dd/MM/yyyy HH:mm', { locale: es })
                            : format(new Date(quotation.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
