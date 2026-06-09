'use client';

import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { useSplashStore } from '@/stores/splash-store';

const MESSAGES = [
  'Encendiendo el taller...',
  'Cargando diagnósticos...',
  'Sincronizando datos...',
  'Listo para trabajar.',
];

const DURATION = 2600;

function MotoSVG() {
  return (
    <svg
      viewBox="0 0 280 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="splash-moto-svg"
      aria-hidden
    >
      {/* Rear wheel */}
      <circle cx="57" cy="96" r="28" stroke="#10b981" strokeWidth="4.5" />
      <circle cx="57" cy="96" r="11" stroke="#10b981" strokeWidth="2" fill="rgba(16,185,129,0.12)" />

      {/* Front wheel */}
      <circle cx="208" cy="96" r="25" stroke="#10b981" strokeWidth="4.5" />
      <circle cx="208" cy="96" r="10" stroke="#10b981" strokeWidth="2" fill="rgba(16,185,129,0.12)" />

      {/* Swingarm */}
      <line x1="57" y1="96" x2="90" y2="75" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />

      {/* Main top frame: pivot → seat → headtube */}
      <path d="M90 75 L100 54 L148 46 L170 54" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Down tube: headtube → bottom bracket */}
      <path d="M170 54 L164 80 L90 82 L90 75" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Seat */}
      <path d="M100 54 L106 47 L148 40 L156 44 L150 54 L100 54 Z" fill="rgba(16,185,129,0.18)" stroke="#10b981" strokeWidth="2" />

      {/* Fuel tank */}
      <path d="M148 40 L166 44 L170 54 L160 56 L150 54 L148 40 Z" fill="rgba(16,185,129,0.24)" stroke="#10b981" strokeWidth="2" />

      {/* Engine block */}
      <rect x="94" y="70" width="62" height="28" rx="5" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="2.5" />
      {/* Engine fins */}
      <line x1="104" y1="70" x2="104" y2="98" stroke="#10b981" strokeWidth="1" opacity="0.35" />
      <line x1="116" y1="70" x2="116" y2="98" stroke="#10b981" strokeWidth="1" opacity="0.35" />
      <line x1="128" y1="70" x2="128" y2="98" stroke="#10b981" strokeWidth="1" opacity="0.35" />
      <line x1="140" y1="70" x2="140" y2="98" stroke="#10b981" strokeWidth="1" opacity="0.35" />

      {/* Front fork */}
      <path d="M170 54 L183 74 L208 96" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />

      {/* Handlebar stem */}
      <path d="M170 54 L172 40 L185 36" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="187" cy="35" r="4.5" fill="#10b981" />

      {/* Headlight */}
      <circle cx="182" cy="62" r="7" fill="rgba(16,185,129,0.18)" stroke="#10b981" strokeWidth="2.5" />
      {/* Headlight beam */}
      <line x1="189" y1="59" x2="204" y2="54" stroke="#10b981" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
      <line x1="189" y1="63" x2="206" y2="62" stroke="#10b981" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />

      {/* Exhaust pipe */}
      <path d="M94 90 L76 95 L60 96" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M60 96 L48 96" stroke="#10b981" strokeWidth="4" strokeLinecap="round" opacity="0.4" />

      {/* Chain line */}
      <line x1="85" y1="96" x2="183" y2="96" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.3" />
    </svg>
  );
}

export function SplashScreen() {
  const dismiss = useSplashStore((s) => s.dismiss);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = performance.now();

    const msgInterval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, DURATION / MESSAGES.length);

    let raf: number;
    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        setTimeout(dismiss, 450);
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      clearInterval(msgInterval);
      cancelAnimationFrame(raf);
    };
  }, [dismiss]);

  return (
    <div className={`splash-overlay${exiting ? ' splash-exit' : ''}`}>
      <div className="splash-bg-glow" aria-hidden />

      {/* Logo */}
      <div className="splash-logo">
        <div className="splash-logo-icon">
          <Wrench className="h-[18px] w-[18px] text-emerald-400" strokeWidth={2.25} />
        </div>
        <span className="splash-logo-text">
          Moto<span className="splash-logo-accent">Brain</span>
        </span>
      </div>

      {/* Center content: lines + moto + road + progress */}
      <div className="splash-content">
        {/* Moto row with speed lines */}
        <div className="splash-moto-row">
          {/* Lines left */}
          <div className="splash-lines splash-lines-left" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="splash-line"
                style={{ '--delay': `${i * 120}ms`, '--y': `${-24 + i * 12}px` } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Moto */}
          <div className="splash-moto-wrap" aria-hidden>
            <div className="splash-moto-glow" />
            <MotoSVG />
          </div>

          {/* Lines right */}
          <div className="splash-lines splash-lines-right" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="splash-line"
                style={{ '--delay': `${i * 120 + 60}ms`, '--y': `${-24 + i * 12}px` } as React.CSSProperties}
              />
            ))}
          </div>
        </div>

        {/* Dashed road */}
        <div className="splash-road" aria-hidden />

        {/* Message + progress bar */}
        <div className="splash-footer">
          <p className="splash-msg" key={msgIdx}>
            {MESSAGES[msgIdx]}
          </p>
          <div
            className="splash-bar-track"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="splash-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
