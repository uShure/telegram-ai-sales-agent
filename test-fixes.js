#!/usr/bin/env bun

import { getCourseDates } from './src/data/course-dates.ts';
import { findFAQAnswer } from './src/data/faq-creative-village.ts';
import { getDetailedCoursePresentation } from './src/data/detailed-presentations.ts';
import { getShortCoursePresentation } from './src/data/qualification-logic.ts';

console.log('🧪 ПРОВЕРКА ИСПРАВЛЕНИЙ');
console.log('=' .repeat(60));

// 1. Проверка количества человек в группе (должно быть 15)
console.log('\n📋 1. Количество человек в группе:');
const faqAnswer = findFAQAnswer('сколько человек в группе');
if (faqAnswer && faqAnswer.includes('15')) {
  console.log('✅ FAQ: Упоминает 15 человек');
} else {
  console.log('❌ FAQ: НЕ упоминает 15 человек');
}

// 2. Проверка дат для очного курса (НЕ должно быть онлайн дат)
console.log('\n📅 2. Даты для очного курса Фундамент:');
const offlineDates = getCourseDates('Стрижки: Фундамент очный');
console.log(offlineDates.substring(0, 200));
if (offlineDates.includes('онлайн') || offlineDates.includes('4 августа')) {
  console.log('❌ Проблема: смешивает онлайн и офлайн даты!');
} else {
  console.log('✅ Показывает только очные даты');
}

// 3. Проверка презентации Фундамента (НЕ должно быть "с нуля")
console.log('\n📖 3. Презентация курса Фундамент:');
const fundament = getDetailedCoursePresentation('1');
if (fundament && fundament.includes('Это не про "учимся с нуля"') && fundament.includes('структурировать знания')) {
  console.log('✅ Правильно: "Это НЕ про учимся с нуля - это про то, чтобы структурировать знания"');
} else if (fundament && fundament.includes('учимся с нуля') && !fundament.includes('не про')) {
  console.log('❌ Проблема: содержит "учимся с нуля" без отрицания');
} else if (!fundament) {
  console.log('⚠️ Презентация не найдена');
}

// 4. Проверка краткой презентации курсов
console.log('\n📊 4. Краткая презентация курсов:');
const mockQualification = {
  format: 'offline',
  direction: 'haircuts',
  experience: 'intermediate',
  qualified: true
};
const mockCourses = [
  { name: 'Стрижки: Фундамент', price: 60000, format: 'офлайн' },
  { name: 'Стрижки 2.0', price: 60000, format: 'офлайн' },
  { name: 'Короткие стрижки 2.0', price: 70000, format: 'офлайн' }
];

const shortPresentation = getShortCoursePresentation(mockCourses, mockQualification);
if (shortPresentation.includes('структурируем знания')) {
  console.log('✅ Фундамент: "структурируем знания и раскладываем по полочкам"');
} else if (shortPresentation.includes('с нуля')) {
  console.log('❌ Проблема: всё ещё содержит "с нуля"');
}

console.log('\n' + '=' .repeat(60));
console.log('\n📝 ИТОГ ПРОВЕРКИ:');
console.log('1. Группы до 15 человек (не 8)');
console.log('2. Даты не смешиваются (очные отдельно от онлайн)');
console.log('3. Фундамент - "структурируем знания", не "с нуля"');
console.log('\nВсе исправления должны быть применены!');
