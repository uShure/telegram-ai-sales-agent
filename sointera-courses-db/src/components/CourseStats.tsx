'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function CourseStats() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      const data = await response.json()

      // Если база данных пустая, инициализируем её
      if (data.length === 0) {
        const initResponse = await fetch('/api/init', { method: 'POST' })
        if (initResponse.ok) {
          // После инициализации загружаем данные снова
          const newResponse = await fetch('/api/courses')
          const newData = await newResponse.json()
          setCourses(newData)
        }
      } else {
        setCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>
  }

  // Расчет статистики
  const totalCourses = courses.length
  const onlineCourses = courses.filter(c => c.format === 'онлайн').length
  const offlineCourses = courses.filter(c => c.format === 'офлайн').length
  const hybridCourses = courses.filter(c => c.format === 'гибрид').length

  const coursesWithPrice = courses.filter(c => c.price !== null)
  const avgPrice = coursesWithPrice.length > 0
    ? Math.round(coursesWithPrice.reduce((sum, c) => sum + (c.price || 0), 0) / coursesWithPrice.length)
    : 0

  const minPrice = Math.min(...coursesWithPrice.map(c => c.price || 0))
  const maxPrice = Math.max(...coursesWithPrice.map(c => c.price || 0))

  const coursesByCategory = courses.reduce((acc, course) => {
    acc[course.category] = (acc[course.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const coursesByInstructor = courses.reduce((acc, course) => {
    acc[course.instructor] = (acc[course.instructor] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCourses}</div>
          <p className="text-xs text-muted-foreground">
            активных программ обучения
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(avgPrice)}</div>
          <p className="text-xs text-muted-foreground">
            от {formatPrice(minPrice)} до {formatPrice(maxPrice)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Форматы обучения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Онлайн:</span>
              <span className="font-medium">{onlineCourses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Офлайн:</span>
              <span className="font-medium">{offlineCourses}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Гибрид:</span>
              <span className="font-medium">{hybridCourses}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Преподаватели</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(coursesByInstructor).map(([instructor, count]) => (
              <div key={instructor} className="flex justify-between text-sm">
                <span className="truncate">{instructor}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Распределение по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(coursesByCategory).map(([category, count]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(count / totalCourses) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
