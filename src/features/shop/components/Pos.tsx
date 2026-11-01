import { Check, Minus, PackageX, Plus, Search, Share2, ShoppingCart, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ApiError } from '@/core/api/client'
import { useMembers } from '@/features/members/api/members'
import { METHODS, type Method } from '@/features/payments/api/payments'
import { METHOD_ICON } from '@/features/payments/components/methodIcons'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useFmt } from '@/shared/hooks/useFmt'
import { cn } from '@/shared/lib/cn'
import { errorMessage } from '@/shared/lib/errors'
import { shareLink } from '@/shared/lib/share'
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, IconButton, Input, ListSkeleton, Modal } from '@/shared/ui'
import { useCreateSale, useProducts, type Product, type Sale } from '../api/shop'

type Cart = Record<string, number>

function MemberPicker({ value, onChange }: { value: { id: string; name: string } | null; onChange: (m: { id: string; name: string } | null) => void }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const search = useDebounce(q, 250)
  const found = useMembers({ q: search }, search.length >= 2)
  if (value)
    return (
      <div className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
        {value.name}
        <IconButton label={t('common.cancel')} className="size-7" onClick={() => onChange(null)}><X className="size-4" /></IconButton>
      </div>
    )
  return (
    <div className="relative">
      <Input icon={<Search className="size-4" />} placeholder={t('shop.memberOptional')} value={q} onChange={(e) => setQ(e.target.value)} />
      {search.length >= 2 && found.data && (
        <div className="absolute inset-x-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
          {found.data.results.length === 0 && <p className="p-3 text-center text-sm text-muted">{t('members.empty')}</p>}
          {found.data.results.slice(0, 6).map((m) => (
            <button key={m.id} className="block w-full rounded-lg px-3 py-2 text-start text-sm hover:bg-surface-2" onClick={() => { onChange({ id: m.id, name: m.name }); setQ('') }}>
              {m.name} <span className="text-xs text-muted">{m.member_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Done({ sale, onNew }: { sale: Sale; onNew: () => void }) {
  const { t } = useTranslation()
  const { money } = useFmt()
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success"><Check className="size-7" /></span>
      <p className="text-2xl font-extrabold">{money(sale.total_minor)}</p>
      <p className="text-sm text-muted">{t('shop.saleDone')}</p>
      <div className="flex w-full gap-2 pt-2">
        <Button variant="outline" className="flex-1" icon={<Share2 className="size-4" />} onClick={() => shareLink(sale.receipt_url)}>{t('payments.shareReceipt')}</Button>
        <Button className="flex-1" onClick={onNew}>{t('shop.newSale')}</Button>
      </div>
    </div>
  )
}

type PanelProps = { lines: { product: Product; qty: number }[]; total: number; setQty: (id: string, qty: number) => void; onSold: () => void; done: Sale | null; setDone: (s: Sale | null) => void }

function CartPanel({ lines, total, setQty, onSold, done, setDone }: PanelProps) {
  const { t } = useTranslation()
  const { money } = useFmt()
  const create = useCreateSale()
  const [method, setMethod] = useState<Method>('cash')
  const [ref, setRef] = useState('')
  const [member, setMember] = useState<{ id: string; name: string } | null>(null)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())

  const charge = () =>
    create.mutate(
      { items: lines.map((l) => ({ product_id: l.product.id, quantity: l.qty })), method, member_id: member?.id, transaction_ref: ref.trim() || undefined, client_request_id: requestId },
      {
        onSuccess: (sale) => { setDone(sale); setRequestId(crypto.randomUUID()); setRef(''); setMember(null); onSold() },
        onError: (e) =>
          toast.error(e instanceof ApiError && e.code === 'insufficient_stock' ? t('errors.insufficient_stock', { name: String(e.details.name ?? ''), available: String(e.details.available ?? 0) }) : errorMessage(e)),
      },
    )

  if (done) return <Done sale={done} onNew={() => setDone(null)} />

  return (
    <div className="space-y-4">
      {lines.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={t('shop.cartEmpty')} hint={t('shop.cartEmptyHint')} />
      ) : (
        <div className="divide-y divide-border">
          {lines.map(({ product: p, qty }) => (
            <div key={p.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted">{money(p.price_minor)} × {qty} = {money(p.price_minor * qty)}</p>
              </div>
              <IconButton label="−" className="size-8" onClick={() => setQty(p.id, qty - 1)}><Minus className="size-4" /></IconButton>
              <span className="w-6 text-center text-sm font-bold">{qty}</span>
              <IconButton label="+" className="size-8" disabled={p.track_stock && qty >= p.stock_qty} onClick={() => setQty(p.id, qty + 1)}><Plus className="size-4" /></IconButton>
              <IconButton label={t('common.cancel')} className="size-8" onClick={() => setQty(p.id, 0)}><Trash2 className="size-4" /></IconButton>
            </div>
          ))}
        </div>
      )}

      {lines.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => {
              const Icon = METHOD_ICON[m]
              return (
                <button key={m} type="button" onClick={() => setMethod(m)} className={cn('flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition', method === m ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted hover:bg-surface-2')}>
                  <Icon className="size-4" />
                  {t(`methods.${m}`)}
                </button>
              )
            })}
          </div>
          {method !== 'cash' && <Input label={t('payments.txRef')} maxLength={64} value={ref} onChange={(e) => setRef(e.target.value)} />}
          <MemberPicker value={member} onChange={setMember} />
          <Button size="lg" className="w-full" loading={create.isPending} onClick={charge}>{t('shop.charge', { amount: money(total) })}</Button>
        </>
      )}
    </div>
  )
}

function Tile({ p, qty, onAdd }: { p: Product; qty: number; onAdd: () => void }) {
  const { t } = useTranslation()
  const { money } = useFmt()
  const out = p.track_stock && p.stock_qty - qty <= 0
  return (
    <button disabled={out} onClick={onAdd} className={cn('relative flex flex-col items-start rounded-2xl border border-border bg-surface p-3 text-start transition active:scale-[0.98]', out ? 'opacity-50' : 'hover:border-primary hover:shadow-card')}>
      {qty > 0 && <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-fg">{qty}</span>}
      <span className="line-clamp-2 min-h-10 pe-6 text-sm font-semibold">{p.name}</span>
      <span className="mt-1 text-lg font-extrabold">{money(p.price_minor)}</span>
      {p.track_stock && (p.stock_qty <= 0 ? <Badge tone="danger" className="mt-1"><PackageX className="size-3" />{t('shop.outOfStock')}</Badge> : <span className={cn('mt-1 text-xs', p.low_stock ? 'font-semibold text-warning' : 'text-muted')}>{t('shop.inStock', { count: p.stock_qty })}</span>)}
    </button>
  )
}

export function Pos() {
  const { t } = useTranslation()
  const { money } = useFmt()
  const [q, setQ] = useState('')
  const search = useDebounce(q, 250)
  const products = useProducts({ q: search || undefined, active: true, page_size: 100 })
  const [cart, setCart] = useState<Cart>({})
  const [done, setDone] = useState<Sale | null>(null)
  const [open, setOpen] = useState(false)
  const items = products.data?.results ?? []

  const known = new Map(items.map((p) => [p.id, p]))
  const [remembered, setRemembered] = useState<Record<string, Product>>({})
  const lines = Object.entries(cart).flatMap(([id, qty]) => {
    const product = known.get(id) ?? remembered[id]
    return product ? [{ product, qty }] : []
  })
  const total = lines.reduce((s, l) => s + l.product.price_minor * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  const setQty = (id: string, qty: number) =>
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })

  const add = (p: Product) => {
    setRemembered((r) => ({ ...r, [p.id]: p }))
    setDone(null)
    setQty(p.id, (cart[p.id] ?? 0) + 1)
  }

  const panel = <CartPanel lines={lines} total={total} setQty={setQty} done={done} setDone={setDone} onSold={() => setCart({})} />

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Input icon={<Search className="size-4" />} placeholder={t('shop.searchProducts')} value={q} onChange={(e) => setQ(e.target.value)} />
        {products.isLoading ? <Card><ListSkeleton rows={4} /></Card> : products.isError ? <ErrorState onRetry={() => products.refetch()} /> : items.length === 0 ? (
          <Card><EmptyState icon={ShoppingCart} title={t('shop.noProducts')} hint={t('shop.noProductsHint')} /></Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{items.map((p) => <Tile key={p.id} p={p} qty={cart[p.id] ?? 0} onAdd={() => add(p)} />)}</div>
        )}
      </div>

      <Card className="sticky top-20 hidden lg:block"><CardBody>{panel}</CardBody></Card>

      {(count > 0 || done) && (
        <div className="pb-safe fixed inset-x-0 bottom-16 z-30 px-4 lg:hidden">
          <Button size="lg" className="w-full shadow-xl" icon={<ShoppingCart className="size-5" />} onClick={() => setOpen(true)}>
            {done ? t('shop.saleDone') : t('shop.viewCart', { count, amount: money(total) })}
          </Button>
        </div>
      )}
      {open && <Modal open onClose={() => setOpen(false)} title={t('shop.cart')}>{panel}</Modal>}
    </div>
  )
}
