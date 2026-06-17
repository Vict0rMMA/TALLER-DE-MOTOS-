'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Building2, Users, LogOut, Plus, Eye, EyeOff, Check, AlertCircle, Trash2, Pencil, Phone, MapPin, X, KeyRound, Copy, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  mechanic: 'Mecánico',
};

const newUserSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['mechanic', 'owner']),
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/15">
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

interface WorkshopUser { id: string; name: string; email: string; role: string; roleLabel: string; active: boolean; createdAt: string; }

const ROLE_COLORS: Record<string, string> = {
  owner: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  mechanic: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
};

const ROLE_AVATAR: Record<string, string> = {
  owner: 'bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 text-emerald-300 ring-emerald-500/30',
  mechanic: 'bg-gradient-to-br from-sky-400/30 to-indigo-500/10 text-sky-300 ring-sky-500/30',
};

function InviteCodeCard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['invite-code'],
    queryFn: () => api.get<{ inviteCode: string; workshopName: string }>('/auth/invite-code'),
    staleTime: 60_000,
  });

  const regenerate = useMutation({
    mutationFn: () => api.post<{ inviteCode: string }>('/auth/invite-code/regenerate', {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invite-code'] }); toast.success('Código regenerado'); },
    onError: (e) => toast.error('Error', { description: (e as Error).message }),
  });

  function copyCode() {
    if (!data?.inviteCode) return;
    navigator.clipboard.writeText(data.inviteCode);
    toast.success('Código copiado');
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-accent" />
        <p className="text-sm font-semibold text-text-primary">Código de invitación del taller</p>
      </div>
      <p className="text-xs text-text-tertiary">Comparte este código con mecánicos para que se registren en tu taller.</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-border bg-bg-elevated px-4 py-2 font-mono text-lg font-bold tracking-widest text-accent text-center">
          {isLoading ? '...' : (data?.inviteCode ?? '—')}
        </div>
        <button onClick={copyCode} title="Copiar" className="rounded-lg border border-border p-2 text-text-tertiary hover:text-accent hover:border-accent transition-colors">
          <Copy className="h-4 w-4" />
        </button>
        <button onClick={() => regenerate.mutate()} disabled={regenerate.isPending} title="Regenerar código" className="rounded-lg border border-border p-2 text-text-tertiary hover:text-accent hover:border-accent transition-colors disabled:opacity-50">
          <RefreshCcw className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-[11px] text-text-tertiary">El nuevo usuario va a <strong className="text-text-secondary">taller-mts.vercel.app/register</strong> → "Soy mecánico" e ingresa este código.</p>
    </div>
  );
}

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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/15">
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 text-accent ring-1 ring-accent/15">
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

      {/* Código de invitación */}
      <InviteCodeCard />

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
        <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border">
          {users.map((u) => (
            <div
              key={u.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 transition-colors',
                u.active ? 'hover:bg-bg-elevated' : 'opacity-55',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1',
                  ROLE_AVATAR[u.role] ?? 'bg-bg-elevated text-text-secondary ring-border',
                )}
              >
                {u.name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-text-primary">{u.name.trim()}</p>
                  {!u.active && (
                    <span className="shrink-0 rounded-full bg-bg-hover px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-text-tertiary">{u.email}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  ROLE_COLORS[u.role] ?? 'border-border text-text-secondary',
                )}
              >
                {u.roleLabel}
              </span>
              {u.role !== 'owner' && u.active && (
                <button
                  onClick={() => { if (confirm(`¿Desactivar a ${u.name.trim()}?`)) deactivate.mutate(u.id); }}
                  disabled={deactivate.isPending}
                  className="shrink-0 rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
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
      <UsersSection />
    </div>
  );
}
