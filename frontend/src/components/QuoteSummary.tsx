import React, { useState } from 'react';
import { Law, thickLawIds } from '../data/lawsData';
import { BookOpenIcon, BookmarkIcon, CreditCardIcon, AlertTriangleIcon, MailIcon } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Quotation, saveQuotationToBackend } from '../data/quotationsData';


interface QuoteSummaryProps {
  selectedLaws: Law[];
  totalPrice: number;
  onResetSelection: () => void; // Nueva prop para resetear la selección
}

export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  selectedLaws,
  totalPrice,
  onResetSelection // Recibimos la función para resetear
}) => {
  const {
    paymentOptions: availablePaymentOptions,
    veryThickLawIds
  } = useAdmin();

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<number | null>(null);
  const [email, setEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const determineVolumes = () => {
    const volumes: Law[][] = [];
    let currentVolume: Law[] = [];
    let hasThickLaw = false;

    selectedLaws.forEach(law => {
      if (veryThickLawIds.includes(law.id)) {
        if (currentVolume.length > 0 && !hasThickLaw) {
          volumes.push([...currentVolume]);
          currentVolume = [];
        }
        volumes.push([law]);
        hasThickLaw = false;
      } else {
        if (hasThickLaw || currentVolume.length >= 3) {
          volumes.push([...currentVolume]);
          currentVolume = [law];
          hasThickLaw = law.thickness === 'high';
        } else {
          currentVolume.push(law);
          if (law.thickness === 'high') hasThickLaw = true;
        }
      }
    });

    if (currentVolume.length > 0) {
      volumes.push(currentVolume);
    }
    return volumes;
  };

  const volumes = determineVolumes();
  const bindingCost = volumes.length * 10;
  const grandTotal = totalPrice + bindingCost;

 const paymentOptions = availablePaymentOptions
  .filter(installments => installments > 0) // Filtra valores inválidos
  .map(installments => ({
    installments,
    amount: installments > 0 ? Math.ceil(grandTotal / installments) : grandTotal
  }))
  .sort((a, b) => a.installments - b.installments)

  const hasVeryThickLaws = selectedLaws.some(law => law.thickness === 'very_high');

 const createQuotationData = (): Omit<Quotation, '_id'> => {
  const now = new Date();
  const nowISO = now.toISOString();
  const selectedOption = paymentOptions.find(option => option.installments === selectedPaymentOption);

  return {
    cliente: {
      nombre: customerName,
      email: email
    },
    fecha: {
      fecha_completa: formatDate(now),
      timestamp: nowISO  // String directo, no objeto con $date
    },
    leyes_seleccionadas: {
      cantidad: selectedLaws.length,
      items: selectedLaws.map(law => ({
        nombre: law.name,
        grosor: law.thickness === 'low' ? 'Bajo' : 
               law.thickness === 'medium' ? 'Medio' :
               law.thickness === 'high' ? 'Alto' : 'Muy Alto',
        precio: law.price
      })),
      subtotal: totalPrice
    },
    agrupamiento_volumenes: {
      cantidad_volumenes: volumes.length,
      volumenes: volumes.map((volume, index) => ({
        numero: index + 1,
        leyes: volume.map(law => law.name).join(', ')
      })),
      costo_encuadernacion: {
        cantidad: volumes.length,
        costo_unitario: 10,
        total: bindingCost
      }
    },
    resumen_costo: {
      subtotal_leyes: totalPrice,
      costo_encuadernacion: bindingCost,
      total: grandTotal
    },
    opcion_pago: {
      tipo: `${selectedOption?.installments} cuotas`,
      valor_cuota: selectedOption?.amount || 0,
      cantidad_cuotas: selectedOption?.installments || 0
    },
    fecha_creacion: nowISO,  // String directo, no objeto con $date
    estado: 'pendiente'
  };
};

  // Función para guardar la cotización en la base de datos
  const saveQuotation = async () => {
    if (!selectedPaymentOption) {
      alert('Por favor, seleccione una opción de pago');
      return;
    }
    if (!email || !customerName) {
      alert('Por favor, complete todos los campos');
      return;
    }

    setSaving(true);
    try {
      const quotationData = createQuotationData();
      await saveQuotationToBackend(quotationData);
      
      // Mostrar mensaje de confirmación
      setShowConfirmation(true);
      setShowEmailForm(false);
      
      // Resetear formulario y selección
      setEmail('');
      setCustomerName('');
      setSelectedPaymentOption(null);
      onResetSelection(); // Llamamos a la función para resetear la selección
      
      // Ocultar mensaje de confirmación después de 3 segundos
      setTimeout(() => setShowConfirmation(false), 6000);
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      alert('Error al guardar la cotización. Por favor, intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuote = () => {
    if (!selectedPaymentOption) {
      alert('Por favor, seleccione una opción de pago antes de guardar la cotización');
      return;
    }
    setShowEmailForm(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Resumen de Cotización
      </h2>
      
      {showConfirmation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
          <div className="mr-2 flex-shrink-0">✓</div>
          <p>¡Cotización guardada correctamente! Los datos han sido reseteados.</p>
        </div>
      )}

      {selectedLaws.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Seleccione leyes del catálogo para generar una cotización
        </div>
      ) : (
        <>
           <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
              <BookOpenIcon className="mr-2 text-blue-600" size={20} />
              Leyes Seleccionadas ({selectedLaws.length})
            </h3>
            <div className="border rounded-md divide-y">
              {selectedLaws.map(law => <div key={law.id} className="p-3 flex justify-between">
                  <span>{law.name}</span>
                  <span className="font-medium">${law.price}</span>
                </div>)}
              <div className="p-3 flex justify-between bg-gray-50">
                <span className="font-medium">Subtotal Leyes</span>
                <span className="font-medium">${totalPrice}</span>
              </div>
            </div>
          </div>
          {hasVeryThickLaws && <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
              <AlertTriangleIcon className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-sm text-amber-700">
                Su selección incluye leyes muy gruesas que requieren volúmenes
                separados.
              </p>
            </div>}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
              <BookmarkIcon className="mr-2 text-blue-600" size={20} />
              Agrupamiento Sugerido ({volumes.length} volúmenes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {volumes.map((volume, idx) => <div key={idx} className="border rounded-md p-3 bg-blue-50 border-blue-200">
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
                <span>Costo de encuadernación ({volumes.length} × $10)</span>
                <span className="font-medium">${bindingCost}</span>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Costo Total
            </h3>
            <div className="border rounded-md p-4 bg-blue-600 text-white flex justify-between items-center">
              <span className="text-xl">Total a pagar</span>
              <span className="text-2xl font-bold">${grandTotal}</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
              <CreditCardIcon className="mr-2 text-blue-600" size={20} />
              Opciones de Pago
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {paymentOptions.map(option => <div key={option.installments} className={`border rounded-md p-3 text-center cursor-pointer ${selectedPaymentOption === option.installments ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-50'}`} onClick={() => setSelectedPaymentOption(option.installments)}>
                  <div className="text-sm text-gray-600">
                    {option.installments} cuota
                    {option.installments > 1 ? 's' : ''}
                  </div>
                  <div className="text-lg font-semibold text-blue-700">
                    ${option.amount}
                  </div>
                  <div className="text-xs text-gray-500">por cuota</div>
                </div>)}
            </div>
            {selectedPaymentOption && <div className="mt-2 text-sm text-blue-600 font-medium">
                Plan seleccionado: {selectedPaymentOption} cuota
                {selectedPaymentOption > 1 ? 's' : ''} de $
                {paymentOptions.find(o => o.installments === selectedPaymentOption)?.amount}
              </div>}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center" 
              onClick={handleSaveQuote} 
              disabled={selectedLaws.length === 0}
            >
              <MailIcon className="mr-2" size={18} />
              Guardar Cotización
            </button>
          </div>

          {/* Modal para ingresar datos del cliente */}
          {showEmailForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">
                  Guardar Cotización
                </h3>
                <p className="text-gray-600 mb-4">
                  Complete sus datos para guardar la cotización.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md p-2" 
                    placeholder="Su nombre completo" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correo electrónico *
                  </label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-md p-2" 
                    placeholder="correo@ejemplo.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100" 
                    onClick={() => setShowEmailForm(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50" 
                    onClick={saveQuotation}
                    disabled={saving || !email || !customerName}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};