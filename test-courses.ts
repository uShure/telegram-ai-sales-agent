import { coursesDB } from './src/database/coursesDB';

async function testCoursesDB() {
  console.log('🧪 Тестирование базы данных курсов...\n');

  try {
    // Тест 1: Получить все курсы
    console.log('📋 Тест 1: Получение всех курсов');
    const allCourses = await coursesDB.getAllCourses();
    console.log(`✅ Найдено курсов: ${allCourses.length}`);

    if (allCourses.length > 0) {
      console.log('\n📚 Список курсов:');
      allCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.name} - ${course.price}₽`);
      });
    }

    // Тест 2: Поиск курса по имени
    console.log('\n📋 Тест 2: Поиск курса "Парикмахер"');
    const hairdresserCourse = await coursesDB.getCourseByName('Парикмахер');
    if (hairdresserCourse) {
      console.log(`✅ Найден курс: ${hairdresserCourse.name}`);
      console.log(`   Цена: ${hairdresserCourse.price}₽`);
      console.log(`   Длительность: ${hairdresserCourse.duration}`);
    }

    // Тест 3: Поиск курсов в ценовом диапазоне
    console.log('\n📋 Тест 3: Курсы от 20000 до 50000 рублей');
    const affordableCourses = await coursesDB.getCoursesByPriceRange(20000, 50000);
    console.log(`✅ Найдено курсов: ${affordableCourses.length}`);
    affordableCourses.forEach(course => {
      console.log(`   - ${course.name}: ${course.price}₽`);
    });

    // Тест 4: Поиск по ключевым словам
    console.log('\n📋 Тест 4: Поиск курсов со словом "мастер"');
    const masterCourses = await coursesDB.searchCourses('мастер');
    console.log(`✅ Найдено курсов: ${masterCourses.length}`);
    masterCourses.forEach(course => {
      console.log(`   - ${course.name}`);
    });

    // Тест 5: Форматирование курса
    if (allCourses.length > 0) {
      console.log('\n📋 Тест 5: Форматирование первого курса');
      const formattedCourse = coursesDB.formatCourseInfo(allCourses[0]);
      console.log('✅ Отформатированный курс:');
      console.log(formattedCourse);
    }

    console.log('\n✅ Все тесты пройдены успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    coursesDB.close();
  }
}

// Запускаем тесты
testCoursesDB();
