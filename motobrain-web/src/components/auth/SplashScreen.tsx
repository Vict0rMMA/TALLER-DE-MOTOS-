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

const DURATION = 2800;

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

      {/* Speed lines — solo lado izquierdo (moto va hacia la derecha) */}
      <div className="splash-lines-panel" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="splash-line"
            style={
              {
                '--delay': `${i * 110}ms`,
                '--y': `${-40 + i * 16}px`,
                '--len': `${55 + (i % 3) * 20}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Motorcycle */}
      <div className="splash-moto-wrap" aria-hidden>
        <div className="splash-moto-glow" />
        <Image
          src="/images/moto-splash.png"
          alt=""
          width={480}
          height={280}
          className="splash-moto-img"
          priority
        />
      </div>

      {/* Dashed road */}
      <div className="splash-road" aria-hidden />

      {/* Logo */}
      <div className="splash-logo">
        <div className="splash-logo-icon">
          <Wrench className="h-5 w-5 text-emerald-400" strokeWidth={2.25} />
        </div>
        <span className="splash-logo-text">
          Moto<span className="splash-logo-accent">Brain</span>
        </span>
      </div>

      {/* Message */}
      <p className="splash-msg" key={msgIdx}>
        {MESSAGES[msgIdx]}
      </p>

      {/* Progress bar */}
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
  );
}
