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

const productSchema = z.object({
  code: z.string().min(1, 'Code requis'),
  name: z.string().min(1, 'Nom requis'),
  uom: z.string().default('pièce'),
  coutSousTraitanceUnite: z.string().min(1, 'Coût requis'),
  coutAutresUnite: z.string().default('0'),
})

type ProductFormData = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      uom: 'pièce',
      coutAutresUnite: '0',
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          coutSousTraitanceUnite: parseFloat(data.coutSousTraitanceUnite),
          coutAutresUnite: parseFloat(data.coutAutresUnite),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      router.push('/dashboard/products')
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
        <h1 className="text-3xl font-bold tracking-tight">Nouveau produit fini</h1>
        <p className="text-muted-foreground">Créer un nouveau produit fini</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
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
                  Code produit <span className="text-destructive">*</span>
                </Label>
                <Input id="code" {...register('code')} placeholder="BICAR200" />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register('name')} placeholder="BICAR 200ml" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom">Unité de mesure</Label>
              <Input id="uom" {...register('uom')} placeholder="pièce" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coutSousTraitanceUnite">
                  Coût sous-traitance unitaire (TND) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="coutSousTraitanceUnite"
                  type="number"
                  step="0.001"
                  {...register('coutSousTraitanceUnite')}
                  placeholder="0.250"
                />
                {errors.coutSousTraitanceUnite && (
                  <p className="text-sm text-destructive">
                    {errors.coutSousTraitanceUnite.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coutAutresUnite">Coût autres unitaire (TND)</Label>
                <Input
                  id="coutAutresUnite"
                  type="number"
                  step="0.001"
                  {...register('coutAutresUnite')}
                  placeholder="0.000"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer le produit'}
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
