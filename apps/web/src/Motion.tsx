import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';
gsap.registerPlugin(ScrollTrigger);

export function MotionLayer() {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({
        autoRaf: true,
        lerp: 0.09,
        anchors: true,
        prevent: (node) => !!node.closest('[data-lenis-prevent], .modal'),
      });
      lenis.on('scroll', ScrollTrigger.update);
      const reset = () => lenis.scrollTo(0, { immediate: true, force: true });
      window.addEventListener('nexus:navigate', reset);
      return () => {
        window.removeEventListener('nexus:navigate', reset);
        lenis.destroy();
      };
    });
    media.add(
      '(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)',
      () => {
        const node = cursor.current!;
        let x = -100,
          y = -100,
          cx = -100,
          cy = -100,
          frame = 0,
          visible = false;
        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          x = event.clientX;
          y = event.clientY;
          const target = event.target as Element;
          const typing = !!target.closest('input,textarea,[contenteditable]');
          visible = !typing;
          // Keep the native pointer visible even if the decorative follower cannot render.
          node.classList.toggle('is-visible', visible);
          node.classList.toggle('is-link', !!target.closest('a,button,summary,label'));
          node.classList.toggle('is-scene', !!target.closest('canvas'));
          if (!frame) {
            cx = x;
            cy = y;
            frame = requestAnimationFrame(tick);
          }
        };
        const tick = () => {
          cx += (x - cx) * 0.23;
          cy += (y - cy) * 0.23;
          node.style.transform = `translate3d(${cx}px,${cy}px,0)`;
          frame = visible ? requestAnimationFrame(tick) : 0;
        };
        const hide = () => {
          visible = false;
          node.classList.remove('is-visible');
          document.documentElement.classList.remove('custom-pointer');
        };
        const key = (e: KeyboardEvent) => {
          if (e.key === 'Tab') hide();
        };
        window.addEventListener('pointermove', move);
        document.addEventListener('pointerleave', hide);
        window.addEventListener('blur', hide);
        window.addEventListener('keydown', key);
        return () => {
          cancelAnimationFrame(frame);
          hide();
          window.removeEventListener('pointermove', move);
          document.removeEventListener('pointerleave', hide);
          window.removeEventListener('blur', hide);
          window.removeEventListener('keydown', key);
        };
      },
    );
    return () => media.revert();
  }, []);
  return (
    <div ref={cursor} className="nexus-cursor" aria-hidden="true">
      <span>↗</span>
    </div>
  );
}

export function useLandingMotion(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('.scroll-reveal').forEach((el) =>
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          }),
        );
      }, ref);
      return () => context.revert();
    });
    return () => media.revert();
  }, [ref]);
}
