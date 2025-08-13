'use client'

import { useState } from 'react'
import { CourseTable } from '@/components/CourseTable'
import { CourseGrid } from '@/components/CourseGrid'
import { CourseStats } from '@/components/CourseStats'
import { ExportButton } from '@/components/ExportButton'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [view, setView] = useState<'stats' | 'table' | 'grid'>('stats')

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            База данных курсов SOINTERA
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Полная информация о курсах и программах обучения от Елены Алексеюк -
            эксперта в парикмахерском искусстве с 20-летним опытом
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="inline-flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={view === 'stats' ? 'default' : 'ghost'}
              onClick={() => setView('stats')}
              size="sm"
            >
              Статистика
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              onClick={() => setView('table')}
              size="sm"
            >
              Таблица
            </Button>
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              onClick={() => setView('grid')}
              size="sm"
            >
              Карточки
            </Button>
          </div>
          <ExportButton />
        </div>

        {view === 'stats' && <CourseStats />}
        {view === 'table' && <CourseTable />}
        {view === 'grid' && <CourseGrid />}
      </div>
    </div>
  )
}
