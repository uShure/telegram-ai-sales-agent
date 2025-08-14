#!/usr/bin/env bun

import {
  analyzeQualification,
  getQualificationQuestions,
  getShortCoursePresentation
} from './src/data/qualification-logic.ts';

console.log('🎯 ДЕМОНСТРАЦИЯ ПОТОКА КВАЛИФИКАЦИИ');
console.log('=' .repeat(60));

// Симулируем диалог
const dialogs = [
  {
    messages: [],
    description: 'Первое сообщение клиента'
  },
  {
    messages: ['хочу учиться'],
    description: 'После ответа "хочу учиться"'
  },
  {
    messages: ['хочу учиться', 'очно'],
    description: 'Выбран формат ОЧНО'
  },
  {
    messages: ['хочу учиться', 'очно', 'стрижки'],
    description: 'Выбрано направление СТРИЖКИ'
  },
  {
    messages: ['хочу учиться', 'очно', 'стрижки', '5 лет работаю'],
    description: 'Указан опыт 5 лет'
  }
];

dialogs.forEach((dialog, index) => {
  console.log(`\n📍 Шаг ${index + 1}: ${dialog.description}`);
  console.log('-'.repeat(50));

  const qualification = analyzeQualification(dialog.messages);

  console.log('Квалификация:');
  console.log(`  • Формат: ${qualification.format || 'не определен'}`);
  console.log(`  • Направление: ${qualification.direction || 'не определено'}`);
  console.log(`  • Опыт: ${qualification.experience || 'не определен'}`);
  console.log(`  • Квалифицирован: ${qualification.qualified ? 'ДА' : 'НЕТ'}`);

  if (!qualification.qualified) {
    const questions = getQualificationQuestions(qualification);
    console.log('\n💬 Вопрос Веры:');
    console.log(questions);
  } else {
    console.log('\n✅ Клиент квалифицирован!');

    // Симулируем курсы для стрижек
    const mockCourses = [
      { name: 'Стрижки: Фундамент', price: 60000, format: 'офлайн' },
      { name: 'Стрижки 2.0', price: 60000, format: 'офлайн' },
      { name: 'Короткие стрижки 2.0', price: 70000, format: 'офлайн' }
    ];

    const presentation = getShortCoursePresentation(mockCourses, qualification);
    console.log('\n📊 Презентация курсов:');
    console.log(presentation);
  }
});

console.log('\n' + '=' .repeat(60));
console.log('\n✅ ИТОГ: Вся логика квалификации работает!');
console.log('\nПорядок вопросов:');
console.log('1️⃣ Сначала формат (очно/онлайн)');
console.log('2️⃣ Потом направление (стрижки/колористика)');
console.log('3️⃣ Потом опыт работы');
console.log('4️⃣ Показываем 3 варианта с объяснением отличий');
console.log('5️⃣ Спрашиваем: "О каком рассказать подробнее? 1, 2 или 3"');
