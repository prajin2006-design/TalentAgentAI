import React, { useEffect, useState, useRef } from 'react';

/**
 * CustomCursor — Inverted Ellipse Mouse-Follow Lens Effect
 *
 * Requirements:
 * - Negative-space / Inverted Ellipse lens following pointer with spring-like interpolation
 * - Dimensions: ~220px x 135px (adapts to viewport)
 * - Uses mix-blend-mode: difference with #FFFFFF fill for pure negative-space inversion
 * - System cursor remains visible (does not hide mouse pointer)
 * - Smooth trailing physics via requestAnimationFrame with ZERO React re-renders on mousemove
 * - pointer-events: none (does not block clicks, text selection, or hover states)
 * - Disabled on touch/mobile devices and prefers-reduced-motion
 */
export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef(null);

  // Trailing physics positions
  const posRef = useRef({ x: -500, y: -500 });
  const targetPosRef = useRef({ x: -500, y: -500 });
  const animFrameRef = useRef(null);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    // Disable on touch / coarse pointer devices
    if (window.matchMedia('(pointer: coarse), (hover: none)').matches) {
      return;
    }

    // Disable if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const handleMouseMove = (e) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };

      if (!isVisible) {
        setIsVisible(true);
      }

      // Check if pointer is over interactive elements to expand ellipse
      const target = e.target;
      if (target) {
        const isInteractive = !!target.closest(
          'button, a, input, select, textarea, [role="button"], .btn, .card-interactive, .badge, .prompt-chip-btn, .nav-pill-item, .hero-eyebrow-chip'
        );

        if (isInteractive !== isHoveringRef.current) {
          isHoveringRef.current = isInteractive;
          if (cursorRef.current) {
            if (isInteractive) {
              cursorRef.current.classList.add('hovering');
            } else {
              cursorRef.current.classList.remove('hovering');
            }
          }
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Smooth lerp trailing animation frame loop (factor 0.08 for slight elegant lag)
    const render = () => {
      const dx = targetPosRef.current.x - posRef.current.x;
      const dy = targetPosRef.current.y - posRef.current.y;

      posRef.current.x += dx * 0.08;
      posRef.current.y += dy * 0.08;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor-lens ${isVisible ? 'active' : ''}`}
      aria-hidden="true"
    />
  );
};

export default CustomCursor;
