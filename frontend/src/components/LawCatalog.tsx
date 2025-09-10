import React from 'react';
import { Law } from '../data/lawsData';
import { CheckIcon } from 'lucide-react';
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
  return <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Catálogo de Leyes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {laws.map(law => <div key={law.id} className={`border p-3 rounded-md cursor-pointer flex items-center ${selectedLaws.includes(law.id) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`} onClick={() => onSelectLaw(law.id)}>
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
          </div>)}
      </div>
    </div>;
};