#!/usr/bin/env node

// Тестирование триггеров квалификации

import { isGeneralRequest, analyzeQualification, getQualificationQuestions } from './src/data/qualification-logic.js';
import { isAskingForDetails } from './src/data/detailed-presentations.js';
import { findFAQAnswer } from './src/data/faq-creative-village.js';
import { findObjectionResponse } from './src/data/objection-scenarios.js';

console.log('🧪 ТЕСТИРОВАНИЕ ТРИГГЕРОВ КВАЛИФИКАЦИИ\n');
console.log('=' .repeat(50));

// Тестовые фразы
const testPhrases = [
  // Должны запускать квалификацию
  'Расскажи про курсы',
  'расскажите про курсы',
  'Какие курсы',
  'какие есть курсы',
  'что есть',
  'все курсы',
  'про обучение',
  'хочу учиться',
  'очные курсы',
  'онлайн курсы',

  // Не должны запускать квалификацию (слишком длинные)
  'Расскажи про курсы по колористике которые проходят в творческой деревне',

  // Должны запускать детали
  '1',
  '2',
  '3',
  'первый',
  'второй',
  'про фундамент',
  'расскажи про днк',

  // FAQ вопросы
  'где находится творческая деревня',
  'что входит в стоимость',
  'сколько человек в группе',

  // Возражения
  'дорого',
  '60 тысяч это дорого',
  'нет времени',
  'далеко ехать',

  // Прямые запросы (не квалификация)
  'все очные курсы покажи',
  'онлайн курсы по колористике'
];

console.log('\n📋 ПРОВЕРКА ФРАЗ:\n');

testPhrases.forEach(phrase => {
  const isGeneral = isGeneralRequest(phrase);
  const isDetails = isAskingForDetails(phrase);
  const faqAnswer = findFAQAnswer(phrase);
  const objection = findObjectionResponse(phrase);

  console.log(`\n"${phrase}"`);
  console.log(`  Длина: ${phrase.length} символов`);
  console.log(`  ✅ Общий запрос (квалификация): ${isGeneral ? 'ДА' : 'НЕТ'}`);
  console.log(`  📖 Запрос деталей: ${isDetails ? 'ДА' : 'НЕТ'}`);
  console.log(`  ❓ FAQ: ${faqAnswer ? 'ДА' : 'НЕТ'}`);
  console.log(`  💬 Возражение: ${objection ? 'ДА' : 'НЕТ'}`);

  // Определяем что сработает первым
  let firstTrigger = 'Ничего';
  if (isGeneral && !isDetails) firstTrigger = '🎯 КВАЛИФИКАЦИЯ';
  else if (isDetails) firstTrigger = '📖 ДЕТАЛИ КУРСА';
  else if (faqAnswer) firstTrigger = '❓ FAQ';
  else if (objection) firstTrigger = '💬 ВОЗРАЖЕНИЕ';

  console.log(`  🏆 Сработает: ${firstTrigger}`);
});

console.log('\n' + '=' .repeat(50));
console.log('\n📊 ПРОВЕРКА АНАЛИЗА КВАЛИФИКАЦИИ:\n');

// Тестовые диалоги
const testDialogs = [
  ['Хочу учиться'],
  ['Хочу учиться', 'очно'],
  ['Хочу учиться', 'очно', 'стрижки'],
  ['Хочу учиться', 'очно', 'стрижки', '5 лет работаю'],
  ['расскажи про курсы', 'онлайн', 'колористика', 'начинающий']
];

testDialogs.forEach((messages, index) => {
  console.log(`\nДиалог ${index + 1}: ${messages.join(' → ')}`);
  const qualification = analyzeQualification(messages);
  console.log(`  Формат: ${qualification.format || 'не определен'}`);
  console.log(`  Направление: ${qualification.direction || 'не определено'}`);
  console.log(`  Опыт: ${qualification.experience || 'не определен'}`);
  console.log(`  Квалифицирован: ${qualification.qualified ? 'ДА' : 'НЕТ'}`);

  if (!qualification.qualified) {
    const questions = getQualificationQuestions(qualification);
    console.log(`  Следующий вопрос: ${questions.split('\n')[0].substring(0, 50)}...`);
  }
});

console.log('\n' + '=' .repeat(50));
console.log('\n✅ РЕКОМЕНДАЦИИ:\n');
console.log('1. "Расскажи про курсы" должно запускать квалификацию');
console.log('2. Числа 1,2,3 должны запускать детали курса');
console.log('3. FAQ и возражения должны работать только для конкретных фраз');
console.log('4. Квалификация считается завершенной когда известны формат + направление');
console.log('\n');
