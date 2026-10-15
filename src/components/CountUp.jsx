import { useEffect, useState } from 'react';

export default function CountUp({ value, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700);
      setN(Math.round(value * k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="num" style={style}>{n}</span>;
}
