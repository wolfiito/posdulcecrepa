// src/components/DailyReportModal.tsx
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { reportService, type DailyReportData } from '../services/reportService';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    maxWidth: '500px',
    padding: '0',
    border: 'none',
    borderRadius: '1rem',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 }
};

Modal.setAppElement('#root');

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      reportService.getDailyReport()
        .then(setData)
        .catch(err => alert("Error cargando reporte"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles} contentLabel="Corte de Caja">
      <div className="bg-neutral text-neutral-content p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Corte del Día</h2>
        <button onClick={onClose} className="btn btn-circle btn-ghost btn-sm">✕</button>
      </div>

      <div className="p-6 bg-base-100 overflow-y-auto max-h-[calc(90vh-80px)]">
        {loading ? (
          <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>
        ) : data ? (
          <div className="space-y-6">
            {/* Gran Total */}
            <div className="text-center p-4 bg-base-200 rounded-box">
              <p className="text-sm uppercase font-bold opacity-60">Venta Total Hoy</p>
              <p className="text-4xl font-black text-success">${data.totalSales.toFixed(2)}</p>
              <p className="text-xs mt-1">{data.totalOrders} órdenes pagadas</p>
            </div>

            {/* Desglose */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-100 text-green-800 rounded-box">
                <div className="text-lg">💵</div>
                <div className="font-bold text-sm">Efectivo</div>
                <div className="font-black">${data.cashTotal.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-blue-100 text-blue-800 rounded-box">
                <div className="text-lg">💳</div>
                <div className="font-bold text-sm">Tarjeta</div>
                <div className="font-black">${data.cardTotal.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-purple-100 text-purple-800 rounded-box">
                <div className="text-lg">🏦</div>
                <div className="font-bold text-sm">Transf.</div>
                <div className="font-black">${data.transferTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="divider"></div>

            <button onClick={onClose} className="btn btn-block">Cerrar</button>
          </div>
        ) : (
          <p className="text-center">No se encontraron datos.</p>
        )}
      </div>
    </Modal>
  );
};