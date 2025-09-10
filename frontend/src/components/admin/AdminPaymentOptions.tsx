import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PlusIcon, TrashIcon } from 'lucide-react';
export const AdminPaymentOptions: React.FC = () => {
  const {
    paymentOptions,
    updatePaymentOptions
  } = useAdmin();
  const [newOption, setNewOption] = useState<number>(0);
  const handleAdd = () => {
    if (newOption <= 0) {
      alert('El número de cuotas debe ser mayor que cero');
      return;
    }
    if (paymentOptions.includes(newOption)) {
      alert('Esta opción de pago ya existe');
      return;
    }
    const updatedOptions = [...paymentOptions, newOption].sort((a, b) => a - b);
    updatePaymentOptions(updatedOptions);
    setNewOption(0);
  };
  const handleDelete = (option: number) => {
    if (window.confirm(`¿Está seguro que desea eliminar la opción de ${option} cuota(s)?`)) {
      updatePaymentOptions(paymentOptions.filter(opt => opt !== option));
    }
  };
  return <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Administrar Opciones de Pago
      </h2>
      <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-3">
          Agregar Nueva Opción de Pago
        </h3>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Cuotas
            </label>
            <input type="number" min="1" value={newOption || ''} onChange={e => setNewOption(parseInt(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>
          <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <PlusIcon size={16} className="mr-1" />
            Agregar
          </button>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-3">
        Opciones Actuales
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {paymentOptions.map(option => <div key={option} className="border rounded-md p-4 bg-gray-50 relative group">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-700">{option}</div>
              <div className="text-sm text-gray-500">
                cuota{option > 1 ? 's' : ''}
              </div>
            </div>
            <button onClick={() => handleDelete(option)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700">
              <TrashIcon size={16} />
            </button>
          </div>)}
      </div>
      {paymentOptions.length === 0 && <div className="text-center py-8 text-gray-500 border border-dashed rounded-md">
          No hay opciones de pago configuradas
        </div>}
    </div>;
};