'use client';

import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

export function AnimatedCounter({ end, prefix, suffix, decimals = 0 }: { end: number, prefix?: string, suffix?: string, decimals?: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <span ref={ref}>
      {inView ? <CountUp end={end} prefix={prefix} suffix={suffix} decimals={decimals} duration={2.5} /> : '0'}
    </span>
  );
}
