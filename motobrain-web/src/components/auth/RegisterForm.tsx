'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { registerSchema, type RegisterInput } from '@/validators/auth.schema';
import { useRegister } from '@/hooks/use-auth';

export function RegisterForm() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onNext = async () => {
    const valid = await trigger(['name', 'email', 'password', 'confirmPassword']);
    if (valid) setStep(2);
  };

  return (
    <Card className="glass-card w-full max-w-md border-border/60 max-h-[min(90dvh,800px)] overflow-y-auto">
      <CardHeader className="items-center text-center space-y-4">
        <BrandLogo className="justify-center" />
        <div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>
            {step === 1 ? 'Datos de acceso' : 'Datos del taller'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
          className="space-y-4"
        >
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-danger">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {errors.confirmPassword && (
                  <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button type="button" className="w-full" onClick={onNext}>
                Siguiente
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="workshopName">Nombre del taller</Label>
                <Input id="workshopName" {...register('workshopName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshopNit">NIT (opcional)</Label>
                <Input
                  id="workshopNit"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="900123456-1"
                  {...register('workshopNit')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workshopPhone">Teléfono del taller</Label>
                <Input
                  id="workshopPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="3001234567"
                  {...register('workshopPhone')}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent hover:text-accent-hover">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
