import { Wrench, Check } from 'lucide-react';
import { AuthColombiaBadge } from '@/components/auth/AuthColombiaBadge';

const POINTS = [
  'Inventario, servicios y clientes centralizados',
  'Diagnóstico asistido por IA',
  'Analítica e informes para tu taller',
] as const;

export function AuthMarketingPanel() {
  return (
    <div className="auth-marketing relative z-10 flex h-full flex-col justify-between px-10 py-12 xl:px-14 xl:py-16">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <Wrench className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">MotoBrain</span>
        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-px text-[10px] font-medium text-emerald-400">
          AI
        </span>
      </div>

      <div className="my-auto max-w-[340px] py-16">
        <h1 className="text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.03em] text-white xl:text-[2rem]">
          El sistema operativo
          <br />
          de tu{' '}
          <span className="text-emerald-400">taller de motos</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">
          Menos papeles, más control. Diseñado para talleres en Colombia.
        </p>

        <ul className="mt-10 space-y-3.5">
          {POINTS.map((text) => (
            <li key={text} className="flex items-start gap-3 text-[14px] text-zinc-400">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" strokeWidth={2} />
              <span className="leading-snug">{text}</span>
            </li>
          ))}
        </ul>

      </div>

      <AuthColombiaBadge />
    </div>
  );
}
