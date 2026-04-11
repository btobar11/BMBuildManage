import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useOnboardingSubmit } from '../../hooks/useOnboardingMutations';
import { inviteTeamSchema, type InviteTeamData } from '../../schemas/onboarding.schema';
import { useState } from 'react';
import { Loader2, AlertCircle, ChevronRight, ChevronLeft, Plus, Trash2, Users } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const ROLES = [
  { value: 'admin', label: 'Administrador', description: 'Acceso completo' },
  { value: 'manager', label: 'Gerente', description: 'Gestión de proyectos' },
  { value: 'viewer', label: 'Visualizador', description: 'Solo lectura' },
  { value: 'worker', label: 'Trabajador', description: 'Registro de trabajo' },
];

export function InviteTeamStep() {
  const { teamData, setTeamData, lastError, prevStep } = useOnboardingStore();
  const { submitStep, isLoading, error: submitError } = useOnboardingSubmit();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<InviteTeamData>({
    resolver: zodResolver(inviteTeamSchema),
    defaultValues: teamData || {
      invites: [{ email: '', role: 'viewer', name: '' }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invites',
  });

  const onSubmit = async (data: InviteTeamData) => {
    setTeamData(data);
    await submitStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Invita a tu Equipo</h2>
        <p className="text-sm text-muted-foreground">
          Agrega los miembros de tu equipo de trabajo
        </p>
      </div>

      {/* Error Display */}
      {(lastError || submitError) && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{lastError || (submitError as Error)?.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Team Members List */}
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="flex-1 space-y-3">
                {/* Name */}
                <div>
                  <input
                    {...register(`invites.${index}.name` as const)}
                    placeholder="Nombre completo"
                    className={cn(
                      'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                      errors.invites?.[index]?.name 
                        ? 'border-danger' : 'border-border',
                    )}
                  />
                  {errors.invites?.[index]?.name && (
                    <p className="text-xs text-danger">
                      {errors.invites[index]?.name?.message}
                    </p>
                  )}
                </div>

                {/* Email & Role Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      {...register(`invites.${index}.email` as const)}
                      type="email"
                      placeholder="correo@empresa.cl"
                      className={cn(
                        'w-full rounded-lg border bg-background px-3 py-2 text-sm',
                        errors.invites?.[index]?.email 
                          ? 'border-danger' : 'border-border',
                      )}
                    />
                    {errors.invites?.[index]?.email && (
                      <p className="text-xs text-danger">
                        {errors.invites[index]?.email?.message}
                      </p>
                    )}
                  </div>
                  
                  <select
                    {...register(`invites.${index}.role` as const)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remove Button */}
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="mt-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add More Button */}
        {fields.length < 20 && (
          <button
            type="button"
            onClick={() => append({ email: '', role: 'viewer', name: '' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Agregar miembro
          </button>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={prevStep}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 font-medium hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </button>
          
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all',
              'bg-primary text-white hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}