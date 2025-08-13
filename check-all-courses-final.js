const Database = require('bun:sqlite').default;

console.log('📊 ФИНАЛЬНАЯ ПРОВЕРКА ВСЕХ КУРСОВ SOINTERA\n');
console.log('='.repeat(70));

const db = new Database('./courses.db');

// Получаем все курсы
const allCourses = db.prepare('SELECT * FROM courses ORDER BY format DESC, price ASC').all();

console.log(`\nВсего курсов в базе: ${allCourses.length}\n`);

// Группируем по формату
const online = allCourses.filter(c => c.format === 'онлайн');
const offline = allCourses.filter(c => c.format === 'офлайн');

console.log('📱 ОНЛАЙН КУРСЫ (' + online.length + '):\n');
online.forEach(course => {
  console.log(`${course.name}`);
  console.log(`   💰 ${course.price.toLocaleString('ru-RU')} руб.`);
  console.log(`   🔗 ${course.enrollmentUrl}`);
  console.log('');
});

console.log('─'.repeat(70));
console.log('\n🏢 ОФЛАЙН КУРСЫ В ТВОРЧЕСКОЙ ДЕРЕВНЕ (' + offline.length + '):\n');
offline.forEach(course => {
  console.log(`${course.name}`);
  console.log(`   💰 ${course.price.toLocaleString('ru-RU')} руб.`);
  console.log(`   🔗 ${course.enrollmentUrl}`);
  console.log('');
});

console.log('─'.repeat(70));
console.log('\n✅ ПРОВЕРКА КЛЮЧЕВЫХ КУРСОВ:\n');

const keyChecks = [
  ['ДНК ЦВЕТА офлайн', 'ДНК ЦВЕТА - Фундаментальный курс по колористике в Творческой деревне', 60000, 'https://sointera-biz.ru/dna_person#rec981721501'],
  ['ДНК Цвета онлайн', 'ДНК Цвета. Курс по колористике (онлайн)', 39000, 'https://sointera-biz.ru/dna_online'],
  ['Короткие стрижки 2.0', 'Короткие стрижки 2.0', 70000, 'https://sointera-biz.ru/short_haircuts2'],
  ['Стрижки: фундамент', 'Очный курс по стрижкам: фундамент', 60000, 'https://sointera-biz.ru/stajirovka'],
  ['Парикмахер с нуля', 'Парикмахер с нуля', 135000, 'https://sointera-biz.ru/parikmakher-s-nulya']
];

keyChecks.forEach(([shortName, fullName, expectedPrice, expectedUrl]) => {
  const course = db.prepare('SELECT * FROM courses WHERE name = ?').get(fullName);
  if (course) {
    const priceOk = course.price === expectedPrice;
    const urlOk = course.enrollmentUrl === expectedUrl;
    console.log(`${priceOk && urlOk ? '✅' : '❌'} ${shortName}`);
    if (!priceOk) console.log(`   ⚠️ Цена: ${course.price} (должна быть ${expectedPrice})`);
    if (!urlOk) console.log(`   ⚠️ URL: ${course.enrollmentUrl}`);
  } else {
    console.log(`❌ ${shortName} - НЕ НАЙДЕН`);
  }
});

// Проверяем наличие описаний для ключевых курсов
console.log('\n📝 ПРОВЕРКА ОПИСАНИЙ КЛЮЧЕВЫХ КУРСОВ:\n');

const dnaOffline = db.prepare('SELECT description, curriculum FROM courses WHERE name = ?')
  .get('ДНК ЦВЕТА - Фундаментальный курс по колористике в Творческой деревне');

if (dnaOffline) {
  console.log('ДНК ЦВЕТА (офлайн):');
  console.log(`✅ Рисование красителями: ${dnaOffline.curriculum.includes('рисование красителями') ? 'есть' : 'НЕТ'}`);
  console.log(`✅ Моделирование оттенка кожи: ${dnaOffline.curriculum.includes('оттенка кожи') ? 'есть' : 'НЕТ'}`);
  console.log(`✅ Без привязки к бренду: ${dnaOffline.description.includes('без привязки к бренду') ? 'есть' : 'НЕТ'}`);
}

const shortHaircuts = db.prepare('SELECT curriculum FROM courses WHERE name = ?')
  .get('Короткие стрижки 2.0');

if (shortHaircuts) {
  console.log('\nКороткие стрижки 2.0:');
  console.log(`✅ Читаемый затылок: ${shortHaircuts.curriculum.includes('затылка') ? 'есть' : 'НЕТ'}`);
  console.log(`✅ От 15 см до 2-3 см: ${shortHaircuts.curriculum.includes('15 см') && shortHaircuts.curriculum.includes('2-3 см') ? 'есть' : 'НЕТ'}`);
}

// Проверяем отсутствие несуществующих курсов
console.log('\n⚠️ ПРОВЕРКА ОТСУТСТВИЯ НЕСУЩЕСТВУЮЩИХ КУРСОВ:\n');
const wrongCourses = db.prepare(`
  SELECT name FROM courses
  WHERE name LIKE '%визаж%' OR name LIKE '%макияж%'
     OR name LIKE '%брови%' OR name LIKE '%ресниц%'
     OR name LIKE '%массаж%' OR name LIKE '%косметолог%'
`).all();

if (wrongCourses.length === 0) {
  console.log('✅ Несуществующих курсов нет');
} else {
  console.log('❌ Найдены несуществующие курсы:');
  wrongCourses.forEach(c => console.log(`   - ${c.name}`));
}

db.close();

console.log('\n' + '='.repeat(70));
console.log('\n✅ ПРОВЕРКА ЗАВЕРШЕНА!');
