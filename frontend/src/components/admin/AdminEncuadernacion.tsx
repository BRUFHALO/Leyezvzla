import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { EncuadernacionType } from '../../data/encuadernacionData';
import { PlusIcon, EditIcon, TrashIcon, ToggleLeftIcon, ToggleRightIcon, SaveIcon, XIcon } from 'lucide-react';

export const AdminEncuadernacion: React.FC = () => {
  const {
    allEncuadernaciones,
    loadAllEncuadernaciones,
    addEncuadernacion,
    updateEncuadernacion,
    deleteEncuadernacion,
    toggleEncuadernacionStatus
  } = useAdmin();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el formulario
  const [formData, setFormData] = useState({
    material: '',
    tamano: '',
    precio: 0,
    activo: true
  });

  useEffect(() => {
    loadAllEncuadernaciones();
  }, []);

  const resetForm = () => {
    setFormData({
      material: '',
      tamano: '',
      precio: 0,
      activo: true
    });
    setShowCreateForm(false);
    setEditingId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        await updateEncuadernacion(editingId, formData);
      } else {
        await addEncuadernacion(formData);
      }
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la encuadernación');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (encuadernacion: EncuadernacionType) => {
    setFormData({
      material: encuadernacion.material,
      tamano: encuadernacion.tamano,
      precio: encuadernacion.precio,
      activo: encuadernacion.activo
    });
    setEditingId(encuadernacion._id!);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta encuadernación?')) {
      setLoading(true);
      try {
        await deleteEncuadernacion(id);
      } catch (err: any) {
        setError(err.message || 'Error al eliminar la encuadernación');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    setLoading(true);
    try {
      await toggleEncuadernacionStatus(id);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado de la encuadernación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Gestión de Encuadernación
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          disabled={loading}
        >
          <PlusIcon className="mr-2" size={18} />
          Nueva Encuadernación
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Formulario de creación/edición */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingId ? 'Editar Encuadernación' : 'Nueva Encuadernación'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <input
                type="text"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Ej: MDF, Cartón Gris, Plastificado"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamaño *
              </label>
              <input
                type="text"
                value={formData.tamano}
                onChange={(e) => setFormData({ ...formData, tamano: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Ej: Carta, Pequeño"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={loading}
              >
                <XIcon className="inline mr-1" size={16} />
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                <SaveIcon className="inline mr-1" size={16} />
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de encuadernaciones */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamaño
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allEncuadernaciones.map((encuadernacion) => (
              <tr key={encuadernacion._id} className={!encuadernacion.activo ? 'opacity-60' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {encuadernacion.material}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {encuadernacion.tamano}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${encuadernacion.precio}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    encuadernacion.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {encuadernacion.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(encuadernacion)}
                    className="text-blue-600 hover:text-blue-900"
                    disabled={loading}
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(encuadernacion._id!)}
                    className={`${encuadernacion.activo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    disabled={loading}
                    title={encuadernacion.activo ? 'Desactivar' : 'Activar'}
                  >
                    {encuadernacion.activo ? <ToggleRightIcon size={16} /> : <ToggleLeftIcon size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(encuadernacion._id!)}
                    className="text-red-600 hover:text-red-900"
                    disabled={loading}
                  >
                    <TrashIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {allEncuadernaciones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay encuadernaciones registradas
          </div>
        )}
      </div>
    </div>
  );
};
