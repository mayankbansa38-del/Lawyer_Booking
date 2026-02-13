import { useState, useEffect, useRef } from 'react';

/**
 * Smart positioning hook for dropdowns/popovers
 * Calculates optimal position (above/below) based on available viewport space
 * Only calculates on open to prevent layout thrashing
 * 
 * @param {boolean} isOpen - Whether the dropdown is currently open
 * @param {number} threshold - Minimum space below (in px) before showing above (default: 200)
 * @returns {Object} - { ref, position ('top' | 'bottom'), positionClass }
 */
export function useSmartPosition(isOpen = false, threshold = 200) {
    const ref = useRef(null);
    const [position, setPosition] = useState('bottom'); // 'top' or 'bottom'

    useEffect(() => {
        if (!isOpen || !ref.current) {
            return;
        }

        const calculatePosition = () => {
            const element = ref.current;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If not enough space below and more space above, show above
            if (spaceBelow < threshold && spaceAbove > threshold) {
                setPosition('top');
            } else {
                setPosition('bottom');
            }
        };

        // Calculate immediately when opened
        calculatePosition();

        // Recalculate on scroll/resize (debounced)
        let timeoutId;
        const handleUpdate = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(calculatePosition, 100);
        };

        window.addEventListener('scroll', handleUpdate, true);
        window.addEventListener('resize', handleUpdate);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('scroll', handleUpdate, true);
            window.removeEventListener('resize', handleUpdate);
        };
    }, [isOpen, threshold]);

    // Return Tailwind classes for convenience
    const positionClass = position === 'top'
        ? 'bottom-full mb-1'
        : 'top-full mt-1';

    return {
        ref,
        position,
        positionClass
    };
}
