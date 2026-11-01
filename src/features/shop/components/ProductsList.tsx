import { Boxes, Package, Pencil, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCan } from '@/core/auth/store'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useFmt } from '@/shared/hooks/useFmt'
import { applyFieldErrors, errorMessage } from '@/shared/lib/errors'
import { toMajor, toMinor } from '@/shared/lib/format'
import { Badge, Button, Card, Chips, EmptyState, ErrorState, IconButton, Input, ListSkeleton, Modal, Segmented } from '@/shared/ui'
import { useAdjustStock, useProducts, useSaveProduct, type Product } from '../api/shop'

function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSaveProduct(product?.id)
  const [f, setF] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    price: product ? String(toMajor(product.price_minor)) : '',
    cost: product?.cost_minor != null ? String(toMajor(product.cost_minor)) : '',
    threshold: String(product?.low_stock_threshold ?? 5),
    initial: '0',
  })
  const [track, setTrack] = useState(product?.track_stock ?? true)
  const [active, setActive] = useState(product?.is_active ?? true)
  const [err, setErr] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = () =>
    save.mutate(
      {
        name: f.name.trim(),
        sku: f.sku.trim(),
        price_minor: toMinor(f.price),
        cost_minor: f.cost === '' ? null : toMinor(f.cost),
        low_stock_threshold: Number(f.threshold),
        ...(product ? { is_active: active } : { track_stock: track, ...(track ? { initial_stock: Number(f.initial) } : {}) }),
      },
      {
        onSuccess: () => { toast.success(t('common.saved')); onClose() },
        onError: (e) => applyFieldErrors(e, ((k: string, v: { message?: string }) => setErr((p) => ({ ...p, [k]: v.message ?? '' }))) as never) || toast.error(errorMessage(e)),
      },
    )

  return (
    <Modal open onClose={onClose} title={product ? t('shop.editProduct') : t('shop.addProduct')}>
      <div className="space-y-4">
        <Input label={t('shop.productName')} value={f.name} onChange={set('name')} error={err.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('shop.price')} type="number" min={0} step="0.01" value={f.price} onChange={set('price')} error={err.price_minor} hint={t('shop.priceHint')} />
          <Input label={t('shop.cost')} type="number" min={0} step="0.01" value={f.cost} onChange={set('cost')} hint={t('shop.costHint')} />
        </div>
        <Input label="SKU" value={f.sku} onChange={set('sku')} error={err.sku} />
        {!product && (
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            {t('shop.trackStock')}
            <input type="checkbox" role="switch" checked={track} onChange={(e) => setTrack(e.target.checked)} className="size-5 accent-[var(--primary)]" />
          </label>
        )}
        {(product ? product.track_stock : track) && (
          <div className="grid grid-cols-2 gap-3">
            {!product && <Input label={t('shop.openingStock')} type="number" min={0} value={f.initial} onChange={set('initial')} />}
            <Input label={t('shop.lowThreshold')} type="number" min={0} value={f.threshold} onChange={set('threshold')} />
          </div>
        )}
        {product && (
          <label className="flex items-center justify-between gap-3 text-sm font-medium">
            {t('common.active')}
            <input type="checkbox" role="switch" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-[var(--primary)]" />
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={f.name.trim().length < 2 || !(Number(f.price) > 0)} loading={save.isPending} onClick={submit}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

function StockModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t } = useTranslation()
  const adjust = useAdjustStock(product.id)
  const [mode, setMode] = useState<'restock' | 'adjustment'>('restock')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const n = Number(qty)

  const go = () =>
    adjust.mutate(
      { delta: mode === 'restock' ? Math.abs(n) : n, reason: mode, note: note.trim() || undefined },
      { onSuccess: () => { toast.success(t('common.saved')); onClose() }, onError: (e) => toast.error(errorMessage(e)) },
    )

  return (
    <Modal open onClose={onClose} title={t('shop.stock')} description={`${product.name} · ${t('shop.inStock', { count: product.stock_qty })}`}>
      <div className="space-y-4">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'restock', label: t('shop.restock') }, { value: 'adjustment', label: t('shop.correction') }]} />
        <Input label={mode === 'restock' ? t('shop.addUnits') : t('shop.changeBy')} type="number" step="1" value={qty} onChange={(e) => setQty(e.target.value)} hint={mode === 'adjustment' ? t('shop.changeByHint') : undefined} />
        {mode === 'adjustment' && <Input label={t('shop.correctionNote')} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!Number.isInteger(n) || n === 0 || (mode === 'adjustment' && note.trim().length < 2)} loading={adjust.isPending} onClick={go}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function ProductsList() {
  const { t } = useTranslation()
  const { money } = useFmt()
  const canManage = useCan('shop.manage')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'active' | 'low' | 'retired'>('active')
  const search = useDebounce(q, 300)
  const list = useProducts({ q: search || undefined, active: filter === 'retired' ? false : filter === 'active' ? true : undefined, low_stock: filter === 'low' ? true : undefined, page_size: 100 })
  const [editing, setEditing] = useState<Product | 'new'>()
  const [stocking, setStocking] = useState<Product>()
  const items = list.data?.results ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-48 flex-1"><Input icon={<Search className="size-4" />} placeholder={t('shop.searchProducts')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {canManage && <Button icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>{t('shop.addProduct')}</Button>}
      </div>
      <Chips value={filter} onChange={setFilter} options={[{ value: 'active', label: t('common.active') }, { value: 'low', label: t('shop.lowStock') }, { value: 'retired', label: t('shop.retired') }]} />
      <Card className="overflow-hidden">
        {list.isLoading ? <ListSkeleton /> : list.isError ? <ErrorState onRetry={() => list.refetch()} /> : items.length === 0 ? (
          <EmptyState icon={Package} title={t('shop.noProducts')} hint={canManage ? t('shop.noProductsOwner') : undefined} />
        ) : (
          <div className="divide-y divide-border">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Package className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted">{money(p.price_minor)}{p.cost_minor != null && ` · ${t('shop.cost')} ${money(p.cost_minor)}`}{p.sku && ` · ${p.sku}`}</p>
                </div>
                {p.track_stock ? <Badge tone={p.stock_qty <= 0 ? 'danger' : p.low_stock ? 'warning' : 'neutral'}>{t('shop.inStock', { count: p.stock_qty })}</Badge> : <Badge>{t('shop.noStockTracking')}</Badge>}
                {canManage && (
                  <>
                    {p.track_stock && <IconButton label={t('shop.stock')} onClick={() => setStocking(p)}><Boxes className="size-4" /></IconButton>}
                    <IconButton label={t('common.edit')} onClick={() => setEditing(p)}><Pencil className="size-4" /></IconButton>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      {editing && <ProductModal product={editing === 'new' ? undefined : editing} onClose={() => setEditing(undefined)} />}
      {stocking && <StockModal product={stocking} onClose={() => setStocking(undefined)} />}
    </div>
  )
}
