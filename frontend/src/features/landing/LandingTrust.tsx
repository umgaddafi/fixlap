import { CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import React, { useRef } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function LandingTrust() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);

  return (
    <section className="landing-trust" ref={ref}>
      <span className="scroll-reveal-card" style={{ '--reveal-index': 0 } as React.CSSProperties}>
        <ShieldCheck size={18}/> 90-day warranty
      </span>
      <span className="scroll-reveal-card" style={{ '--reveal-index': 1 } as React.CSSProperties}>
        <Sparkles size={18}/> Quality parts
      </span>
      <span className="scroll-reveal-card" style={{ '--reveal-index': 2 } as React.CSSProperties}>
        <CheckCircle2 size={18}/> 4.9/5 customer rating
      </span>
      <span className="scroll-reveal-card" style={{ '--reveal-index': 3 } as React.CSSProperties}>
        <Zap size={18}/> Same-day repairs
      </span>
    </section>
  );
}
