import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";

const WIDTH = 3344;
const HEIGHT = 1882;

export default function StrokeImage({ src, className = "", label = "" }) {
  const rootRef = useRef(null);
  const strokeClipRef = useRef(null);
  const strokeImageRef = useRef(null);
  const fillRef = useRef(null);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [loadedSrc, setLoadedSrc] = useState("");

  useEffect(() => {
    const strokeClip = strokeClipRef.current;
    const strokeImage = strokeImageRef.current;
    const fill = fillRef.current;
    if (!strokeClip || !strokeImage || !fill || loadedSrc !== src) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(strokeClip, { attr: { width: WIDTH } });
      gsap.set(strokeImage, { opacity: 0 });
      gsap.set(fill, { attr: { width: WIDTH } });
      return undefined;
    }

    const timeline = gsap.timeline({ delay: 0.18 });
    timeline
      .set(strokeClip, { attr: { width: 0 } })
      .set(strokeImage, { opacity: 0.88 })
      .set(fill, { attr: { width: 0 } })
      .to(strokeClip, { attr: { width: WIDTH }, duration: 1.45, ease: "power2.out" })
      .to(fill, { attr: { width: WIDTH }, duration: 0.78, ease: "power2.inOut" }, 0.82)
      .to(strokeImage, { opacity: 0, duration: 0.35, ease: "power2.out" }, 1.45);

    return () => timeline.kill();
  }, [src, loadedSrc]);

  return (
    <span ref={rootRef} className={`stroke-image ${className}`.trim()} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <filter id={`outline-${rawId}`} x="-4%" y="-4%" width="108%" height="108%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="expanded" />
            <feComposite in="expanded" in2="SourceAlpha" operator="out" result="outline" />
            <feFlood floodColor="#ff6b24" result="orange" />
            <feComposite in="orange" in2="outline" operator="in" />
          </filter>
          <clipPath id={`stroke-clip-${rawId}`}>
            <rect ref={strokeClipRef} x="0" y="0" width="0" height={HEIGHT} />
          </clipPath>
          <clipPath id={`fill-clip-${rawId}`}>
            <rect ref={fillRef} x="0" y="0" width="0" height={HEIGHT} />
          </clipPath>
        </defs>
        <image
          ref={strokeImageRef}
          href={src}
          width={WIDTH}
          height={HEIGHT}
          filter={`url(#outline-${rawId})`}
          clipPath={`url(#stroke-clip-${rawId})`}
        />
        <image href={src} width={WIDTH} height={HEIGHT} clipPath={`url(#fill-clip-${rawId})`} onLoad={() => setLoadedSrc(src)} />
      </svg>
    </span>
  );
}
