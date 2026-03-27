// src/components/ImagePreloader.tsx
import React, { useEffect } from 'react';
import { ICON_WEBPS } from './ProductIcons';

const ImagePreloader: React.FC = () => {
    useEffect(() => {
        // Preload all icons in the background after initial mount
        const preloadImages = () => {
            Object.values(ICON_WEBPS).forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        };

        // Delay preloading slightly to not compete with initial critical rendering
        const timeoutId = setTimeout(preloadImages, 1000);
        
        return () => clearTimeout(timeoutId);
    }, []);

    return null; // This component doesn't render anything
};

export default ImagePreloader;
