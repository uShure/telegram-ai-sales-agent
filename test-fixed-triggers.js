#!/usr/bin/env bun

import { isAskingForDetails, isGeneralRequest } from './src/data/qualification-logic.ts';

console.log('🧪 ТЕСТИРОВАНИЕ ИСПРАВЛЕННЫХ ТРИГГЕРОВ\n');
console.log('=' .repeat(50));

const testPhrases = [
  'Расскажи про курсы',
  'расскажи про курсы',
  'расскажите про курсы',
  'Какие курсы',
  'очные курсы',
  'онлайн курсы',
  'про фундамент',
  'расскажи про днк',
  '1',
  'дорого'
];

console.log('\n📊 РЕЗУЛЬТАТЫ:\n');

testPhrases.forEach(phrase => {
  const isGeneral = isGeneralRequest(phrase);
  const isDetails = isAskingForDetails(phrase);

  console.log(`"${phrase}"`);
  console.log(`  📋 Общий запрос: ${isGeneral ? 'ДА' : 'НЕТ'}`);
  console.log(`  📖 Детали курса: ${isDetails ? 'ДА' : 'НЕТ'}`);

  // Определяем что сработает в aiAgent.ts
  let result = '';
  if (!isGeneral && isDetails) {
    result = '📖 ДЕТАЛИ';
  } else if (isGeneral) {
    result = '🎯 КВАЛИФИКАЦИЯ';
  } else {
    result = '➡️ Другие проверки';
  }

  console.log(`  🏆 Результат: ${result}\n`);
});

console.log('=' .repeat(50));
console.log('\n✅ Ожидаемые результаты:');
console.log('- "Расскажи про курсы" → КВАЛИФИКАЦИЯ');
console.log('- "про фундамент" → ДЕТАЛИ');
console.log('- "очные курсы" → Другие проверки (прямой запрос)');
console.log('- "1" → ДЕТАЛИ');
