// src/components/admin/RestoreBackup.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const RestoreBackup: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Función para poner nombres bonitos (ej. "crepa_dulce_base" -> "Crepa Dulce Base")
    const formatName = (str: string) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const handleRestore = async () => {
        if (!file) {
            toast.error("Por favor selecciona el archivo JSON del respaldo");
            return;
        }

        if (!window.confirm("🚨 ATENCIÓN: Esto regresará tu sistema EXACTAMENTE a la versión del archivo que subiste. ¿Continuar?")) return;

        setLoading(true);
        toast.info("Leyendo archivo de respaldo y reconstruyendo grupos...");

        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            const { menu_groups = [], menu_items = [], modifiers = [], price_rules = [] } = backup;

            // 1. Restaurar Reglas de Precio
            for (const rule of price_rules) {
                await setDoc(doc(db, "price_rules", rule.id), rule);
            }

            // 2. Restaurar Grupos Visuales (Árbol)
            for (const grp of menu_groups) {
                await setDoc(doc(db, "menu_groups", grp.id), grp);
            }

            // 3. Restaurar Productos
            for (const item of menu_items) {
                await setDoc(doc(db, "menu_items", item.id), item);
            }

            // 4. Restaurar Modificadores Y RECONSTRUIR LOS GRUPOS PERDIDOS
            const uniqueGroups = new Set<string>();
            for (const mod of modifiers) {
                await setDoc(doc(db, "modifiers", mod.id), mod);
                if (mod.group) {
                    uniqueGroups.add(mod.group); // Guardamos el nombre del grupo
                }
            }

            // 5. Inyectar la colección "modifier_groups" que faltaba en el respaldo
            for (const groupId of uniqueGroups) {
                await setDoc(doc(db, "modifier_groups", groupId), {
                    id: groupId,
                    name: formatName(groupId)
                });
            }

            toast.success("¡ÉXITO! Tu menú anterior ha sido restaurado por completo.");
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el archivo. Revisa la consola.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 border-2 border-dashed border-warning bg-warning/10 rounded-xl max-w-2xl mx-auto mt-10 text-center shadow-xl">
            <h2 className="text-3xl font-black text-warning mb-4">⏪ Máquina del Tiempo (Restaurar)</h2>
            <p className="mb-6 font-medium text-base-content/80">
                Selecciona el archivo <b>Respaldo_Menu_DulceCrepa_...json</b> que descargaste. 
                El sistema reconstruirá tus productos, precios y volverá a generar los grupos de ingredientes perdidos.
            </p>
            
            <input 
                type="file" 
                accept=".json" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input file-input-bordered file-input-warning w-full max-w-xs mb-6 mx-auto block" 
            />

            <button 
                onClick={handleRestore} 
                disabled={loading || !file}
                className="btn btn-warning btn-lg w-full text-warning-content shadow-xl shadow-warning/30"
            >
                {loading ? <span className="loading loading-spinner"></span> : "Restaurar mi menú viejo ⏪"}
            </button>
        </div>
    );
};