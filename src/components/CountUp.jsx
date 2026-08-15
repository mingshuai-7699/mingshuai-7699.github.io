import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 1.4,
  className = "",
  startWhen = true,
  separator = "",
  pad = 0,
  prefix = "",
  suffix = "",
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(direction === "down" ? to : from);
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  });
  const isInView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });

  const getDecimalPlaces = (number) => {
    const string = number.toString();
    if (!string.includes(".")) return 0;
    const decimals = string.split(".")[1];
    return parseInt(decimals, 10) !== 0 ? decimals.length : 0;
  };
  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback((latest) => {
    const formatted = Intl.NumberFormat("en-US", {
      useGrouping: Boolean(separator),
      minimumFractionDigits: maxDecimals,
      maximumFractionDigits: maxDecimals,
    }).format(latest);
    const normalized = separator ? formatted.replace(/,/g, separator) : formatted;
    return `${prefix}${normalized.padStart(pad, "0")}${suffix}`;
  }, [maxDecimals, pad, prefix, separator, suffix]);

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(direction === "down" ? to : from);
  }, [direction, formatValue, from, to]);

  useEffect(() => {
    if (!isInView || !startWhen) return undefined;
    onStart?.();
    if (reducedMotion) {
      motionValue.set(direction === "down" ? from : to);
      onEnd?.();
      return undefined;
    }
    const timer = window.setTimeout(() => motionValue.set(direction === "down" ? from : to), delay * 1000);
    const endTimer = window.setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(endTimer);
    };
  }, [delay, direction, duration, from, isInView, motionValue, onEnd, onStart, reducedMotion, startWhen, to]);

  useEffect(() => springValue.on("change", (latest) => {
    if (ref.current) ref.current.textContent = formatValue(latest);
  }), [formatValue, springValue]);

  return <span className={className} ref={ref} />;
}
