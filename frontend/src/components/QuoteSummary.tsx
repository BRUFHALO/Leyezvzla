import React, { useState, Component } from 'react';
import { Law, thickLawIds } from '../data/lawsData';
import { BookOpenIcon, BookmarkIcon, CreditCardIcon, AlertTriangleIcon, MailIcon } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
interface QuoteSummaryProps {
  selectedLaws: Law[];
  totalPrice: number;
}
export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  selectedLaws,
  totalPrice
}) => {
  const {
    paymentOptions: availablePaymentOptions,
    addCustomerSelection,
    veryThickLawIds
  } = useAdmin();
  // Estado para la opción de pago seleccionada
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<number | null>(null);
  // Estado para el correo electrónico del usuario
  const [email, setEmail] = useState<string>('');
  // Estado para mostrar el formulario de correo
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  // Estado para mostrar mensaje de confirmación
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  // Determinar agrupamientos de volúmenes
  const determineVolumes = () => {
    const volumes: Law[][] = [];
    let currentVolume: Law[] = [];
    let hasThickLaw = false;
    selectedLaws.forEach(law => {
      // Si es una ley muy gruesa, va en su propio volumen
      if (veryThickLawIds.includes(law.id)) {
        if (currentVolume.length > 0 && !hasThickLaw) {
          volumes.push([...currentVolume]);
          currentVolume = [];
        }
        volumes.push([law]);
        hasThickLaw = false;
      } else {
        // Si el volumen actual ya tiene una ley gruesa o tiene 3+ leyes, crear nuevo volumen
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
  // Calcular opciones de pago
  const paymentOptions = availablePaymentOptions.map(installments => ({
    installments,
    amount: Math.ceil(grandTotal / installments)
  }));
  // Verificar si hay leyes muy gruesas
  const hasVeryThickLaws = selectedLaws.some(law => law.thickness === 'very_high');
  // Función para generar el contenido del correo electrónico
  const generateEmailContent = () => {
    const selectedOption = paymentOptions.find(option => option.installments === selectedPaymentOption);
    // Crear el asunto del correo
    const subject = `Cotización de Leyes - Total: $${grandTotal}`;
    // CSS styles as a regular string, not a template literal
    const cssStyles = 'body { font-family: Arial, sans-serif; line-height: 1.6; } ' + '.container { max-width: 600px; margin: 0 auto; padding: 20px; } ' + 'h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; } ' + 'h2 { color: #1e40af; margin-top: 20px; } ' + '.section { margin-bottom: 20px; } ' + 'table { width: 100%; border-collapse: collapse; margin-bottom: 15px; } ' + 'th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; } ' + 'th { background-color: #f8fafc; } ' + '.total { font-size: 18px; font-weight: bold; color: #1e40af; } ' + '.volume { background-color: #eff6ff; padding: 10px; margin-bottom: 10px; border-radius: 5px; } ' + '.warning { background-color: #fff7ed; border: 1px solid #fdba74; padding: 10px; border-radius: 5px; color: #c2410c; } ' + '.payment-option { background-color: #dbeafe; padding: 10px; border-radius: 5px; margin-top: 5px; }';
    // Crear el cuerpo del correo con formato HTML
    let body = `
    <html>
    <head>
      <style>{`;
    $;
    {
      cssStyles;
    }
    ;
    `}</style>
    </head>
    <body>
      <div class="container">
        <h1>Cotización de Leyes</h1>
        <div class="section">
          <h2>Leyes Seleccionadas (${selectedLaws.length})</h2>
          <table>
            <tr>
              <th>Ley</th>
              <th>Precio</th>
            </tr>
    `;
    // Agregar las leyes seleccionadas
    selectedLaws.forEach(law => {
      body += `
            <tr>
              <td>${law.name}</td>
              <td>$${law.price}</td>
            </tr>
      `;
    });
    body += `
            <tr>
              <td><strong>Subtotal Leyes</strong></td>
              <td><strong>$${totalPrice}</strong></td>
            </tr>
          </table>
        </div>
    `;
    // Agregar advertencia si hay leyes muy gruesas
    if (hasVeryThickLaws) {
      body += `
        <div class="warning">
          <p>Su selección incluye leyes muy gruesas que requieren volúmenes separados.</p>
        </div>
      `;
    }
    // Agregar información de volúmenes
    body += `
        <div class="section">
          <h2>Agrupamiento Sugerido (${volumes.length} volúmenes)</h2>
    `;
    volumes.forEach((volume, idx) => {
      body += `
          <div class="volume">
            <h3>Volumen ${idx + 1}</h3>
            <ul>
      `;
      volume.forEach(law => {
        body += `<li>${law.name}</li>`;
      });
      body += `
            </ul>
          </div>
      `;
    });
    body += `
          <p>Costo de encuadernación (${volumes.length} × $10): <strong>$${bindingCost}</strong></p>
        </div>
        <div class="section">
          <h2>Costo Total</h2>
          <p class="total">Total a pagar: $${grandTotal}</p>
        </div>
    `;
    // Agregar información de la opción de pago seleccionada
    if (selectedOption) {
      body += `
        <div class="section">
          <h2>Plan de Pago Seleccionado</h2>
          <div class="payment-option">
            <p><strong>${selectedOption.installments} cuota${selectedOption.installments > 1 ? 's' : ''} de $${selectedOption.amount} cada una</strong></p>
          </div>
        </div>
      `;
    }
    body += `
      </div>
    </body>
    </html>
    `;
    return {
      subject,
      body
    };
  };
  // Función para enviar el correo electrónico y guardar la selección
  const sendEmail = () => {
    if (!selectedPaymentOption) {
      alert('Por favor, seleccione una opción de pago antes de guardar la cotización');
      return;
    }
    if (!email) {
      alert('Por favor, ingrese su dirección de correo electrónico');
      return;
    }
    const {
      subject,
      body
    } = generateEmailContent();
    // Save the customer selection to the admin context
    addCustomerSelection({
      customerEmail: email,
      selectedLaws,
      totalPrice,
      bindingCost,
      grandTotal,
      paymentOption: selectedPaymentOption,
      volumes
    });
    // Crear el enlace mailto
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Abrir el cliente de correo del usuario
    window.open(mailtoLink);
    // Ocultar el formulario de correo y mostrar confirmación
    setShowEmailForm(false);
    setShowConfirmation(true);
    // Ocultar la confirmación después de 3 segundos
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };
  // Función para mostrar el formulario de correo cuando se hace clic en el botón de guardar
  const handleSaveQuote = () => {
    if (!selectedPaymentOption) {
      alert('Por favor, seleccione una opción de pago antes de guardar la cotización');
      return;
    }
    setShowEmailForm(true);
  };
  return <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Resumen de Cotización
      </h2>
      {showConfirmation && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
          <div className="mr-2 flex-shrink-0">✓</div>
          <p>¡Cotización guardada y enviada correctamente!</p>
        </div>}
      {selectedLaws.length === 0 ? <div className="text-center py-8 text-gray-500">
          Seleccione leyes del catálogo para generar una cotización
        </div> : <>
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
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center" onClick={handleSaveQuote} disabled={selectedLaws.length === 0}>
              <MailIcon className="mr-2" size={18} />
              Guardar Cotización
            </button>
          </div>
          {/* Modal para ingresar el correo electrónico */}
          {showEmailForm && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">
                  Enviar Cotización
                </h3>
                <p className="text-gray-600 mb-4">
                  Ingrese su dirección de correo electrónico para recibir la
                  cotización detallada.
                </p>
                <input type="email" className="w-full border border-gray-300 rounded-md p-2 mb-4" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100" onClick={() => setShowEmailForm(false)}>
                    Cancelar
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={sendEmail}>
                    Enviar
                  </button>
                </div>
              </div>
            </div>}
        </>}
    </div>;
};