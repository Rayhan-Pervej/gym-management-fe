import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCan } from '@/core/auth/store'
import { PageHeader, Segmented } from '@/shared/ui'
import { Pos } from '../components/Pos'
import { ProductsList } from '../components/ProductsList'
import { SalesList } from '../components/SalesList'
import { ShopReport } from '../components/ShopReport'

type Tab = 'sell' | 'sales' | 'products' | 'report'

export default function ShopPage() {
  const { t } = useTranslation()
  const canReport = useCan('reports.view')
  const [tab, setTab] = useState<Tab>('sell')
  const options: { value: Tab; label: string }[] = [
    { value: 'sell', label: t('shop.sell') },
    { value: 'sales', label: t('shop.sales') },
    { value: 'products', label: t('shop.products') },
    ...(canReport ? [{ value: 'report' as Tab, label: t('shop.report') }] : []),
  ]

  return (
    <>
      <PageHeader title={t('nav.shop')} />
      <div className="mb-4 overflow-x-auto"><Segmented value={tab} onChange={setTab} options={options} /></div>
      {tab === 'sell' && <Pos />}
      {tab === 'sales' && <SalesList />}
      {tab === 'products' && <ProductsList />}
      {tab === 'report' && canReport && <ShopReport />}
    </>
  )
}
