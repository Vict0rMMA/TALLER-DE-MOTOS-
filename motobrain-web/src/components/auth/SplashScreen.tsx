'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { useSplashStore } from '@/stores/splash-store';

const MESSAGES = [
  'Encendiendo el taller...',
  'Cargando diagnósticos...',
  'Sincronizando datos...',
  'Listo para trabajar.',
];

const DURATION = 2600;

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

      {/* Speed lines left */}
      <div className="splash-lines splash-lines-left" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="splash-line"
            style={
              {
                '--delay': `${i * 130}ms`,
                '--y': `${-28 + i * 14}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Speed lines right */}
      <div className="splash-lines splash-lines-right" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="splash-line"
            style={
              {
                '--delay': `${i * 130 + 65}ms`,
                '--y': `${-28 + i * 14}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Logo */}
      <div className="splash-logo">
        <div className="splash-logo-icon">
          <Wrench className="h-[18px] w-[18px] text-emerald-400" strokeWidth={2.25} />
        </div>
        <span className="splash-logo-text">
          Moto<span className="splash-logo-accent">Brain</span>
        </span>
      </div>

      {/* Motorcycle */}
      <div className="splash-moto-wrap" aria-hidden>
        <div className="splash-moto-glow" />
        <Image
          src="/images/moto-akt-tt-ds.png"
          alt=""
          width={380}
          height={220}
          className="splash-moto-img"
          priority
        />
      </div>

      {/* Dashed road */}
      <div className="splash-road" aria-hidden />

      {/* Footer */}
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
  );
}
