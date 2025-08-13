'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  title: string
  description: string | null
  price: number | null
  currency: string
  duration: string | null
  format: string
  instructor: string
  category: string
  url: string
  startDate: string | null
  modules: number | null
  certificateType: string | null
  additionalInfo: string | null
}

export function ExportButton() {
  const [loading, setLoading] = useState(false)

  const exportToCSV = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/courses')
      const courses: Course[] = await response.json()

      // Подготовка заголовков CSV
      const headers = [
        'Название',
        'Описание',
        'Цена',
        'Формат',
        'Преподаватель',
        'Категория',
        'Длительность',
        'Модули',
        'Дата начала',
        'Сертификат',
        'Дополнительная информация',
        'Ссылка'
      ]

      // Преобразование данных в CSV формат
      const csvContent = [
        headers.join(';'),
        ...courses.map(course => [
          course.title,
          course.description || '',
          course.price || 'По запросу',
          course.format,
          course.instructor,
          course.category,
          course.duration || '',
          course.modules || '',
          course.startDate || '',
          course.certificateType || '',
          course.additionalInfo || '',
          course.url
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      ].join('\n')

      // Создание и загрузка файла
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `sointera-courses-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Ошибка при экспорте данных')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={exportToCSV}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? 'Экспорт...' : 'Экспорт в CSV'}
    </Button>
  )
}
