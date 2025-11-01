'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const componentSchema = z.object({
  code: z.string().min(1, 'Code requis'),
  name: z.string().min(1, 'Nom requis'),
  uom: z.string().default('pièce'),
  coutStandard: z.string().min(1, 'Coût standard requis'),
  packColisage: z.string().optional(),
})

type ComponentFormData = z.infer<typeof componentSchema>

export default function NewComponentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      uom: 'pièce',
    },
  })

  const onSubmit = async (data: ComponentFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          coutStandard: parseFloat(data.coutStandard),
          packColisage: data.packColisage ? parseInt(data.packColisage) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      router.push('/dashboard/components')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nouveau composant</h1>
        <p className="text-muted-foreground">Créer un nouveau composant</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du composant</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Code composant <span className="text-destructive">*</span>
                </Label>
                <Input id="code" {...register('code')} placeholder="FLACON200" />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} placeholder="Flacon 200ml" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uom">Unité de mesure</Label>
                <Input id="uom" {...register('uom')} placeholder="pièce" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packColisage">Colisage (optionnel)</Label>
                <Input
                  id="packColisage"
                  type="number"
                  {...register('packColisage')}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coutStandard">
                Coût standard (TND) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coutStandard"
                type="number"
                step="0.001"
                {...register('coutStandard')}
                placeholder="0.280"
              />
              {errors.coutStandard && (
                <p className="text-sm text-destructive">{errors.coutStandard.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Le coût moyen pondéré sera calculé automatiquement lors des réceptions
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le composant'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
