'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

export function CourseTable() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterFormat, setFilterFormat] = useState('all')

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

  const initDatabase = async () => {
    try {
      const response = await fetch('/api/init', { method: 'POST' })
      const data = await response.json()
      alert(`База данных инициализирована: добавлено ${data.count} курсов`)
      fetchCourses()
    } catch (error) {
      console.error('Error initializing database:', error)
      alert('Ошибка при инициализации базы данных')
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

  const formatBadgeVariant = (format: string) => {
    switch (format) {
      case 'онлайн':
        return 'default'
      case 'офлайн':
        return 'secondary'
      case 'гибрид':
        return 'outline'
      default:
        return 'default'
    }
  }

  const categories = ['all', ...new Set(courses.map(course => course.category))]
  const formats = ['all', ...new Set(courses.map(course => course.format))]

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || course.category === filterCategory
    const matchesFormat = filterFormat === 'all' || course.format === filterFormat
    return matchesSearch && matchesCategory && matchesFormat
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Поиск</label>
          <Input
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <label className="text-sm font-medium">Категория</label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.slice(1).map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <label className="text-sm font-medium">Формат</label>
          <Select value={filterFormat} onValueChange={setFilterFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все форматы</SelectItem>
              {formats.slice(1).map(format => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {courses.length === 0 && (
          <Button onClick={initDatabase}>
            Загрузить данные
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>
            Найдено курсов: {filteredCourses.length}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Формат</TableHead>
              <TableHead>Преподаватель</TableHead>
              <TableHead>Длительность</TableHead>
              <TableHead className="text-right">Цена</TableHead>
              <TableHead>Ссылка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{course.title}</div>
                    {course.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{course.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={formatBadgeVariant(course.format)}>
                    {course.format}
                  </Badge>
                </TableCell>
                <TableCell>{course.instructor}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {course.duration && <div>{course.duration}</div>}
                    {course.modules && <div>{course.modules} модулей</div>}
                    {course.startDate && <div>Старт: {course.startDate}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(course.price)}
                </TableCell>
                <TableCell>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Открыть
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
