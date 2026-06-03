import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { DatasetProvider, useDataset } from '../../context/DatasetContext'
import { LanguageProvider, useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../hooks/useTheme'
import { LoadingScreen } from '../ui/LoadingScreen'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

function LayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { dark, toggle } = useTheme()
  const { loading, error, retryLoad } = useDataset()
  const { t } = useLanguage()

  if (loading) return <LoadingScreen message={t('common.loadingDataset')} />
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-critical font-medium">{t('common.datasetError')}</p>
        <p className="text-sm text-slate-500">{t('common.datasetErrorHint')}</p>
        <button
          type="button"
          onClick={retryLoad}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
        >
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-surface dark:bg-dark-bg">
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} dark={dark} onToggleTheme={toggle} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <LanguageProvider>
      <DatasetProvider>
        <LayoutContent />
      </DatasetProvider>
    </LanguageProvider>
  )
}
