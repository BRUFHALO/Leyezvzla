import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Law } from '../../data/lawsData';
import { thicknessOptions } from '../../data/adminData';
import { PlusIcon, PencilIcon, TrashIcon, SaveIcon, XIcon, RefreshCwIcon, CheckSquare, Square } from 'lucide-react';

export const AdminLawCatalog: React.FC = () => {
  const {
    laws,
    lawsWithMongoIds,
    updateLaw,
    addLaw,
    deleteLaw,
    veryThickLawIds,
    updateVeryThickLawIds,
    refreshLaws,
    loading,
    error
  } = useAdmin();
  
  const [searchTerm, setSearchTerm] = useState('');

  const [editingLaw, setEditingLaw] = useState<{ law: Law; mongoId: string } | null>(null);
  const [selectedLaws, setSelectedLaws] = useState<Set<string>>(new Set());
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchEditValues, setBatchEditValues] = useState<{
    price?: number;
    thickness?: 'low' | 'medium' | 'high' | 'very_high';
  }>({});
  const [newLaw, setNewLaw] = useState<Omit<Law, 'id'>>({
    name: '',
    price: 0,
    thickness: 'medium'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    refreshLaws();
  }, []);

  const getMongoIdForLaw = (lawId: number): string => {
    const lawWithId = lawsWithMongoIds.find(law => law.id === lawId);
    if (!lawWithId || !lawWithId.mongoId) {
      console.warn(`No se encontró el ID de MongoDB para la ley con ID: ${lawId}`);
      return '';
    }
    return lawWithId.mongoId;
  };

  const handleEdit = (law: Law) => {
    const mongoId = getMongoIdForLaw(law.id);
    if (mongoId) {
      setEditingLaw({ law: { ...law }, mongoId });
      setErrorMessage('');
    } else {
      setErrorMessage('No se pudo encontrar el ID de la ley en la base de datos');
    }
  };

  const handleCancelEdit = () => {
    setEditingLaw(null);
    setSaveStatus('idle');
    setErrorMessage('');
  };

  const handleUpdate = async () => {
    if (!editingLaw) return;

    setSaveStatus('saving');
    setErrorMessage('');
    
    try {
      await updateLaw(editingLaw.law, editingLaw.mongoId);
      setEditingLaw(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.message || 'Error al actualizar la ley');
    }
  };

  const toggleLawSelection = (mongoId: string) => {
    setSelectedLaws(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(mongoId)) {
        newSelection.delete(mongoId);
      } else {
        newSelection.add(mongoId);
      }
      console.log('Leyes seleccionadas:', Array.from(newSelection)); // Para depuración
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLaws.size === filteredLaws.length) {
      setSelectedLaws(new Set());
    } else {
      const allIds = new Set<string>();
      filteredLaws.forEach(law => {
        const mongoId = getMongoIdForLaw(law.id);
        if (mongoId) {
          allIds.add(mongoId);
        }
      });
      console.log('Seleccionando todas las leyes:', Array.from(allIds)); // Para depuración
      setSelectedLaws(allIds);
    }
  };

  const handleBatchEdit = () => {
    if (selectedLaws.size > 0) {
      setBatchEditMode(true);
      setBatchEditValues({});
      console.log('Iniciando edición por lotes para:', selectedLaws.size, 'leyes');
    } else {
      setErrorMessage('Seleccione al menos una ley para editar');
    }
  };

  const cancelBatchEdit = () => {
    setBatchEditMode(false);
    setSelectedLaws(new Set());
    setBatchEditValues({});
  };

  const applyBatchEdit = async () => {
    if (selectedLaws.size === 0) {
      setErrorMessage('Seleccione al menos una ley para editar');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const updates = Array.from(selectedLaws).map(async (mongoId) => {
        const law = laws.find(l => getMongoIdForLaw(l.id) === mongoId);
        if (law) {
          const updatedLaw = {
            ...law,
            price: batchEditValues.price !== undefined ? batchEditValues.price : law.price,
            thickness: batchEditValues.thickness !== undefined ? batchEditValues.thickness : law.thickness
          };
          await updateLaw(updatedLaw, mongoId);
        }
      });

      await Promise.all(updates);
      setSaveStatus('success');
      setBatchEditMode(false);
      setSelectedLaws(new Set());
      setBatchEditValues({});
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.message || 'Error al actualizar las leyes');
    }
  };

  const handleDelete = async (lawId: number) => {
    if (window.confirm('¿Está seguro que desea eliminar esta ley?')) {
      try {
        const mongoId = getMongoIdForLaw(lawId);
        if (!mongoId) {
          throw new Error('No se pudo encontrar el ID de la ley en la base de datos');
        }
        await deleteLaw(mongoId);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error: any) {
        setSaveStatus('error');
        setErrorMessage(error.message || 'Error al eliminar la ley');
      }
    }
  };

  const handleAdd = async () => {
    if (!newLaw.name.trim()) {
      setErrorMessage('El nombre de la ley es obligatorio');
      return;
    }

    if (newLaw.price <= 0) {
      setErrorMessage('El precio debe ser mayor a 0');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');
    
    try {
      await addLaw(newLaw);
      setNewLaw({
        name: '',
        price: 0,
        thickness: 'medium'
      });
      setShowAddForm(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.message || 'Error al agregar la ley');
    }
  };

  const handleVeryThickChange = (lawId: number, isChecked: boolean) => {
    if (isChecked) {
      updateVeryThickLawIds([...veryThickLawIds, lawId]);
    } else {
      updateVeryThickLawIds(veryThickLawIds.filter(id => id !== lawId));
    }
  };

  const handleInputChange = (field: keyof Law, value: string | number) => {
    if (editingLaw) {
      setEditingLaw(prev => prev ? { 
        ...prev, 
        law: { ...prev.law, [field]: value } 
      } : null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <RefreshCwIcon className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Cargando leyes...</span>
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
            onClick={refreshLaws}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const filteredLaws = laws
    .filter(law => {
      if (searchTerm === '') return true;
      
      // Normalizar el texto de búsqueda y el nombre de la ley
      const normalizeText = (text: string) => 
        text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      
      const searchTermNormalized = normalizeText(searchTerm);
      const lawNameNormalized = normalizeText(law.name);
      
      return lawNameNormalized.includes(searchTermNormalized);
    });

  const selectedCount = selectedLaws.size;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {saveStatus === 'success' && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ¡Operación realizada con éxito!
        </div>
      )}
      {(saveStatus === 'error' || errorMessage) && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errorMessage || 'Error al realizar la operación. Por favor, intente nuevamente.'}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Administrar Catálogo de Leyes
          {selectedCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
<button
            onClick={() => {
              if (!batchEditMode) {
                // Si no estamos en modo edición, activarlo
                setBatchEditMode(true);
              } else {
                // Si ya estamos en modo edición, manejar la edición
                handleBatchEdit();
              }
            }}
            className={`flex items-center px-3 py-2 ${
              batchEditMode 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-yellow-500 hover:bg-yellow-600'
            } text-white rounded-md transition-colors`}
          >
            <PencilIcon size={16} className="mr-1" />
            {batchEditMode 
              ? `Editando ${selectedCount} leyes` 
              : 'Editar por lotes'}
          </button>
          {batchEditMode && (
            <>
              <button
                onClick={cancelBatchEdit}
                className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <XIcon size={16} className="mr-1" />
                Cancelar
              </button>
              <button
                onClick={applyBatchEdit}
                disabled={saveStatus === 'saving'}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon size={16} className="mr-1" />
                Aplicar cambios
              </button>
            </>
          )}
          <button
            onClick={refreshLaws}
            disabled={saveStatus === 'saving'}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCwIcon size={16} className="mr-1" />
            Actualizar
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={saveStatus === 'saving'}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon size={16} className="mr-1" />
            Agregar Ley
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-96">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar ley por nombre
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escriba para buscar..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Nueva Ley</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={newLaw.name}
                onChange={e => setNewLaw({ ...newLaw, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nombre de la ley"
                disabled={saveStatus === 'saving'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($) *
              </label>
              <input
                type="number"
                value={newLaw.price}
                onChange={e => setNewLaw({ ...newLaw, price: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                step="0.01"
                disabled={saveStatus === 'saving'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grosor
              </label>
              <select
                value={newLaw.thickness}
                onChange={e => setNewLaw({
                  ...newLaw,
                  thickness: e.target.value as Law['thickness']
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={saveStatus === 'saving'}
              >
                {thicknessOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              disabled={saveStatus === 'saving'}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saveStatus === 'saving' || !newLaw.name.trim() || newLaw.price <= 0}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Ley'}
            </button>
          </div>
        </div>
      )}

      {batchEditMode && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-lg font-medium text-yellow-800 mb-3">Edición por lotes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ($)
              </label>
              <input
                type="number"
                value={batchEditValues.price || ''}
                onChange={e => setBatchEditValues({
                  ...batchEditValues,
                  price: e.target.value ? Number(e.target.value) : undefined
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="0"
                step="0.01"
                placeholder="Dejar en blanco para no modificar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grosor
              </label>
              <select
                value={batchEditValues.thickness || ''}
                onChange={e => setBatchEditValues({
                  ...batchEditValues,
                  thickness: e.target.value as 'low' | 'medium' | 'high' | 'very_high' | undefined
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">No modificar</option>
                {thicknessOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {batchEditMode ? (
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-600 hover:text-gray-800"
                    title={selectedLaws.size === filteredLaws.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  >
                    {selectedLaws.size === filteredLaws.length ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                  </button>
                ) : (
                  'ID'
                )}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grosor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Muy Grueso
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLaws.map(law => {
              const isEditing = editingLaw?.law.id === law.id;
              return (
                <tr key={law.id} className={`${isEditing ? 'bg-blue-50' : ''} ${selectedLaws.has(getMongoIdForLaw(law.id)) ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {batchEditMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const mongoId = getMongoIdForLaw(law.id);
                          if (mongoId) {
                            toggleLawSelection(mongoId);
                          }
                        }}
                        className={`flex items-center justify-center w-5 h-5 rounded border ${
                          selectedLaws.has(getMongoIdForLaw(law.id)) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 hover:border-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        {selectedLaws.has(getMongoIdForLaw(law.id)) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ) : (
                      law.id
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingLaw!.law.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        disabled={saveStatus === 'saving'}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {law.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingLaw!.law.price}
                        onChange={(e) => handleInputChange('price', Number(e.target.value))}
                        className="w-20 p-2 border border-gray-300 rounded-md"
                        min="0"
                        step="0.01"
                        disabled={saveStatus === 'saving'}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">${law.price}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editingLaw!.law.thickness}
                        onChange={(e) => handleInputChange('thickness', e.target.value)}
                        className="p-2 border border-gray-300 rounded-md"
                        disabled={saveStatus === 'saving'}
                      >
                        {thicknessOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        law.thickness === 'low' ? 'bg-green-100 text-green-800' :
                        law.thickness === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        law.thickness === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {thicknessOptions.find(o => o.value === law.thickness)?.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={veryThickLawIds.includes(law.id)}
                      onChange={e => handleVeryThickChange(law.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={saveStatus === 'saving' || batchEditMode}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleUpdate}
                          disabled={saveStatus === 'saving' || !editingLaw.law.name.trim() || editingLaw.law.price <= 0}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Guardar"
                        >
                          <SaveIcon size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveStatus === 'saving'}
                          className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                          title="Cancelar"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(law)}
                          disabled={saveStatus === 'saving' || batchEditMode}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={batchEditMode ? 'Termine la edición por lotes primero' : 'Editar'}
                        >
                          <PencilIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(law.id)}
                          disabled={saveStatus === 'saving' || batchEditMode}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={batchEditMode ? 'Termine la edición por lotes primero' : 'Eliminar'}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {laws.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No hay leyes en el catálogo. Agrega la primera ley usando el botón "Agregar Ley".
        </div>
      )}
    </div>
  );
};