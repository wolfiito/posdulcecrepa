import type { MenuItem, MenuGroup } from '../types/menu';

// --- Iconos SVG Personalizados (Tus obras de arte) ---

const IconBebidaFria = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="teaGrad" x1="32" y1="15" x2="32" y2="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FAD9C1"/> <stop offset="100%" stopColor="#E8B490"/> 
            </linearGradient>
            <linearGradient id="cupGrad" x1="10" y1="10" x2="54" y2="50" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#E0F7FA" stopOpacity="0.8"/>
            </linearGradient>
            <linearGradient id="strawGrad" x1="40" y1="2" x2="35" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF99CC"/>
                <stop offset="100%" stopColor="#E077AA"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="60" rx="20" ry="4" fill="#000000" fillOpacity="0.15"/>
        <path d="M37 10 L34 45" stroke="#E077AA" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
        <path d="M17 14H47L44 52C43.5 55 41 56 38 56H26C23 56 20.5 55 20 52L17 14Z" fill="url(#teaGrad)"/>
        <g fill="#5A3E2B">
            <circle cx="24" cy="50" r="3.5"/> <circle cx="32" cy="53" r="3.5"/> <circle cx="40" cy="50" r="3.5"/> <circle cx="28" cy="46" r="3"/> <circle cx="36" cy="46" r="3"/>
        </g>
        <g fill="white" opacity="0.8">
            <circle cx="23" cy="49" r="1"/> <circle cx="31" cy="52" r="1"/> <circle cx="39" cy="49" r="1"/>
        </g>
        <path d="M14 10H50L46 54C45 58 42 60 38 60H26C22 60 19 58 18 54L14 10Z" fill="url(#cupGrad)" stroke="#BDE0E8" strokeWidth="2.5" strokeLinejoin="round"/>
        <rect x="12" y="7" width="40" height="6" rx="3" fill="url(#cupGrad)" stroke="#BDE0E8" strokeWidth="2.5"/>
        <path d="M40 2 L37 14" stroke="url(#strawGrad)" strokeWidth="6" strokeLinecap="round"/>
        <ellipse cx="40" cy="2" rx="3" ry="1.5" fill="#FFBBDD"/>
        <g transform="translate(0, -2)"> 
            <ellipse cx="26" cy="32" rx="2.5" ry="3.5" fill="#5A3E2B"/>
            <ellipse cx="38" cy="32" rx="2.5" ry="3.5" fill="#5A3E2B"/>
            <circle cx="27" cy="31" r="1" fill="white"/>
            <circle cx="39" cy="31" r="1" fill="white"/>
            <path d="M30 35C31 37 33 37 34 35" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="22" cy="35" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/>
            <ellipse cx="42" cy="35" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/>
        </g>
        <path d="M18 18 C18 30 20 45 22 52" stroke="white" strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
        <path d="M15 12 H48" stroke="white" strokeWidth="2" opacity="0.4" strokeLinecap="round"/>
    </svg>
);

const IconPostre = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="cakeBody" x1="32" y1="20" x2="32" y2="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFF8DC"/> <stop offset="100%" stopColor="#FFE4B5"/>
            </linearGradient>
            <linearGradient id="frosting" x1="32" y1="10" x2="32" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFC0CB"/> <stop offset="100%" stopColor="#FFB6C1"/>
            </linearGradient>
        </defs>
        <path d="M10 50 L32 58 L54 50" stroke="black" strokeWidth="4" strokeOpacity="0.1" strokeLinecap="round"/>
        <path d="M32 55 L12 40 V25 L32 38 L52 25 V40 L32 55Z" fill="url(#cakeBody)" stroke="#EAC086" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M32 38 V55" stroke="#EAC086" strokeWidth="2" opacity="0.5"/>
        <path d="M12 32 L32 46 L52 32" stroke="#FF99AA" strokeWidth="3" opacity="0.8"/>
        <path d="M12 25 L32 15 L52 25 L32 38 L12 25Z" fill="url(#frosting)" stroke="#FF99AA" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M14 26 C14 26 16 32 18 29 C20 26 24 34 28 30 C32 26 32 38 32 38 C32 38 36 30 40 32 C44 34 48 28 50 26" fill="url(#frosting)"/>
        <path d="M32 8 C30 8 28 10 29 13 L32 18 L35 13 C36 10 34 8 32 8" fill="#FF4D6D"/>
        <g transform="translate(-6, 6) skewY(10)">
            <ellipse cx="24" cy="36" rx="2" ry="3" fill="#5A3E2B"/>
            <ellipse cx="34" cy="36" rx="2" ry="3" fill="#5A3E2B"/>
            <circle cx="25" cy="35" r="0.8" fill="white"/>
            <circle cx="35" cy="35" r="0.8" fill="white"/>
            <path d="M28 38 C28.5 39 29.5 39 30 38" stroke="#5A3E2B" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
    </svg>
);

const IconCrepaSalada = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="crepeBodyGrad" x1="10" y1="10" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE59E"/> <stop offset="100%" stopColor="#FDBF65"/>
            </linearGradient>
            <linearGradient id="creamGrad" x1="32" y1="5" x2="32" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF"/> <stop offset="100%" stopColor="#F0F0F0"/>
            </linearGradient>
            <linearGradient id="berryGrad" x1="38" y1="8" x2="38" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF7A8A"/> <stop offset="100%" stopColor="#E84B5F"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#000000" fillOpacity="0.15"/>
        <path d="M20 18C20 13 24 10 28 12C30 10 34 10 36 12C40 10 44 13 44 18C44 22 40 24 32 24C24 24 20 22 20 18Z" fill="url(#creamGrad)"/>
        <path d="M40 18C42 16 43 13 41 11C39 9 36 10 35 12C34 10 31 9 29 11C27 13 28 16 30 18C30 20 33 22 35 22C37 22 40 20 40 18Z" fill="url(#berryGrad)"/>
        <circle cx="33" cy="14" r="0.8" fill="#FFE59E"/> <circle cx="37" cy="14" r="0.8" fill="#FFE59E"/> <circle cx="35" cy="17" r="0.8" fill="#FFE59E"/>
        <path d="M18 20C14 20 12 24 14 30L26 54C28 58 36 58 38 54L50 30C52 24 50 20 46 20H18Z" fill="url(#crepeBodyGrad)" stroke="#EDA645" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M48 22C42 30 32 36 20 34"stroke="#EDA645" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="26" cy="40" rx="2.5" ry="3.5" fill="#5A3E2B"/> <ellipse cx="38" cy="40" rx="2.5" ry="3.5" fill="#5A3E2B"/>
        <circle cx="27" cy="39" r="1" fill="white"/> <circle cx="39" cy="39" r="1" fill="white"/>
        <path d="M29 43C30 45 34 45 35 43" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="22" cy="42" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/> <ellipse cx="42" cy="42" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/>
        <path d="M20 30C22 26 26 24 30 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
);

const IconCrepaDulce = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="crepeBodyGrad" x1="10" y1="10" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE59E"/> <stop offset="100%" stopColor="#FDBF65"/>
            </linearGradient>
            <linearGradient id="creamGrad" x1="32" y1="5" x2="32" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF"/> <stop offset="100%" stopColor="#F0F0F0"/>
            </linearGradient>
            <linearGradient id="berryGrad" x1="38" y1="8" x2="38" y2="18" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF7A8A"/> <stop offset="100%" stopColor="#E84B5F"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="18" ry="4" fill="#000000" fillOpacity="0.15"/>
        <path d="M20 18C20 13 24 10 28 12C30 10 34 10 36 12C40 10 44 13 44 18C44 22 40 24 32 24C24 24 20 22 20 18Z" fill="url(#creamGrad)"/>
        <path d="M40 18C42 16 43 13 41 11C39 9 36 10 35 12C34 10 31 9 29 11C27 13 28 16 30 18C30 20 33 22 35 22C37 22 40 20 40 18Z" fill="url(#berryGrad)"/>
        <circle cx="33" cy="14" r="0.8" fill="#FFE59E"/> <circle cx="37" cy="14" r="0.8" fill="#FFE59E"/> <circle cx="35" cy="17" r="0.8" fill="#FFE59E"/>
        <path d="M18 20C14 20 12 24 14 30L26 54C28 58 36 58 38 54L50 30C52 24 50 20 46 20H18Z" fill="url(#crepeBodyGrad)" stroke="#EDA645" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M48 22C42 30 32 36 20 34"stroke="#EDA645" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <ellipse cx="26" cy="40" rx="2.5" ry="3.5" fill="#5A3E2B"/> <ellipse cx="38" cy="40" rx="2.5" ry="3.5" fill="#5A3E2B"/>
        <circle cx="27" cy="39" r="1" fill="white"/> <circle cx="39" cy="39" r="1" fill="white"/>
        <path d="M29 43C30 45 34 45 35 43" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="22" cy="42" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/> <ellipse cx="42" cy="42" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/>
        <path d="M20 30C22 26 26 24 30 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
);

const IconCafeCaliente = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="mugGrad" x1="10" y1="20" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF"/> <stop offset="100%" stopColor="#E6E6E6"/>
            </linearGradient>
            <linearGradient id="coffeeGrad" x1="32" y1="20" x2="32" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C89F81"/> <stop offset="100%" stopColor="#A87B5D"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="16" ry="4" fill="#000000" fillOpacity="0.15"/>
        <path d="M46 30C52 30 54 36 52 42C50 48 44 50 42 48" stroke="#E6E6E6" strokeWidth="5" strokeLinecap="round"/>
        <path d="M14 24C14 24 16 54 22 54H42C48 54 50 24 50 24H14Z" fill="url(#mugGrad)" stroke="#D1D1D1" strokeWidth="2" strokeLinejoin="round"/>
        <ellipse cx="32" cy="24" rx="18" ry="6" fill="url(#coffeeGrad)" stroke="#D1D1D1" strokeWidth="2"/>
        <path d="M32 26C32 26 30 22 28 23C26 24 28 27 32 29C36 27 38 24 36 23C34 22 32 26 32 26Z" fill="#FFF5E6" opacity="0.9"/>
        <path d="M26 14C26 14 24 10 28 8" stroke="#CCCCCC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <path d="M38 16C38 16 40 12 36 8" stroke="#CCCCCC" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <g transform="translate(0, 8)">
            <ellipse cx="25" cy="32" rx="2.5" ry="3.5" fill="#5A3E2B"/> <ellipse cx="39" cy="32" rx="2.5" ry="3.5" fill="#5A3E2B"/>
            <circle cx="26" cy="31" r="1" fill="white"/> <circle cx="40" cy="31" r="1" fill="white"/>
            <path d="M30 34C31 35 33 35 34 34" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="21" cy="34" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/> <ellipse cx="43" cy="34" rx="3" ry="2" fill="#FF99AA" fillOpacity="0.6"/>
        </g>
    </svg>
);

const IconHotcakes = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="pancakeGrad" x1="32" y1="0" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFE082"/> <stop offset="100%" stopColor="#FFCA28"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="58" rx="20" ry="4" fill="black" fillOpacity="0.15"/>
        <path d="M14 46 C14 52 50 52 50 46 V38 C50 44 14 44 14 38 V46Z" fill="url(#pancakeGrad)" stroke="#E6B04A" strokeWidth="2"/>
        <path d="M14 38 C14 44 50 44 50 38 V30 C50 36 14 36 14 30 V38Z" fill="url(#pancakeGrad)" stroke="#E6B04A" strokeWidth="2"/>
        <ellipse cx="32" cy="28" rx="18" ry="8" fill="#FFE082" stroke="#E6B04A" strokeWidth="2"/>
        <path d="M14 28 C14 34 50 34 50 28" fill="url(#pancakeGrad)" opacity="0.5"/>
        <path d="M24 24 C24 24 26 38 28 42 C30 46 32 38 34 36 C36 34 38 44 40 40 C42 36 42 26 42 26" stroke="#D8832C" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <ellipse cx="32" cy="24" rx="10" ry="4" fill="#D8832C" opacity="0.8"/>
        <rect x="28" y="18" width="8" height="6" fill="#FFF9C4" stroke="#E6CE5C" strokeWidth="1"/>
        <g transform="translate(0, 6)">
            <ellipse cx="24" cy="38" rx="2.5" ry="3.5" fill="#5A3E2B"/> <ellipse cx="40" cy="38" rx="2.5" ry="3.5" fill="#5A3E2B"/>
            <circle cx="25" cy="37" r="1" fill="white"/> <circle cx="41" cy="37" r="1" fill="white"/>
            <path d="M30 41 C31 42 33 42 34 41" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
            <ellipse cx="20" cy="41" rx="2" ry="1.5" fill="#FF99AA" fillOpacity="0.7"/> <ellipse cx="44" cy="41" rx="2" ry="1.5" fill="#FF99AA" fillOpacity="0.7"/>
        </g>
    </svg>
);

const IconWaffle = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
            <linearGradient id="waffleGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFDB8B"/> <stop offset="100%" stopColor="#FCA33D"/>
            </linearGradient>
        </defs>
        <rect x="14" y="54" width="36" height="4" rx="2" fill="black" fillOpacity="0.15"/>
        <rect x="12" y="14" width="40" height="40" rx="4" fill="url(#waffleGrad)" stroke="#D98C35" strokeWidth="2"/>
        <g stroke="#D98C35" strokeWidth="2" strokeLinecap="round" opacity="0.6">
            <path d="M22 16 V52"/> <path d="M32 16 V52"/> <path d="M42 16 V52"/>
            <path d="M14 24 H50"/> <path d="M14 34 H50"/> <path d="M14 44 H50"/>
        </g>
        <rect x="26" y="10" width="12" height="10" rx="1" fill="#FFF59D" stroke="#E6CE5C" strokeWidth="1"/>
        <path d="M28 20 C28 20 28 28 30 30 C32 32 34 28 34 20" fill="#FFB300" opacity="0.9"/>
        <ellipse cx="24" cy="38" rx="2.5" ry="3.5" fill="#5A3E2B"/> <ellipse cx="40" cy="38" rx="2.5" ry="3.5" fill="#5A3E2B"/>
        <circle cx="25" cy="37" r="1" fill="white"/> <circle cx="41" cy="37" r="1" fill="white"/>
        <path d="M29 42C30 44 34 44 35 42" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round"/>
        <ellipse cx="20" cy="42" rx="2.5" ry="1.5" fill="#FF99AA"/> <ellipse cx="44" cy="42" rx="2.5" ry="1.5" fill="#FF99AA"/>
    </svg>
);

// --- Type Guards ---
function isGroup(item: MenuItem | MenuGroup): item is MenuGroup {
    return 'level' in item;
}

function isFixedPrice(item: MenuItem | MenuGroup): item is (MenuItem & { price: number }) {
    return !isGroup(item) && 'price' in item;
}

function isVariantPrice(item: MenuItem | MenuGroup): item is (MenuItem & { variants: any[] }) {
    return !isGroup(item) && 'variants' in item;
}

// --- Helper de Iconos ---
export function getIconForItem(item: MenuItem | MenuGroup): React.ReactNode {
    const id = item.id.toLowerCase();
    const category = 'category' in item ? item.category.toLowerCase() : '';

    // Mapeo de IDs/Categorías a Iconos SVG
    if (id.includes('dulces') || category.includes('dulces')) return <IconCrepaDulce />;
    if (id.includes('saladas') || category.includes('saladas')) return <IconCrepaSalada />;
    if (id.includes('bebidas_frias') || category.includes('frias')) return <IconBebidaFria />;
    if (id.includes('bebidas_calientes') || category.includes('calientes')) return <IconCafeCaliente />;
    if (id.includes('bebidas') || category.includes('bebidas')) return <IconBebidaFria />;
    if (id.includes('postres') || category.includes('postres')) return <IconPostre />;
    if (id.includes('hotcakes') || category.includes('hotcakes')) return <IconHotcakes />;
    if (id.includes('waffles') || category.includes('waffles')) return <IconWaffle />;
    if (id.includes('bublee') || category.includes('bublee')) return <span className="text-5xl">🧋</span>; // Emoji para lo que falta

    // Icono genérico por defecto
    return isGroup(item) ? <span className="text-5xl">📁</span> : <span className="text-5xl">🍽️</span>;
}

interface ProductCardProps {
  item: MenuItem | MenuGroup;
  onClick: () => void;
  isLarge?: boolean; // Prop nueva para controlar el tamaño
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onClick, isLarge = false }) => {
    const isGrp = isGroup(item);
    
    return (
        <div 
            onClick={onClick}
            className={`
                card h-full bg-base-100 
                rounded-box border border-base-200
                cursor-pointer transition-all duration-200
                hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]
                active:scale-95
                ${isGrp ? 'border-l-[6px] border-l-primary' : ''}
            `}
        >
            <div className="card-body p-4 items-center text-center justify-center">
                {/* Contenedor de Icono DINÁMICO */}
                <div className={`${isLarge ? 'w-24 h-24 mb-2' : 'w-16 h-16 mb-2'} flex items-center justify-center drop-shadow-sm transition-all duration-300`}>
                    {getIconForItem(item)}
                </div>
                
                {/* Nombre del Producto - Texto más grande si es isLarge */}
                <h3 className={`card-title font-bold leading-tight text-base-content line-clamp-2 flex items-center justify-center w-full ${isLarge ? 'text-xl' : 'text-sm min-h-[2.5rem]'}`}>
                    {item.name.split('(')[0].trim()}
                </h3>

                {/* Badge de Precio */}
                {!isGrp && !isLarge && (
                    <div className="mt-2">
                        {isFixedPrice(item) ? (
                            <div className="badge badge-accent badge-outline font-bold rounded-badge shadow-sm">
                                ${item.price.toFixed(2)}
                            </div>
                        ) : isVariantPrice(item) ? (
                            <div className="badge badge-secondary badge-outline text-xs rounded-badge shadow-sm">
                                Desde ${Math.min(...item.variants.map(v => v.price)).toFixed(0)}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}