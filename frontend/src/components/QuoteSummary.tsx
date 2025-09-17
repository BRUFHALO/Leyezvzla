import React, { useState, useEffect } from 'react';
import { Law, thickLawIds } from '../data/lawsData';
import { BookOpenIcon, BookmarkIcon, CreditCardIcon, AlertTriangleIcon, MailIcon, PackageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdmin } from '../context/AdminContext';
import { Quotation, saveQuotationToBackend } from '../data/quotationsData';
import { EncuadernacionType, calculateEncuadernacionCost, canFitInSingleVolume } from '../data/encuadernacionData';


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
    veryThickLawIds,
    encuadernaciones,
    loadEncuadernaciones
  } = useAdmin();

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<number | null>(null);
  const [selectedEncuadernacion, setSelectedEncuadernacion] = useState<EncuadernacionType | null>(null);
  const [email, setEmail] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [touched, setTouched] = useState({
    email: false,
    name: false
  });

  // Cargar encuadernaciones al montar el componente
  useEffect(() => {
    loadEncuadernaciones();
  }, []);

  // Función para validar el correo electrónico
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Manejar cambios en el correo electrónico con validación
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value === '') {
      setEmailError('El correo electrónico es requerido');
    } else if (!validateEmail(value)) {
      setEmailError('Ingrese un correo electrónico válido');
    } else {
      setEmailError('');
    }
  };

  const saveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos antes de enviar
    if (!customerName.trim()) {
      setTouched({...touched, name: true});
      return;
    }
    
    if (!email) {
      setEmailError('El correo electrónico es requerido');
      setTouched({...touched, email: true});
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Ingrese un correo electrónico válido');
      setTouched({...touched, email: true});
      return;
    }
    
    setSaving(true);
    try {
      const quotationData = createQuotationData();
      await saveQuotationToBackend(quotationData);
      
      // Mostrar toast de éxito
      toast.success('Cotización creada con éxito. Nos contactaremos en la brevedad.', {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      
      // Cerrar el modal de ingreso de datos
      setShowEmailForm(false);
      
      // Resetear el formulario y la selección del usuario
      setCustomerName('');
      setEmail('');
      setSelectedPaymentOption(null);
      setSelectedEncuadernacion(null);
      setTouched({ email: false, name: false });
      
      // Limpiar la selección de leyes usando la función onResetSelection
      if (onResetSelection) {
        onResetSelection();
      }
      
      // Mostrar confirmación en el componente
      setShowConfirmation(true);
      
      // Ocultar mensaje de confirmación después de 6 segundos
      setTimeout(() => setShowConfirmation(false), 6000);
      
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast.error('Error al guardar la cotización. Por favor, intente nuevamente.', {
        duration: 5000,
        position: 'top-right'
      });
    } finally {
      setSaving(false);
    }
  };

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
  const bindingCost = selectedEncuadernacion ? calculateEncuadernacionCost(selectedEncuadernacion, volumes.length) : 0;
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
        costo_unitario: selectedEncuadernacion?.precio || 0,
        total: bindingCost,
        tipo_encuadernacion: selectedEncuadernacion ? {
          material: selectedEncuadernacion.material,
          tamano: selectedEncuadernacion.tamano,
          precio: selectedEncuadernacion.precio
        } : undefined
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

  // Función para manejar el clic en el botón de guardar cotización
  const handleSaveQuote = () => {
    if (!selectedPaymentOption) {
      toast.error('Por favor, seleccione una opción de pago');
      return;
    }
    if (!selectedEncuadernacion) {
      toast.error('Por favor, seleccione un tipo de encuadernación');
      return;
    }
    setShowEmailForm(true);
    // Resetear estados de validación
    setEmailError('');
    setTouched({ email: false, name: false });
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

          {/* Sección de selección de encuadernación */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
              <PackageIcon className="mr-2 text-blue-600" size={20} />
              Tipo de Encuadernación
            </h3>
            {encuadernaciones.length === 0 ? (
              <div className="text-center py-4 text-gray-500 border rounded-md">
                Cargando opciones de encuadernación...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {encuadernaciones.map(encuadernacion => (
                  <div 
                    key={encuadernacion._id} 
                    className={`border rounded-md p-3 cursor-pointer transition-colors ${
                      selectedEncuadernacion?._id === encuadernacion._id 
                        ? 'bg-blue-100 border-blue-400' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedEncuadernacion(encuadernacion)}
                  >
                    <div className="font-medium text-gray-800">
                      {encuadernacion.material}
                    </div>
                    <div className="text-sm text-gray-600">
                      Tamaño: {encuadernacion.tamano}
                    </div>
                    <div className="text-lg font-semibold text-blue-700">
                      ${encuadernacion.precio}
                    </div>
                    <div className="text-xs text-gray-500">por volumen</div>
                  </div>
                ))}
              </div>
            )}
            {selectedEncuadernacion && (
              <div className="mt-3 p-3 border rounded-md bg-blue-50">
                <div className="flex justify-between">
                  <span>
                    Encuadernación seleccionada: {selectedEncuadernacion.material} ({selectedEncuadernacion.tamano})
                  </span>
                  <span className="font-medium">
                    {volumes.length} × ${selectedEncuadernacion.precio} = ${bindingCost}
                  </span>
                </div>
              </div>
            )}
            {!selectedEncuadernacion && (
              <div className="mt-3 p-3 border border-amber-200 rounded-md bg-amber-50">
                <div className="flex items-center text-amber-700">
                  <AlertTriangleIcon className="mr-2 flex-shrink-0" size={16} />
                  <span className="text-sm">
                    Por favor, seleccione un tipo de encuadernación para continuar
                  </span>
                </div>
              </div>
            )}
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSaveQuote} 
              disabled={selectedLaws.length === 0 || !selectedEncuadernacion}
            >
              <MailIcon className="mr-2" size={18} />
              Guardar Cotización
            </button>
          </div>

          {/* Modal para ingresar datos del cliente */}
          {showEmailForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Encabezado */}
                <div className="bg-blue-600 p-5">
                  <div className="flex items-center">
                    <MailIcon className="text-white mr-3" size={24} />
                    <h3 className="text-xl font-semibold text-white">
                      Guardar Cotización
                    </h3>
                  </div>
                  <p className="text-blue-100 mt-1 text-sm">
                    Complete sus datos para guardar la cotización
                  </p>
                </div>
                
                {/* Cuerpo del formulario */}
                <form onSubmit={saveQuotation} className="p-6">
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className={`w-full px-4 py-3 border ${touched.name && !customerName.trim() ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                        placeholder="Su nombre completo" 
                        value={customerName} 
                        onChange={(e) => setCustomerName(e.target.value)}
                        onBlur={() => setTouched({...touched, name: true})}
                      />
                      {touched.name && !customerName.trim() && (
                        <p className="mt-1 text-sm text-red-600">El nombre es requerido</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input 
                        type="email" 
                        className={`w-full pl-10 pr-4 py-3 ${emailError ? 'border-red-500' : 'border-gray-300'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`} 
                        placeholder="correo@ejemplo.com" 
                        value={email} 
                        onChange={handleEmailChange}
                        onBlur={() => setTouched({...touched, email: true})}
                      />
                      {emailError && (
                        <p className="mt-1 text-sm text-red-600">{emailError}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button 
                      type="button"
                      className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                      onClick={() => setShowEmailForm(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className={`px-5 py-2.5 rounded-lg font-medium text-white ${saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all`}
                      disabled={saving || !email || !customerName.trim() || !!emailError}
                    >
                      {saving ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </span>
                      ) : 'Guardar Cotización'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};