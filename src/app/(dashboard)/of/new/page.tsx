'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const ofSchema = z.object({
  ofCode: z.string().min(1, 'Code OF requis'),
  productId: z.string().min(1, 'Produit requis'),
  qtyCommandee: z.string().min(1, 'Quantité requise'),
  dateLancement: z.string().min(1, 'Date requise'),
})

type OFFormData = z.infer<typeof ofSchema>

export default function NewOFPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OFFormData>({
    resolver: zodResolver(ofSchema),
    defaultValues: {
      dateLancement: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(console.error)
  }, [])

  const onSubmit = async (data: OFFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/of', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          qtyCommandee: parseInt(data.qtyCommandee),
          dateLancement: new Date(data.dateLancement),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      router.push('/dashboard/of')
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
        <h1 className="text-3xl font-bold tracking-tight">Nouvel ordre de fabrication</h1>
        <p className="text-muted-foreground">Créer un nouvel OF</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;OF</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ofCode">
                Code OF <span className="text-destructive">*</span>
              </Label>
              <Input id="ofCode" {...register('ofCode')} placeholder="OF-2025-003" />
              {errors.ofCode && (
                <p className="text-sm text-destructive">{errors.ofCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productId">
                Produit fini <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="productId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qtyCommandee">
                  Quantité commandée <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="qtyCommandee"
                  type="number"
                  {...register('qtyCommandee')}
                  placeholder="5000"
                />
                {errors.qtyCommandee && (
                  <p className="text-sm text-destructive">{errors.qtyCommandee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateLancement">
                  Date de lancement <span className="text-destructive">*</span>
                </Label>
                <Input id="dateLancement" type="date" {...register('dateLancement')} />
                {errors.dateLancement && (
                  <p className="text-sm text-destructive">{errors.dateLancement.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Création...' : 'Créer l\'OF'}
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
