import React, { useState, useMemo } from 'react';
import { Law } from '../data/lawsData';
import { CheckIcon, SearchIcon } from 'lucide-react';
interface LawCatalogProps {
  laws: Law[];
  selectedLaws: number[];
  onSelectLaw: (lawId: number) => void;
}
export const LawCatalog: React.FC<LawCatalogProps> = ({
  laws,
  selectedLaws,
  onSelectLaw
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar leyes basado en el término de búsqueda
  const filteredLaws = useMemo(() => {
    return laws.filter(law => 
      law.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [laws, searchTerm]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 md:mb-0">
          Catálogo de Leyes
        </h2>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar leyes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredLaws.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron leyes que coincidan con tu búsqueda
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filteredLaws.map(law => (
            <div 
              key={law.id} 
              className={`border p-3 rounded-md cursor-pointer flex items-center transition-colors ${selectedLaws.includes(law.id) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`} 
              onClick={() => onSelectLaw(law.id)}
            >
              <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${selectedLaws.includes(law.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                {selectedLaws.includes(law.id) && <CheckIcon className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{law.name}</span>
                  <span className="text-blue-700 font-semibold">
                    ${law.price}
                  </span>
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-gray-500">Grosor: </span>
                  <span className={`ml-1 text-xs px-2 py-0.5 rounded ${law.thickness === 'low' ? 'bg-green-100 text-green-800' : law.thickness === 'medium' ? 'bg-yellow-100 text-yellow-800' : law.thickness === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                    {law.thickness === 'low' ? 'Bajo' : law.thickness === 'medium' ? 'Medio' : law.thickness === 'high' ? 'Alto' : 'Muy Alto'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};