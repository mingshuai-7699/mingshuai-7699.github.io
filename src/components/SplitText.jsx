import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

export default function SplitText({
  text,
  className = "",
  delay = 42,
  duration = 1,
  ease = "power3.out",
  splitType = "words, chars",
  from = { opacity: 0, y: 34 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-70px",
  textAlign,
  tag = "p",
  mask = true,
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const callbackRef = useRef(onLetterAnimationComplete);
  const completedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    callbackRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    let active = true;
    if (document.fonts.status === "loaded") setFontsLoaded(true);
    else document.fonts.ready.then(() => active && setFontsLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  useGSAP(() => {
    if (!ref.current || !text || !fontsLoaded || completedRef.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const element = ref.current;
    const startPercent = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
    const sign = marginValue === 0 ? "" : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
    const split = new GSAPSplitText(element, {
      type: splitType,
      smartWrap: splitType.includes("lines"),
      autoSplit: splitType.includes("lines"),
      linesClass: "split-line",
      wordsClass: "split-word",
      charsClass: "split-char",
      reduceWhiteSpace: false,
    });
    let targets = split.chars;
    if (!targets.length && splitType.includes("words")) targets = split.words;
    if (!targets.length && splitType.includes("lines")) targets = split.lines;

    const tween = gsap.fromTo(targets, { ...from }, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
      force3D: true,
      willChange: "transform, opacity",
      scrollTrigger: {
        trigger: element,
        start: `top ${startPercent}%${sign}`,
        once: true,
        fastScrollEnd: true,
        anticipatePin: 0.4,
      },
      onComplete: () => {
        completedRef.current = true;
        gsap.set(targets, { clearProps: "willChange" });
        callbackRef.current?.();
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(targets, { clearProps: "willChange" });
      split.revert();
    };
  }, {
    dependencies: [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, fontsLoaded],
    scope: ref,
  });

  const Tag = tag || "p";
  return (
    <Tag
      ref={ref}
      aria-label={text}
      className={`split-parent ${className}`.trim()}
      style={{ textAlign, whiteSpace: "pre-line", overflow: mask ? "hidden" : "visible" }}
    >
      {text}
    </Tag>
  );
}
