import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

import "./Masonry.css";

const MEDIA_QUERIES = ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"];
const MEDIA_COLUMNS = [5, 4, 3, 2];

function useMedia(queries, values, defaultValue) {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    return values[queries.findIndex((query) => matchMedia(query).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState(get);

  useEffect(() => {
    const handler = () => setValue(get());
    const queryLists = queries.map((query) => matchMedia(query));
    queryLists.forEach((queryList) => queryList.addEventListener("change", handler));
    return () => queryLists.forEach((queryList) => queryList.removeEventListener("change", handler));
  }, [queries, values]);

  return value;
}

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect.width;
      setWidth((current) => (Math.abs(current - nextWidth) > 0.5 ? nextWidth : current));
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export default function Masonry({
  items,
  onItemClick,
  ease = "power3.out",
  duration = 0.42,
  stagger = 0.018,
  animateFrom = "bottom",
  scaleOnHover = false,
  hoverScale = 0.98,
  colorShiftOnHover = false,
}) {
  const columns = useMedia(MEDIA_QUERIES, MEDIA_COLUMNS, 1);
  const [containerRef, width] = useWidth();
  const itemRefs = useRef(new Map());
  const seenItems = useRef(new Set());
  const gap = 12;

  const grid = useMemo(() => {
    if (!width) return { items: [], height: 260 };

    const columnWidth = (width - gap * (columns - 1)) / columns;
    const columnHeights = new Array(columns).fill(0);
    const placed = items.map((item) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const x = column * (columnWidth + gap);
      const h = Math.max(176, columnWidth * item.heightRatio);
      const y = columnHeights[column];
      columnHeights[column] += h + gap;
      return { ...item, x, y, w: columnWidth, h };
    });

    return { items: placed, height: Math.max(260, Math.max(0, ...columnHeights) - gap) };
  }, [columns, items, width]);

  useLayoutEffect(() => {
    if (!grid.items.length) return undefined;
    const tweens = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    grid.items.forEach((item, index) => {
      const element = itemRefs.current.get(item.id);
      if (!element) return;

      const layout = { x: item.x, y: item.y, width: item.w, height: item.h };
      const isNew = !seenItems.current.has(item.id);
      gsap.set(element, { ...layout, opacity: 1, scale: 1 });

      if (isNew && !reducedMotion) {
        const start = { x: item.x, y: item.y + 28 };
        if (animateFrom === "top") start.y = item.y - 28;
        if (animateFrom === "left") start.x = item.x - 28;
        if (animateFrom === "right") start.x = item.x + 28;
        tweens.push(gsap.fromTo(element, {
          ...start,
          width: item.w,
          height: item.h,
          opacity: 0.01,
        }, {
          ...layout,
          opacity: 1,
          duration,
          ease,
          delay: Math.min(index, 10) * stagger,
          overwrite: "auto",
        }));
      }
      seenItems.current.add(item.id);
    });

    return () => {
      tweens.forEach((tween) => tween.kill());
      grid.items.forEach((item) => {
        const element = itemRefs.current.get(item.id);
        if (element) gsap.set(element, { opacity: 1 });
      });
    };
  }, [animateFrom, duration, ease, grid, stagger]);

  const handleMouseEnter = (event) => {
    if (scaleOnHover && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(event.currentTarget, { scale: hoverScale, duration: 0.24, ease: "power2.out" });
    }
    const video = event.currentTarget.querySelector("video");
    if (video) video.play().catch(() => {});
    if (colorShiftOnHover) gsap.to(event.currentTarget.querySelector(".masonry-color-overlay"), { opacity: 0.24, duration: 0.24 });
  };

  const handleMouseLeave = (event) => {
    if (scaleOnHover) gsap.to(event.currentTarget, { scale: 1, duration: 0.24, ease: "power2.out" });
    const video = event.currentTarget.querySelector("video");
    if (video) video.pause();
    if (colorShiftOnHover) gsap.to(event.currentTarget.querySelector(".masonry-color-overlay"), { opacity: 0, duration: 0.24 });
  };

  return (
    <div ref={containerRef} className="masonry-list" style={{ height: grid.height }}>
      {grid.items.map((item) => (
        <button
          type="button"
          key={item.id}
          ref={(node) => {
            if (node) itemRefs.current.set(item.id, node);
            else itemRefs.current.delete(item.id);
          }}
          className="masonry-item-wrapper"
          aria-label={item.label}
          onClick={() => onItemClick?.(item.entry)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="masonry-item-media">
            {item.kind === "video" ? (
              <video src={item.src} poster={item.poster} muted loop playsInline preload="none" />
            ) : (
              <img src={item.src} srcSet={item.srcSet} sizes={`${Math.ceil(item.w)}px`} alt="" loading="lazy" decoding="async" />
            )}
            {colorShiftOnHover && <span className="masonry-color-overlay" />}
          </span>
        </button>
      ))}
    </div>
  );
}
