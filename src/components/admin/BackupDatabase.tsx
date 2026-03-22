import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

export const BackupDatabase: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleBackup = async () => {
        setLoading(true);
        toast.info("Generando archivo de respaldo...");

        try {
            const collectionsToBackup = ["branches"];
            const backupData: Record<string, any> = {};

            for (const colName of collectionsToBackup) {
                const snapshot = await getDocs(collection(db, colName));
                backupData[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            // Crear el archivo descargable
            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            // Simular clic para descargar
            const link = document.createElement("a");
            link.href = url;
            link.download = `Respaldo_Sucursales_DulceCrepa_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("¡Respaldo descargado exitosamente!");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el respaldo");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border border-base-300 bg-base-200 rounded-xl max-w-sm">
            <h3 className="text-lg font-bold mb-2">💾 Respaldo de Seguridad</h3>
            <p className="text-sm opacity-70 mb-4">Descarga una copia exacta de tu menú actual antes de hacer cambios.</p>
            <button onClick={handleBackup} disabled={loading} className="btn btn-neutral w-full">
                {loading ? <span className="loading loading-spinner"></span> : "Descargar Respaldo JSON"}
            </button>
        </div>
    );
};