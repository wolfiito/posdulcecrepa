# PosDulceCrepa - Sistema de Punto de Venta (POS)

## 📖 Descripción General
**PosDulceCrepa** es una aplicación web tipo *Single Page Application (SPA)* diseñada para gestionar las operaciones diarias de un Punto de Venta (POS). Su propósito es centralizar la gestión de ventas, el control de inventario en tiempo real, administración de turnos y la emisión de comprobantes, proporcionando una interfaz rápida e intuitiva para los cajeros y administradores.

El sistema está construido con un enfoque *API-less* delegando la capa de backend a Firebase, lo que permite operaciones en tiempo real, sincronización en múltiples pestañas y soporte de almacenamiento para funcionamiento sin conexión.

---

## 🛠️ Stack Tecnológico (Tech Stack)

### Frontend
* **Core:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Bundler:** [Vite](https://vitejs.dev/) (Rápido empaquetado y HMR)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [daisyUI](https://daisyui.com/) (Sistema de componentes UI)
* **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (Ligero y escalable)
* **Enrutamiento:** [React Router v6](https://reactrouter.com/)
* **Animaciones y Gráficos:** Framer Motion, Recharts
* **Exportables:** ExcelJS, xlsx, file-saver

### Backend (Backend-as-a-Service)
* **Infraestructura:** [Firebase](https://firebase.google.com/)
* **Autenticación:** Firebase Authentication
* **Base de Datos:** Cloud Firestore (NoSQL, transacciones atómicas, soporte offline)
* **Archivos:** Firebase Storage

---

## 🚀 Entorno de Desarrollo Local

### Prerrequisitos
1. **Node.js** (v18 o superior recomendado).
2. **NPM** (v9 o superior) o **Yarn** / **pnpm**.
3. Un proyecto en Firebase creado y configurado.

### Instalación y Ejecución

1. **Clonar el repositorio** e ir al directorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd posdulcecrepa
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto (basado en un `.env.example` si existe) con las credenciales de tu proyecto de Firebase. Debe lucir similar a esto:
   ```env
   VITE_FIREBASE_API_KEY="tu_api_key"
   VITE_FIREBASE_AUTH_DOMAIN="tu_auth_domain"
   VITE_FIREBASE_PROJECT_ID="tu_project_id"
   VITE_FIREBASE_STORAGE_BUCKET="tu_storage_bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="tu_messaging_sender_id"
   VITE_FIREBASE_APP_ID="tu_app_id"
   ```

4. **Levantar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible usualmente en `http://localhost:5173`.

---

## 📂 Estructura de Carpetas (`/src`)

La arquitectura del código fuente (`src/`) sigue un patrón modular por responsabilidades técnicas:

```text
src/
├── components/   # Componentes UI reutilizables (Botones, Modales, Tarjetas).
├── constants/    # Variables de configuración, enums y valores fijos.
├── hooks/        # React Hooks personalizados.
├── pages/        # Pantallas completas de la aplicación (Views) asociadas al Router.
├── services/     # Capa abstracta de lógica de negocio y comunicación con Firebase.
├── store/        # Stores de Zustand para gestionar el estado global (Sesión, Carrito, Inventario).
├── types/        # Definiciones de interfaces y tipos estrictos de TypeScript.
├── utils/        # Funciones auxiliares y formateadores (fecha, moneda, etc.).
├── firebase.ts   # Inicialización y configuración del SDK de Firebase.
├── App.tsx       # Componente raíz que maneja el enrutamiento (Router).
└── main.tsx      # Punto de entrada principal (Entry point) de React.
```

### Notas Adicionales de Arquitectura
Para mantener la escalabilidad, **ningún componente de React realiza llamadas directas a Firebase**. Toda la comunicación a la base de datos se delega a la carpeta `/services/`, y el estado de la UI reacciona a través de los *stores* definidos en `/store/`.
