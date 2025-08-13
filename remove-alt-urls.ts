import { Database } from "bun:sqlite";

try {
  console.log('🗑️  Удаление альтернативных URL из базы данных...\n');

  const db = new Database("courses.db");

  // Очищаем поле additionalInfo для всех курсов
  const clearQuery = db.prepare("UPDATE Course SET additionalInfo = NULL");
  const result = clearQuery.run();

  console.log(`✅ Очищено поле additionalInfo у ${result.changes} курсов\n`);

  // Проверяем результат
  console.log('📋 Проверка курсов после удаления альтернативных URL:\n');

  const courses = db.query("SELECT title, url, additionalInfo FROM Course ORDER BY title").all();

  courses.forEach((course: any) => {
    console.log(`✅ ${course.title}`);
    console.log(`   URL: ${course.url}`);
    if (course.additionalInfo) {
      console.log(`   ⚠️  Осталось доп. инфо: ${course.additionalInfo}`);
    }
    console.log('');
  });

  console.log(`\n📊 Итого курсов: ${courses.length}`);
  console.log('✅ Альтернативные URL удалены!');

  db.close();

} catch (error) {
  console.error('❌ Ошибка:', error);
}
