// scripts/audit-order-totals.mjs
//
// Auditoría de SOLO LECTURA: busca órdenes cuyo `total` guardado no coincide con
// la suma de sus productos (finalPrice × quantity). Pasaba al quitar un producto
// de una orden ya enviada antes de la corrección en OrdersScreen.
//
// No escribe nada en Firestore.
//
// Uso:
//   node scripts/audit-order-totals.mjs <ruta-al-.env> [--csv salida.csv]
//
// El .env debe tener las mismas variables VITE_FIREBASE_* que usa la app.
// Las credenciales se leen solo del archivo; el script nunca las imprime.
// Recuerda que los .env no se versionan (están en .gitignore).

import { readFileSync, writeFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const [envPath, ...rest] = process.argv.slice(2);
if (!envPath) {
    console.error('Uso: node scripts/audit-order-totals.mjs <ruta-al-.env> [--csv salida.csv]');
    process.exit(1);
}
const csvIndex = rest.indexOf('--csv');
const csvPath = csvIndex > -1 ? rest[csvIndex + 1] : null;

// --- Leer configuración del .env (sin dependencias extra) ---
const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.includes('='))
        .map(line => {
            const i = line.indexOf('=');
            return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
);

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.projectId) {
    console.error('El .env no tiene VITE_FIREBASE_PROJECT_ID.');
    process.exit(1);
}

const db = getFirestore(initializeApp(firebaseConfig));

const toDate = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
};

const money = (n) => `$${n.toFixed(2)}`;

// --- Auditoría ---
console.log(`Proyecto: ${firebaseConfig.projectId}`);
console.log('Leyendo órdenes (solo lectura)...\n');

const snapshot = await getDocs(collection(db, 'orders'));

const mismatches = [];
let reviewed = 0;

snapshot.forEach(docSnap => {
    const order = docSnap.data();
    if (order.status === 'cancelled') return;
    reviewed++;

    const items = order.items || [];
    const expected = items.reduce((sum, item) => sum + (item.finalPrice || 0) * (item.quantity || 1), 0);
    const stored = order.total || 0;
    const diff = expected - stored;

    // Tolerancia de un centavo por redondeo
    if (Math.abs(diff) < 0.01) return;

    mismatches.push({
        id: docSnap.id,
        branchId: order.branchId || '',
        orderNumber: order.orderNumber ?? '',
        date: toDate(order.createdAt),
        status: order.status || '',
        customer: order.customerName || '',
        stored,
        expected,
        diff,
        hasMultiQty: items.some(item => (item.quantity || 1) > 1)
    });
});

mismatches.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

console.log(`Órdenes revisadas (sin canceladas): ${reviewed}`);
console.log(`Órdenes con total que no cuadra:    ${mismatches.length}\n`);

if (mismatches.length > 0) {
    console.table(mismatches.map(m => ({
        Folio: m.orderNumber,
        Fecha: m.date ? m.date.toLocaleString('es-MX') : '--',
        Estado: m.status,
        Sucursal: m.branchId,
        Cliente: m.customer,
        'Total guardado': money(m.stored),
        'Total correcto': money(m.expected),
        Diferencia: money(m.diff),
        'Línea con cantidad > 1': m.hasMultiQty ? 'sí' : 'no'
    })));

    const byStatus = mismatches.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + m.diff;
        return acc;
    }, {});
    console.log('\nDiferencia acumulada por estado:');
    Object.entries(byStatus).forEach(([status, total]) => console.log(`  ${status}: ${money(total)}`));
}

if (csvPath) {
    const header = 'id,folio,fecha,estado,sucursal,cliente,total_guardado,total_correcto,diferencia,linea_cantidad_mayor_1';
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = mismatches.map(m => [
        m.id, m.orderNumber, m.date ? m.date.toISOString() : '', m.status, m.branchId,
        m.customer, m.stored.toFixed(2), m.expected.toFixed(2), m.diff.toFixed(2), m.hasMultiQty ? 'si' : 'no'
    ].map(escape).join(','));
    writeFileSync(csvPath, [header, ...rows].join('\n'), 'utf8');
    console.log(`\nCSV guardado en: ${csvPath}`);
}

process.exit(0);
