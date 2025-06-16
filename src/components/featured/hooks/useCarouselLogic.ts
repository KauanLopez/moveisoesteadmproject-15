import { useEffect, useState, useRef, useCallback } from 'react';
import { useMobileDetection } from './useMobileDetection';
import { useAutoScroll } from './useAutoScroll';

interface Product {
  id: string;
  title: string;
  image: string;
}

export const useCarouselLogic = (products: Product[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useMobileDetection();
  
  const extendedProducts = products.length > 1 ? [...products, ...products, ...products] : products;
  const totalItems = products.length;

  const carouselRef = useRef<HTMLDivElement>(null);
  const itemWidthRef = useRef<number>(0);
  const containerWidthRef = useRef<number>(0);
  
  const userInteractionTimeoutRef = useRef<NodeJS.Timeout>();
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);
  
  const isProgrammaticScrollRef = useRef(false);
  const scrollEndDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSnapDoneRef = useRef(false);

  const updateDimensions = useCallback(() => {
    if (carouselRef.current) {
      containerWidthRef.current = carouselRef.current.offsetWidth;
      if (carouselRef.current.firstElementChild && totalItems > 0) {
        itemWidthRef.current = (carouselRef.current.firstElementChild as HTMLElement).offsetWidth;
      } else {
        itemWidthRef.current = 0;
      }
    }
  }, [totalItems]);

  useEffect(() => {
    if (totalItems > 0) {
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        const currentCarouselRef = carouselRef.current;
        let observer: ResizeObserver | null = null;
        if (currentCarouselRef) {
            observer = new ResizeObserver(updateDimensions);
            observer.observe(currentCarouselRef);
        }
        return () => {
            window.removeEventListener('resize', updateDimensions);
            if (currentCarouselRef && observer) {
                observer.unobserve(currentCarouselRef);
            }
            if (scrollEndDebounceTimeoutRef.current) clearTimeout(scrollEndDebounceTimeoutRef.current);
            if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
        };
    }
  }, [updateDimensions, totalItems]);

  useEffect(() => {
    const carouselElement = carouselRef.current;
    const preventWheelScroll = (event: WheelEvent) => {
      if (carouselElement && carouselElement.contains(event.target as Node)) {
        event.preventDefault();
      }
    };
    if (carouselElement) {
      carouselElement.addEventListener('wheel', preventWheelScroll, { passive: false });
    }
    return () => {
      if (carouselElement) {
        carouselElement.removeEventListener('wheel', preventWheelScroll);
      }
    };
  }, []);

  const handleUserInteraction = useCallback(() => {
    setIsUserInteracting(true); 
    if (userInteractionTimeoutRef.current) clearTimeout(userInteractionTimeoutRef.current);
    userInteractionTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false); 
    }, 5000);
  }, []);
  
  const calculateScrollLeftForCenter = useCallback((physicalIndex: number) => {
    if (itemWidthRef.current === 0 || containerWidthRef.current === 0) return 0;
    const itemCenterOffset = (physicalIndex * itemWidthRef.current) + (itemWidthRef.current / 2);
    const containerCenterOffset = containerWidthRef.current / 2;
    return itemCenterOffset - containerCenterOffset;
  }, []);

  const snapToItem = useCallback((logicalIndexToSnap: number, smooth = true) => {
    if (!carouselRef.current || totalItems === 0 || itemWidthRef.current === 0) {
        isProgrammaticScrollRef.current = false;
        return;
    }
    
    const newLogicalIndex = (logicalIndexToSnap % totalItems + totalItems) % totalItems;

    isProgrammaticScrollRef.current = true;
    
    if (scrollEndDebounceTimeoutRef.current) {
        clearTimeout(scrollEndDebounceTimeoutRef.current);
        scrollEndDebounceTimeoutRef.current = null;
    }
    
    const targetPhysicalIndex = newLogicalIndex + totalItems; // Alvo sempre no conjunto do meio
    const targetScrollLeft = calculateScrollLeftForCenter(targetPhysicalIndex);
    const currentScroll = carouselRef.current.scrollLeft;

    if (smooth && Math.abs(currentScroll - targetScrollLeft) < 2 && currentIndex === newLogicalIndex) {
        if (currentIndex !== newLogicalIndex) setCurrentIndex(newLogicalIndex);
        setTimeout(() => { isProgrammaticScrollRef.current = false; }, 50);
        return;
    }
    
    carouselRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
    
    if (currentIndex !== newLogicalIndex) {
        setCurrentIndex(newLogicalIndex);
    }
    
    const timeoutDuration = smooth ? 500 : 70; 
    setTimeout(() => { 
      isProgrammaticScrollRef.current = false; 
    }, timeoutDuration);

  }, [totalItems, calculateScrollLeftForCenter, currentIndex]);

  const onDragStart = useCallback((clientX: number, event?: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (event?.type === 'mousedown') (event as React.MouseEvent<HTMLDivElement>).preventDefault();
    if (!carouselRef.current || totalItems === 0 || !itemWidthRef.current || isDragging) return;
    
    if (scrollEndDebounceTimeoutRef.current) clearTimeout(scrollEndDebounceTimeoutRef.current);
    // O arraste em si não é "programático" no sentido de snap/teleporte ainda.
    // A flag isDragging cuidará de ignorar handleScroll.
    // isProgrammaticScrollRef será setado por snapToItem no onDragEnd.
    
    handleUserInteraction();
    setIsDragging(true); 
    setStartX(clientX);
    setInitialScrollLeft(carouselRef.current.scrollLeft);
    if (carouselRef.current) {
      carouselRef.current.style.scrollBehavior = 'auto';
      carouselRef.current.style.cursor = 'grabbing';
    }
  }, [handleUserInteraction, totalItems, isDragging]);

  const onDragMove = useCallback((clientX: number) => {
    if (!isDragging || !carouselRef.current) return;
    const x = clientX;
    const walk = (x - startX);
    carouselRef.current.scrollLeft = initialScrollLeft - walk;
  }, [isDragging, startX, initialScrollLeft]);

  const onDragEnd = useCallback(() => {
    if (!isDragging || !carouselRef.current || totalItems === 0 || !itemWidthRef.current) {
      if (isDragging) setIsDragging(false); 
      if (carouselRef.current) carouselRef.current.style.cursor = 'grab';
      return;
    }

    const finalScrollLeft = carouselRef.current.scrollLeft;
            
    if (carouselRef.current) {
        carouselRef.current.style.scrollBehavior = 'smooth';
        carouselRef.current.style.cursor = 'grab';
    }

    const centerOfViewport = finalScrollLeft + containerWidthRef.current / 2;
    const physicalIndexWhoseSlotContainsCenter = Math.floor(centerOfViewport / itemWidthRef.current);
    let logicalIndexToSnap = (physicalIndexWhoseSlotContainsCenter % totalItems + totalItems) % totalItems;
    
    setIsDragging(false); 
    snapToItem(logicalIndexToSnap, true);
    handleUserInteraction(); 

  }, [isDragging, totalItems, snapToItem, itemWidthRef, containerWidthRef, handleUserInteraction]);


  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => { if(isDragging) onDragMove(e.pageX); };
    const handleGlobalMouseUp = () => { if(isDragging) { onDragEnd(); } }; 
    const handleGlobalTouchMove = (e: TouchEvent) => { if (isDragging) onDragMove(e.touches[0].clientX); };
    const handleGlobalTouchEnd = () => { if(isDragging) { onDragEnd(); } };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => onDragStart(e.pageX, e), [onDragStart]);
  const handleTouchStartCallback = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    onDragStart(e.touches[0].clientX, e);
  }, [onDragStart]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current || isDragging || 
        !carouselRef.current || totalItems === 0 || itemWidthRef.current === 0) {
      return;
    }

    const container = carouselRef.current;
    const currentScroll = container.scrollLeft;
    const oneSetWidth = totalItems * itemWidthRef.current;

    // Lógica de Teletransporte (para scrolls manuais que atingem os clones)
    // O índice físico é calculado pela borda esquerda da área visível.
    const physicalIndexAtViewportStart = Math.round(currentScroll / itemWidthRef.current);

    // Estamos no conjunto de clones da ESQUERDA se o índice físico é menor que `totalItems`.
    // Ex: totalItems = 5. Clones da esquerda são índices 0-4. Conjunto do meio 5-9.
    // Se estamos vendo o item físico 4 (final do clone da esquerda) e rolamos mais para a esquerda,
    // o physicalIndexAtViewportStart pode se tornar 3, 2, etc.
    // Precisamos teleportar quando o usuário está prestes a sair do conjunto do meio para a esquerda.
    // O conjunto do meio começa no physicalIndex `totalItems`.
    // Se o physicalIndexAtViewportStart é, por exemplo, `totalItems - 1` (último item do clone da esquerda),
    // significa que o início da viewport está no último item do clone da esquerda.
    // Se o physicalIndexAtViewportStart < totalItems (estamos em algum lugar no primeiro clone)
    // E não estamos muito próximos do início absoluto do carrossel (currentScroll > buffer pequeno)
    if (physicalIndexAtViewportStart < totalItems && currentScroll > itemWidthRef.current * 0.1) {
        // Se o item centralizado logicamente (currentIndex) NÃO está no primeiro terço dos itens lógicos
        // E o scroll está efetivamente mostrando o primeiro conjunto de clones
        if (currentIndex >= 0 && physicalIndexAtViewportStart < totalItems - 0.5 /* está bem dentro do clone esquerdo */) {
            isProgrammaticScrollRef.current = true;
            container.scrollLeft = currentScroll + oneSetWidth; // Salta para a posição correspondente no conjunto do MEIO
            // Após o teletransporte, o currentIndex ainda é o antigo. 
            // O próximo snap (do auto-scroll ou debounce) deve usar o currentIndex correto.
            // O snapToItem chamado pelo auto-scroll ou debounce já fará setCurrentIndex.
            setTimeout(() => { isProgrammaticScrollRef.current = false; }, 100); // Aumentar um pouco o delay
            return; 
        }
    } 
    // Estamos no conjunto de clones da DIREITA se o índice físico é `totalItems * 2` ou maior.
    // Ex: totalItems = 5. Conjunto do meio 5-9. Clones da direita 10-14.
    // Se estamos vendo o item físico 10 (início do clone da direita) e rolamos mais para a direita.
    else if (physicalIndexAtViewportStart >= totalItems * 2 && physicalIndexAtViewportStart < extendedProducts.length - 0.1) {
        // Se o item centralizado logicamente (currentIndex) NÃO está no último terço dos itens lógicos
        // E o scroll está efetivamente mostrando o terceiro conjunto de clones
         if (currentIndex <= totalItems -1 && physicalIndexAtViewportStart >= totalItems * 2 + 0.5 /* bem dentro do clone direito */ ) {
            isProgrammaticScrollRef.current = true;
            container.scrollLeft = currentScroll - oneSetWidth; // Salta para a posição correspondente no conjunto do MEIO
            setTimeout(() => { isProgrammaticScrollRef.current = false; }, 100); // Aumentar um pouco o delay
            return;
        }
    }
    
    // Debounce para o snap magnético APENAS para scrolls manuais (scrollbar, etc.)
    if (scrollEndDebounceTimeoutRef.current) clearTimeout(scrollEndDebounceTimeoutRef.current);
    scrollEndDebounceTimeoutRef.current = setTimeout(() => {
      if (!isDragging && !isProgrammaticScrollRef.current && 
          carouselRef.current && itemWidthRef.current > 0) {
        const finalScroll = carouselRef.current.scrollLeft;
        const centerOfViewport = finalScroll + containerWidthRef.current / 2;
        const physicalIndexAtCenter = Math.floor(centerOfViewport / itemWidthRef.current);
        let finalLogicalIndex = (physicalIndexAtCenter % totalItems + totalItems) % totalItems;
        
        snapToItem(finalLogicalIndex, true); 
      }
    }, 250); 

  }, [isDragging, totalItems, itemWidthRef, containerWidthRef, extendedProducts.length, snapToItem, calculateScrollLeftForCenter, currentIndex]);

  useAutoScroll(isUserInteracting, totalItems, currentIndex, snapToItem);

  useEffect(() => {
    if (!initialSnapDoneRef.current && totalItems > 0 && carouselRef.current) {
        const initSetup = () => {
            updateDimensions(); 
            if (itemWidthRef.current > 0) { 
                snapToItem(0, false); 
                initialSnapDoneRef.current = true;
            } else {
                setTimeout(initSetup, 200); 
            }
        };
        const initTimeout = setTimeout(initSetup, 250); 
        return () => clearTimeout(initTimeout);
    }
  }, [totalItems, snapToItem, updateDimensions]);

  return {
    carouselRef,
    currentIndex,
    isMobile,
    extendedProducts,
    totalItems,
    snapToItem,
    handleScroll,
    handleMouseDown,
    handleTouchStart: handleTouchStartCallback,
    isDragging,
  };
};