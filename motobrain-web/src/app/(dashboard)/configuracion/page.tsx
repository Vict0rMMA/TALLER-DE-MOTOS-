'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2, Users, LogOut, Plus, Eye, EyeOff, Check, AlertCircle, MessageCircle, Wifi, WifiOff, RefreshCw, RotateCcw, Trash2, Pencil, Phone, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import { useWhatsAppStatus, restartWhatsAppClient } from '@/hooks/use-notifications';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  mechanic: 'Mecánico',
  seller: 'Vendedor',
};

const newUserSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['mechanic', 'seller', 'owner']),
});
type NewUserInput = z.infer<typeof newUserSchema>;

function ProfileSection() {
  const { user } = useAuthStore();

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <User className="h-4.5 w-4.5" />
        </div>
        <h2 className="font-semibold text-text-primary">Mi perfil</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-text-tertiary mb-1">Nombre</p>
          <p className="text-sm font-medium text-text-primary">{user?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">Email</p>
          <p className="text-sm font-medium text-text-primary">{user?.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">Rol</p>
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
          </span>
        </div>
        <div>
          <p className="text-xs text-text-tertiary mb-1">ID de usuario</p>
          <p className="text-xs font-mono text-text-tertiary truncate">{user?.id ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}

interface WorkshopInfo { id: string; name: string; phone?: string; address?: string; plan: string; }

function WorkshopSection() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const { data: ws, isLoading } = useQuery({
    queryKey: ['workshop'],
    queryFn: () => api.get<WorkshopInfo>('/auth/workshop'),
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: (data: typeof form) => api.put('/auth/workshop', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workshop'] });
      toast.success('Taller actualizado');
      setEditing(false);
    },
    onError: (e) => toast.error('Error al guardar', { description: (e as Error).message }),
  });

  function startEdit() {
    setForm({ name: ws?.name ?? '', phone: ws?.phone ?? '', address: ws?.address ?? '' });
    setEditing(true);
  }

  const isOwner = user?.role === 'owner';

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <h2 className="font-semibold text-text-primary">Mi taller</h2>
        </div>
        {isOwner && !editing && ws && (
          <button onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded bg-bg-elevated" />)}
        </div>
      ) : editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-tertiary mb-1.5">Nombre del taller *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-text-tertiary mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="3001234567"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-text-tertiary mb-1.5">Dirección</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Calle 12 #34-56, Medellín"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated transition-colors">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button onClick={() => save.mutate(form)} disabled={save.isPending || !form.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity">
              {save.isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" /> : <Check className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Nombre</p>
              <p className="text-sm font-medium text-text-primary">{ws?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-tertiary mb-0.5">Plan</p>
              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent capitalize">{ws?.plan ?? '—'}</span>
            </div>
            {ws?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary">{ws.phone}</p>
              </div>
            )}
            {ws?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                <p className="text-sm text-text-secondary">{ws.address}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-0.5">ID del taller</p>
            <p className="text-xs font-mono text-text-tertiary">{user?.workshopId ?? '—'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserForm({ workshopId, onSuccess }: { workshopId: string; onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewUserInput>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { role: 'mechanic' },
  });

  const onSubmit = async (data: NewUserInput) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.post('/auth/register', { ...data, workshopId });
      setStatus('success');
      reset();
      setTimeout(() => { setStatus('idle'); onSuccess(); }, 1500);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message ?? 'Error al crear usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-text-tertiary mb-1.5">Nombre completo *</label>
          <input
            {...register('name')}
            placeholder="Ej. Carlos Mecánico"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1.5">Email *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="usuario@taller.com"
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1.5">Contraseña *</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1.5">Rol *</label>
          <select
            {...register('role')}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none appearance-none"
          >
            <option value="mechanic">Mecánico</option>
            <option value="seller">Vendedor</option>
            <option value="owner">Propietario</option>
          </select>
        </div>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-sm text-success">
          <Check className="h-4 w-4 flex-shrink-0" />
          Usuario creado correctamente
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg-primary hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {status === 'loading' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Crear usuario
        </button>
      </div>
    </form>
  );
}

function WhatsAppSection() {
  const { data, isLoading, refetch, isFetching } = useWhatsAppStatus({ poll: true, pollMs: 5_000 });
  const [restarting, setRestarting] = useState(false);

  async function handleRestart(deleteSession: boolean) {
    setRestarting(true);
    try {
      await restartWhatsAppClient(deleteSession);
      setTimeout(() => refetch(), 3_000);
    } catch {
    } finally {
      setTimeout(() => setRestarting(false), 3_000);
    }
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <MessageCircle className="h-4.5 w-4.5" />
          </div>
          <h2 className="font-semibold text-text-primary">WhatsApp</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching || restarting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {!data?.isReady && (
            <button
              onClick={() => handleRestart(false)}
              disabled={restarting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50"
              title="Reinicia el cliente sin borrar la sesión"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${restarting ? 'animate-spin' : ''}`} />
              Reiniciar
            </button>
          )}
        </div>
      </div>

      {restarting && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
          <RotateCcw className="h-4 w-4 animate-spin text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-400">Reiniciando cliente WhatsApp… espera unos segundos y aparecerá el QR.</p>
        </div>
      )}

      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-bg-elevated" />
      ) : data?.enabled === false ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-bg-elevated px-4 py-3">
          <WifiOff className="h-5 w-5 text-text-tertiary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-secondary">WhatsApp no disponible en este servidor</p>
            <p className="text-xs text-text-tertiary mt-1">
              El bot de WhatsApp requiere un servidor local con Chrome instalado.
              En producción (Vercel) esta función está desactivada.
            </p>
          </div>
        </div>
      ) : data?.isReady ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
            <Wifi className="h-5 w-5 text-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-success">Conectado y activo</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Los mensajes se envían automáticamente a clientes con opt-in activado.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleRestart(true)}
            disabled={restarting}
            className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-danger transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Desvincular y escanear de nuevo
          </button>
        </div>
      ) : data?.hasQr && data.qr ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <WifiOff className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">Escanea el código QR para vincular</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                El QR se renueva automáticamente cada ~20 segundos.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <img src={data.qr} alt="WhatsApp QR" width={256} height={256} className="block" />
            </div>
            <ol className="space-y-2 text-sm text-text-secondary max-w-xs">
              <li className="flex gap-2.5"><span className="font-bold text-accent min-w-[16px]">1.</span> Abre WhatsApp en tu teléfono</li>
              <li className="flex gap-2.5"><span className="font-bold text-accent min-w-[16px]">2.</span> Ve a <span className="font-medium text-text-primary mx-1">Dispositivos vinculados</span> (menú ⋮ o Configuración)</li>
              <li className="flex gap-2.5"><span className="font-bold text-accent min-w-[16px]">3.</span> Toca <span className="font-medium text-text-primary mx-1">Vincular un dispositivo</span> y escanea el QR</li>
            </ol>
            <button
              onClick={() => handleRestart(true)}
              disabled={restarting}
              className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-danger transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Borrar sesión y generar QR nuevo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <WifiOff className="h-5 w-5 text-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">No conectado — generando QR…</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Asegúrate de que el backend esté corriendo. El QR aparecerá en unos segundos.
              </p>
            </div>
          </div>
          {data?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-danger">Error de conexión</p>
                <p className="text-xs text-text-tertiary mt-0.5 font-mono">{data.error}</p>
                <button
                  onClick={() => handleRestart(true)}
                  disabled={restarting}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-danger hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reiniciar y borrar sesión
                </button>
              </div>
            </div>
          )}
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-warning/40" />
          </div>
        </div>
      )}
    </div>
  );
}

interface WorkshopUser { id: string; name: string; email: string; role: string; roleLabel: string; active: boolean; createdAt: string; }

const ROLE_COLORS: Record<string, string> = {
  owner: 'border-accent/30 bg-accent/10 text-accent',
  mechanic: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  seller: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
};

function UsersSection() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['workshop-users'],
    queryFn: () => api.get<WorkshopUser[]>('/auth/users'),
    enabled: user?.role === 'owner',
    staleTime: 30_000,
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/users/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['workshop-users'] });
      toast.success('Usuario desactivado');
    },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  if (user?.role !== 'owner') {
    return (
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Users className="h-4.5 w-4.5" />
          </div>
          <h2 className="font-semibold text-text-primary">Equipo del taller</h2>
        </div>
        <p className="text-sm text-text-tertiary">Solo los propietarios pueden gestionar el equipo.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Users className="h-4.5 w-4.5" />
          </div>
          <h2 className="font-semibold text-text-primary">Equipo del taller</h2>
          {users.length > 0 && (
            <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">{users.length}</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Cancelar' : 'Agregar usuario'}
        </button>
      </div>

      {showForm && (
        <AddUserForm workshopId={user.workshopId} onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['workshop-users'] }); }} />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-bg-elevated" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Users className="h-8 w-8 text-text-tertiary/40 mb-2" />
          <p className="text-sm text-text-tertiary">Aún no hay usuarios en el taller</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-xs text-accent hover:underline">Agregar el primero →</button>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 bg-bg-secondary hover:bg-bg-elevated transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                <p className="text-xs text-text-tertiary truncate">{u.email}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[u.role] ?? 'border-border text-text-secondary'}`}>
                {u.roleLabel}
              </span>
              {u.role !== 'owner' && (
                <button
                  onClick={() => { if (confirm(`¿Desactivar a ${u.name}?`)) deactivate.mutate(u.id); }}
                  disabled={deactivate.isPending}
                  className="shrink-0 rounded-lg p-1.5 text-text-tertiary hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
                  title="Desactivar usuario"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Perfil, taller y usuarios"
        actions={
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        }
      />

      <ProfileSection />
      <WorkshopSection />
      <WhatsAppSection />
      <UsersSection />
    </div>
  );
}
