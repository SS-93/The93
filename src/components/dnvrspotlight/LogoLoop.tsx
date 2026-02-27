import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import './LogoLoop.css';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NodeLogoItem {
  node: ReactNode;
  title?: string;
  ariaLabel?: string;
  href?: string;
}

interface ImageLogoItem {
  src: string;
  alt?: string;
  title?: string;
  href?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export type LogoItem = NodeLogoItem | ImageLogoItem;

interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  width?: string | number;
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoItem, key: string) => ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SMOOTH_TAU = 0.25;
const MIN_COPIES = 2;
const COPY_HEADROOM = 2;

const toCssLength = (v?: string | number) =>
  v === undefined ? undefined : typeof v === 'number' ? `${v}px` : v;

// ── Component ──────────────────────────────────────────────────────────────────
export const LogoLoop = memo(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    renderItem,
    ariaLabel = 'Sponsor logos',
    className,
    style,
  }: LogoLoopProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const seqRef = useRef<HTMLUListElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastTsRef = useRef<number | null>(null);
    const offsetRef = useRef(0);
    const velocityRef = useRef(0);

    const [seqWidth, setSeqWidth] = useState(0);
    const [seqHeight, setSeqHeight] = useState(0);
    const [copyCount, setCopyCount] = useState(MIN_COPIES);
    const [isHovered, setIsHovered] = useState(false);

    const isVertical = direction === 'up' || direction === 'down';

    const effectiveHoverSpeed = useMemo(() => {
      if (hoverSpeed !== undefined) return hoverSpeed;
      if (pauseOnHover === true) return 0;
      if (pauseOnHover === false) return undefined;
      return 0;
    }, [hoverSpeed, pauseOnHover]);

    const targetVelocity = useMemo(() => {
      const mag = Math.abs(speed);
      const dir = isVertical
        ? direction === 'up' ? 1 : -1
        : direction === 'left' ? 1 : -1;
      return mag * dir * (speed < 0 ? -1 : 1);
    }, [speed, direction, isVertical]);

    const updateDimensions = useCallback(() => {
      const cw = containerRef.current?.clientWidth ?? 0;
      const rect = seqRef.current?.getBoundingClientRect?.();
      const sw = rect?.width ?? 0;
      const sh = rect?.height ?? 0;

      if (isVertical) {
        const ph = containerRef.current?.parentElement?.clientHeight ?? 0;
        if (containerRef.current && ph > 0) {
          containerRef.current.style.height = `${Math.ceil(ph)}px`;
        }
        if (sh > 0) {
          setSeqHeight(Math.ceil(sh));
          const vp = containerRef.current?.clientHeight ?? ph ?? sh;
          setCopyCount(Math.max(MIN_COPIES, Math.ceil(vp / sh) + COPY_HEADROOM));
        }
      } else if (sw > 0) {
        setSeqWidth(Math.ceil(sw));
        setCopyCount(Math.max(MIN_COPIES, Math.ceil(cw / sw) + COPY_HEADROOM));
      }
    }, [isVertical]);

    // Resize observer
    useEffect(() => {
      const els = [containerRef.current, seqRef.current].filter(Boolean) as Element[];
      if (!window.ResizeObserver) {
        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        return () => window.removeEventListener('resize', updateDimensions);
      }
      const ro = new ResizeObserver(updateDimensions);
      els.forEach(el => ro.observe(el));
      updateDimensions();
      return () => ro.disconnect();
    }, [updateDimensions, logos, gap, logoHeight, isVertical]);

    // Image load observer
    useEffect(() => {
      const images = seqRef.current?.querySelectorAll('img') ?? [];
      if (images.length === 0) { updateDimensions(); return; }
      let remaining = images.length;
      const onLoad = () => { if (--remaining === 0) updateDimensions(); };
      images.forEach(img => {
        const el = img as HTMLImageElement;
        if (el.complete) onLoad();
        else { el.addEventListener('load', onLoad, { once: true }); el.addEventListener('error', onLoad, { once: true }); }
      });
      return () => { images.forEach(img => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onLoad); }); };
    }, [updateDimensions, logos, gap, logoHeight, isVertical]);

    // Animation loop
    useEffect(() => {
      const track = trackRef.current;
      if (!track) return;
      const seqSize = isVertical ? seqHeight : seqWidth;

      if (seqSize > 0) {
        offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
        track.style.transform = isVertical
          ? `translate3d(0, ${-offsetRef.current}px, 0)`
          : `translate3d(${-offsetRef.current}px, 0, 0)`;
      }

      const animate = (ts: number) => {
        if (lastTsRef.current === null) lastTsRef.current = ts;
        const dt = Math.max(0, ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;

        const target = isHovered && effectiveHoverSpeed !== undefined ? effectiveHoverSpeed : targetVelocity;
        const ease = 1 - Math.exp(-dt / SMOOTH_TAU);
        velocityRef.current += (target - velocityRef.current) * ease;

        if (seqSize > 0) {
          let next = offsetRef.current + velocityRef.current * dt;
          next = ((next % seqSize) + seqSize) % seqSize;
          offsetRef.current = next;
          track.style.transform = isVertical
            ? `translate3d(0, ${-next}px, 0)`
            : `translate3d(${-next}px, 0, 0)`;
        }

        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        lastTsRef.current = null;
      };
    }, [targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical]);

    const cssVars = useMemo(
      () => ({
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        ...(fadeOutColor ? { '--logoloop-fadeColor': fadeOutColor } : {}),
      }),
      [gap, logoHeight, fadeOutColor]
    );

    const rootClass = [
      'logoloop',
      isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
      fadeOut && 'logoloop--fade',
      scaleOnHover && 'logoloop--scale-hover',
      className,
    ].filter(Boolean).join(' ');

    const handleEnter = useCallback(() => { if (effectiveHoverSpeed !== undefined) setIsHovered(true); }, [effectiveHoverSpeed]);
    const handleLeave = useCallback(() => { if (effectiveHoverSpeed !== undefined) setIsHovered(false); }, [effectiveHoverSpeed]);

    const renderLogo = useCallback(
      (item: LogoItem, key: string) => {
        if (renderItem) {
          return <li className="logoloop__item" key={key} role="listitem">{renderItem(item, key)}</li>;
        }
        const isNode = 'node' in item;
        const content = isNode ? (
          <span className="logoloop__node">{(item as NodeLogoItem).node}</span>
        ) : (
          <img
            src={(item as ImageLogoItem).src}
            alt={(item as ImageLogoItem).alt ?? ''}
            title={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );
        const label = isNode
          ? ((item as NodeLogoItem).ariaLabel ?? item.title)
          : ((item as ImageLogoItem).alt ?? item.title);
        const wrapped = item.href ? (
          <a className="logoloop__link" href={item.href} aria-label={label || 'logo'} target="_blank" rel="noreferrer noopener">
            {content}
          </a>
        ) : content;
        return <li className="logoloop__item" key={key} role="listitem">{wrapped}</li>;
      },
      [renderItem]
    );

    const lists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, ci) => (
          <ul
            key={`copy-${ci}`}
            className="logoloop__list"
            role="list"
            aria-hidden={ci > 0}
            ref={ci === 0 ? seqRef : undefined}
          >
            {logos.map((item, ii) => renderLogo(item, `${ci}-${ii}`))}
          </ul>
        )),
      [copyCount, logos, renderLogo]
    );

    const containerStyle = useMemo(
      () => ({
        width: isVertical ? (toCssLength(width) === '100%' ? undefined : toCssLength(width)) : (toCssLength(width) ?? '100%'),
        ...cssVars,
        ...style,
      }),
      [width, cssVars, style, isVertical]
    );

    return (
      <div ref={containerRef} className={rootClass} style={containerStyle} role="region" aria-label={ariaLabel}>
        <div className="logoloop__track" ref={trackRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
          {lists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';
export default LogoLoop;
