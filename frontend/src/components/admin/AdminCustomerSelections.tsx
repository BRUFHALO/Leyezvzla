import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { MailIcon, CalendarIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, EyeIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Law } from '../../data/lawsData';
import { thicknessOptions } from '../../data/adminData';
export const AdminCustomerSelections: React.FC = () => {
  const {
    customerSelections,
    deleteCustomerSelection
  } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'customerEmail' | 'grandTotal'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSelection, setSelectedSelection] = useState<string | null>(null);
  // Filter and sort selections
  const filteredSelections = customerSelections.filter(selection => selection.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) || selection.selectedLaws.some(law => law.name.toLowerCase().includes(searchTerm.toLowerCase()))).sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDirection === 'asc' ? a.timestamp.getTime() - b.timestamp.getTime() : b.timestamp.getTime() - a.timestamp.getTime();
    }
    if (sortField === 'customerEmail') {
      return sortDirection === 'asc' ? a.customerEmail.localeCompare(b.customerEmail) : b.customerEmail.localeCompare(a.customerEmail);
    }
    // grandTotal
    return sortDirection === 'asc' ? a.grandTotal - b.grandTotal : b.grandTotal - a.grandTotal;
  });
  const handleSort = (field: 'timestamp' | 'customerEmail' | 'grandTotal') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro que desea eliminar esta cotización?')) {
      deleteCustomerSelection(id);
      if (selectedSelection === id) {
        setSelectedSelection(null);
      }
    }
  };
  const formatDate = (date: Date) => {
    return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", {
      locale: es
    });
  };
  const getThicknessLabel = (thickness: Law['thickness']) => {
    return thicknessOptions.find(option => option.value === thickness)?.label || '';
  };
  return <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Cotizaciones de Clientes
        </h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
          <input type="text" placeholder="Buscar por correo o ley..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      {customerSelections.length === 0 ? <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <MailIcon size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">
            No hay cotizaciones guardadas
          </h3>
          <p className="text-gray-500">
            Las cotizaciones guardadas por los clientes aparecerán aquí
          </p>
        </div> : <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center">
                    <span>Fecha</span>
                    {sortField === 'timestamp' && (sortDirection === 'asc' ? <ChevronUpIcon size={16} className="ml-1" /> : <ChevronDownIcon size={16} className="ml-1" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customerEmail')}>
                  <div className="flex items-center">
                    <span>Cliente</span>
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
              {filteredSelections.map(selection => <tr key={selection.id} className={`hover:bg-gray-50 ${selectedSelection === selection.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatDate(selection.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <MailIcon size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {selection.customerEmail}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {selection.selectedLaws.length} leyes
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${selection.grandTotal}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {selection.paymentOption} cuota
                      {selection.paymentOption > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => setSelectedSelection(selection.id === selectedSelection ? null : selection.id)} className="text-blue-600 hover:text-blue-800" title="Ver detalles">
                        <EyeIcon size={16} />
                      </button>
                      <button onClick={() => handleDelete(selection.id)} className="text-red-600 hover:text-red-800" title="Eliminar">
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
      {/* Detailed view modal */}
      {selectedSelection && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Detalles de Cotización
              </h3>
              <button onClick={() => setSelectedSelection(null)} className="text-gray-500 hover:text-gray-700">
                <XIcon size={20} />
              </button>
            </div>
            {customerSelections.find(s => s.id === selectedSelection) && (() => {
          const selection = customerSelections.find(s => s.id === selectedSelection)!;
          return <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Cliente
                        </h4>
                        <div className="flex items-center">
                          <MailIcon size={16} className="text-gray-500 mr-2" />
                          <p className="text-lg text-gray-800">
                            {selection.customerEmail}
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">
                          Fecha
                        </h4>
                        <div className="flex items-center">
                          <CalendarIcon size={16} className="text-gray-500 mr-2" />
                          <p className="text-lg text-gray-800">
                            {formatDate(selection.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Leyes Seleccionadas ({selection.selectedLaws.length})
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
                            {selection.selectedLaws.map(law => <tr key={law.id}>
                                <td className="py-2 text-sm text-gray-800">
                                  {law.name}
                                </td>
                                <td className="py-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full 
                                    ${law.thickness === 'low' ? 'bg-green-100 text-green-800' : law.thickness === 'medium' ? 'bg-yellow-100 text-yellow-800' : law.thickness === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                    {getThicknessLabel(law.thickness)}
                                  </span>
                                </td>
                                <td className="py-2 text-sm text-gray-800 text-right">
                                  ${law.price}
                                </td>
                              </tr>)}
                            <tr>
                              <td colSpan={2} className="py-2 text-sm font-medium text-gray-800">
                                Subtotal
                              </td>
                              <td className="py-2 text-sm font-medium text-gray-800 text-right">
                                ${selection.totalPrice}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Agrupamiento de Volúmenes ({selection.volumes.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selection.volumes.map((volume, idx) => <div key={idx} className="border rounded-md p-3 bg-blue-50 border-blue-200">
                            <div className="font-medium text-blue-800 mb-1">
                              Volumen {idx + 1}
                            </div>
                            <ul className="text-sm text-gray-700">
                              {volume.map(law => <li key={law.id}>{law.name}</li>)}
                            </ul>
                          </div>)}
                      </div>
                      <div className="mt-3 p-3 border rounded-md bg-gray-50">
                        <div className="flex justify-between">
                          <span>
                            Costo de encuadernación ({selection.volumes.length}{' '}
                            × $10)
                          </span>
                          <span className="font-medium">
                            ${selection.bindingCost}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Costo Total
                        </h4>
                        <div className="p-4 bg-blue-600 text-white rounded-md">
                          <div className="flex justify-between items-center">
                            <span>Total</span>
                            <span className="text-2xl font-bold">
                              ${selection.grandTotal}
                            </span>
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
                              {selection.paymentOption} cuota
                              {selection.paymentOption > 1 ? 's' : ''}
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              $
                              {Math.ceil(selection.grandTotal / selection.paymentOption)}{' '}
                              c/u
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>;
        })()}
          </div>
        </div>}
    </div>;
};