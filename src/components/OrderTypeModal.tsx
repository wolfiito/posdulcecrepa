// // src/components/OrderTypeModal.tsx
// import React, { useState, useEffect } from 'react';


// interface OrderTypeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: (mode: 'Mesa 1' | 'Mesa 2' | 'Para Llevar', name: string) => void;
// }

// export const OrderTypeModal: React.FC<OrderTypeModalProps> = ({ isOpen, onClose, onConfirm }) => {
//   const [selectedMode, setSelectedMode] = useState<'Mesa 1' | 'Mesa 2' | 'Para Llevar' | null>(null);
//   const [customerName, setCustomerName] = useState('');

//   // Resetear al abrir
//   useEffect(() => {
//     if (isOpen) {
//         setSelectedMode(null);
//         setCustomerName('');
//     }
//   }, [isOpen]);

//   const handleConfirm = () => {
//     if (!selectedMode) return;
    
//     // Si es para llevar, exigimos nombre (o ponemos uno por defecto)
//     const finalName = customerName.trim() || (selectedMode === 'Para Llevar' ? 'Cliente Anónimo' : selectedMode);
    
//     onConfirm(selectedMode, finalName);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="modal modal-open z-[60]">
//       <div className="modal-box max-w-lg animate-fade-in bg-base-100">
//         <h3 className="font-bold text-2xl text-center mb-6">¿Dónde se servirá? 🍽️</h3>

//         {/* --- SELECCIÓN DE MODO --- */}
//         <div className="grid grid-cols-3 gap-4 mb-6">
//             <button 
//                 onClick={() => setSelectedMode('Mesa 1')}
//                 className={`btn h-24 flex-col gap-2 ${selectedMode === 'Mesa 1' ? 'btn-primary' : 'btn-outline'}`}
//             >
//                 <span className="text-3xl">🪑</span>
//                 Mesa 1
//             </button>
            
//             <button 
//                 onClick={() => setSelectedMode('Mesa 2')}
//                 className={`btn h-24 flex-col gap-2 ${selectedMode === 'Mesa 2' ? 'btn-primary' : 'btn-outline'}`}
//             >
//                 <span className="text-3xl">🪑</span>
//                 Mesa 2
//             </button>

//             <button 
//                 onClick={() => setSelectedMode('Para Llevar')}
//                 className={`btn h-24 flex-col gap-2 ${selectedMode === 'Para Llevar' ? 'btn-secondary' : 'btn-outline'}`}
//             >
//                 <span className="text-3xl">🛍️</span>
//                 Para Llevar
//             </button>
//         </div>

//         {/* --- INPUT DE NOMBRE (Solo si es Para Llevar) --- */}
//         {selectedMode === 'Para Llevar' && (
//             <div className="form-control w-full mb-6 animate-fade-in-up">
//                 <label className="label"><span className="label-text font-bold">Nombre del Cliente:</span></label>
//                 <input 
//                     type="text" 
//                     placeholder="Escribe el nombre..." 
//                     className="input input-bordered input-lg w-full bg-base-200 focus:bg-base-100"
//                     autoFocus
//                     value={customerName}
//                     onChange={(e) => setCustomerName(e.target.value)}
//                 />
//             </div>
//         )}

//         {/* --- BOTONES DE ACCIÓN --- */}
//         <div className="modal-action">
//             <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
//             <button 
//                 onClick={handleConfirm} 
//                 disabled={!selectedMode}
//                 className="btn btn-primary px-8 text-lg"
//             >
//                 Continuar ➔
//             </button>
//         </div>
//       </div>
//       <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
//     </div>
//   );
// };