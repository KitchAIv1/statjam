/**
 * useCarouselDrag - Drag-to-scroll for horizontal carousels
 * Keeps TeamPageMatchupCarousel under 200 lines.
 */

import { useEffect } from 'react';

export function useCarouselDrag(scrollRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeftVal: number;
    let hasMoved = false;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-matchup-card]')) return;
      isDown = true;
      hasMoved = false;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
      startX = e.pageX - el.getBoundingClientRect().left;
      scrollLeftVal = el.scrollLeft;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.getBoundingClientRect().left;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        hasMoved = true;
        e.preventDefault();
        el.scrollLeft = scrollLeftVal - walk;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    let touchStartX: number;
    let touchScrollLeft: number;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].pageX - el.getBoundingClientRect().left;
      touchScrollLeft = el.scrollLeft;
    };

    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].pageX - el.getBoundingClientRect().left;
      el.scrollLeft = touchScrollLeft - (x - touchStartX) * 1.5;
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollRef]);
}
