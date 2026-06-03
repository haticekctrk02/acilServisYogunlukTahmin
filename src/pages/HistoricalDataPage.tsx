import { Database } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDataset } from '../context/DatasetContext'
import { useLanguage } from '../context/LanguageContext'
import { Card } from '../components/ui/Card'
import { CrowdBadge } from '../components/ui/CrowdBadge'
import { EmptyState } from '../components/ui/EmptyState'
import type { CrowdLevel, HistoricalRecord } from '../types'

const PAGE_SIZE = 10
const riskLevels: CrowdLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export function HistoricalDataPage() {
  const { historicalRecords, formatDate, formatTime } = useDataset()
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<CrowdLevel | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<keyof HistoricalRecord>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let rows = [...historicalRecords]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.date.includes(q) ||
          r.time.includes(q) ||
          String(r.predictedCount).includes(q)
      )
    }
    if (riskFilter !== 'ALL') rows = rows.filter((r) => r.riskLevel === riskFilter)
    rows.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return rows
  }, [historicalRecords, search, riskFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (key: keyof HistoricalRecord) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const columns: [keyof HistoricalRecord, string][] = [
    ['date', 'historical.colDate'],
    ['time', 'historical.colTime'],
    ['predictedCount', 'historical.colPredicted'],
    ['actualCount', 'historical.colActual'],
    ['accuracy', 'historical.colAccuracy'],
    ['riskLevel', 'historical.colRisk'],
    ['waitingTime', 'historical.colWait'],
  ]

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-ink dark:text-white">{t('historical.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('historical.subtitle', { count: historicalRecords.length })}
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="search"
            placeholder={t('historical.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value as CrowdLevel | 'ALL')
              setPage(1)
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="ALL">{t('common.allRiskLevels')}</option>
            {riskLevels.map((level) => (
              <option key={level} value={level}>
                {t(`crowd.${level}`)}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Database}
            title={t('historical.emptyTitle')}
            description={t('historical.emptyDesc')}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    {columns.map(([key, labelKey]) => (
                      <th key={key} className="text-left p-3 font-semibold">
                        <button type="button" onClick={() => toggleSort(key)} className="hover:text-primary">
                          {t(labelKey as Parameters<typeof t>[0])} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">{formatDate(row.date)}</td>
                      <td className="p-3">{formatTime(row.date, row.time)}</td>
                      <td className="p-3 font-medium">{row.predictedCount}</td>
                      <td className="p-3">{row.actualCount}</td>
                      <td className="p-3">
                        <span className={row.accuracy >= 90 ? 'text-success font-medium' : ''}>{row.accuracy}%</span>
                      </td>
                      <td className="p-3">
                        <CrowdBadge level={row.riskLevel} />
                      </td>
                      <td className="p-3">{row.waitingTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm">
              <p className="text-slate-500">
                {t('historical.showing', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, filtered.length),
                  total: filtered.length,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t('common.previous')}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
