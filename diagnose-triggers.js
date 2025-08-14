#!/usr/bin/env node

console.log('🔍 ДИАГНОСТИКА ТРИГГЕРОВ И КОНФЛИКТОВ\n');
console.log('=' .repeat(60));

// Тестовые фразы с ожидаемым поведением
const testCases = [
  {
    phrase: 'Расскажи про курсы',
    expected: 'КВАЛИФИКАЦИЯ',
    reason: 'Общий запрос, должна начаться квалификация'
  },
  {
    phrase: 'очные курсы',
    expected: 'КВАЛИФИКАЦИЯ',
    reason: 'Общий запрос без конкретики'
  },
  {
    phrase: 'онлайн курсы',
    expected: 'КВАЛИФИКАЦИЯ',
    reason: 'Общий запрос без конкретики'
  },
  {
    phrase: 'все очные курсы',
    expected: 'ПРЯМОЙ ЗАПРОС',
    reason: 'Конкретный запрос всех очных курсов'
  },
  {
    phrase: 'курсы по колористике',
    expected: 'ПРЯМОЙ ЗАПРОС',
    reason: 'Конкретное направление указано'
  },
  {
    phrase: 'хочу учиться',
    expected: 'КВАЛИФИКАЦИЯ',
    reason: 'Общее желание учиться'
  },
  {
    phrase: '1',
    expected: 'ДЕТАЛИ',
    reason: 'Выбор конкретного курса из списка'
  },
  {
    phrase: 'про фундамент',
    expected: 'ДЕТАЛИ',
    reason: 'Запрос деталей конкретного курса'
  },
  {
    phrase: 'где находится творческая деревня',
    expected: 'FAQ',
    reason: 'Вопрос из FAQ'
  },
  {
    phrase: 'дорого',
    expected: 'ВОЗРАЖЕНИЕ',
    reason: 'Возражение по цене'
  },
  {
    phrase: 'хочу курс по колористике в творческой деревне',
    expected: 'СПЕЦ_ДНК',
    reason: 'Специальный запрос ДНК цвета'
  }
];

console.log('\n📊 АНАЛИЗ ФРАЗ И ОЖИДАЕМОЕ ПОВЕДЕНИЕ:\n');

testCases.forEach(test => {
  console.log(`\nФраза: "${test.phrase}"`);
  console.log(`  📍 Ожидается: ${test.expected}`);
  console.log(`  💡 Причина: ${test.reason}`);

  // Проверяем что сработает по приоритету в aiAgent.ts
  console.log('\n  Порядок проверок в коде:');
  console.log('  1. isGeneralRequest && !isAskingForDetails → КВАЛИФИКАЦИЯ');
  console.log('  2. isAskingForDetails → ДЕТАЛИ');
  console.log('  3. findFAQAnswer → FAQ');
  console.log('  4. findObjectionResponse → ВОЗРАЖЕНИЕ');
  console.log('  5. Прямые проверки (очные/онлайн/колористика) → ПРЯМОЙ ЗАПРОС');
  console.log('  6. isDNACourseRequest → СПЕЦ_ДНК');
  console.log('  7. isAskingForDates → ДАТЫ');
});

console.log('\n' + '=' .repeat(60));
console.log('\n⚠️  ВЫЯВЛЕННЫЕ КОНФЛИКТЫ:\n');

const conflicts = [
  {
    phrases: ['очные курсы', 'онлайн курсы'],
    problem: 'Могут попасть и в квалификацию, и в прямой запрос',
    solution: 'Убрать из generalPhrases или добавить проверку длины/контекста'
  },
  {
    phrases: ['расскажи про днк', 'расскажи про фундамент'],
    problem: 'Могут попасть и в квалификацию (расскажи), и в детали (днк/фундамент)',
    solution: 'Проверять isAskingForDetails ПЕРЕД isGeneralRequest'
  },
  {
    phrases: ['колористика', 'стрижки'],
    problem: 'Одно слово может не запускать квалификацию',
    solution: 'Добавить эти слова в триггеры квалификации если они единственные'
  }
];

conflicts.forEach((conflict, index) => {
  console.log(`\n${index + 1}. Конфликт с фразами: ${conflict.phrases.join(', ')}`);
  console.log(`   ❌ Проблема: ${conflict.problem}`);
  console.log(`   ✅ Решение: ${conflict.solution}`);
});

console.log('\n' + '=' .repeat(60));
console.log('\n📝 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:\n');

console.log('1. ИЗМЕНИТЬ ПОРЯДОК ПРОВЕРОК:');
console.log('   - Сначала специальные проверки (ДНК, даты)');
console.log('   - Потом детали курса');
console.log('   - Потом квалификация');
console.log('   - Потом FAQ и возражения');
console.log('   - В конце прямые запросы');

console.log('\n2. УТОЧНИТЬ ТРИГГЕРЫ КВАЛИФИКАЦИИ:');
console.log('   - Убрать "очные курсы", "онлайн курсы" из общих фраз');
console.log('   - Добавить проверку: если фраза < 20 символов И содержит "курс"');
console.log('   - Добавить одиночные слова: "стрижки", "колористика"');

console.log('\n3. ДОБАВИТЬ КОНТЕКСТНЫЕ ПРОВЕРКИ:');
console.log('   - Если в диалоге уже была квалификация - не запускать снова');
console.log('   - Если клиент уже квалифицирован - сразу показывать курсы');

console.log('\n');
