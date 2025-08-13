'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function CourseGrid() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

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

  const formatPrice = (price: number | null) => {
    if (price === null) return 'По запросу'
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const categories = ['all', ...new Set(courses.map(course => course.category))]

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(course => course.category === selectedCategory)

  const coursesByCategory = filteredCourses.reduce((acc, course) => {
    if (!acc[course.category]) {
      acc[course.category] = []
    }
    acc[course.category].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category)}
            size="sm"
          >
            {category === 'all' ? 'Все курсы' : category}
          </Button>
        ))}
      </div>

      {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-2xl font-bold">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryCourses.map(course => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant={course.format === 'онлайн' ? 'default' : 'secondary'}>
                      {course.format}
                    </Badge>
                  </div>
                  {course.description && (
                    <CardDescription className="line-clamp-3">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Преподаватель:</span>
                      <span className="font-medium">{course.instructor}</span>
                    </div>
                    {course.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Длительность:</span>
                        <span>{course.duration}</span>
                      </div>
                    )}
                    {course.modules && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Модули:</span>
                        <span>{course.modules}</span>
                      </div>
                    )}
                    {course.startDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Старт:</span>
                        <span>{course.startDate}</span>
                      </div>
                    )}
                    {course.certificateType && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Сертификат: {course.certificateType}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-xl font-bold">
                    {formatPrice(course.price)}
                  </span>
                  <Button asChild size="sm">
                    <a href={course.url} target="_blank" rel="noopener noreferrer">
                      Подробнее
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
