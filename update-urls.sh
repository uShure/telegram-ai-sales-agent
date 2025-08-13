#!/bin/bash

echo "📚 Обновление URL курсов в базе данных..."

# Проверяем наличие базы данных
if [ ! -f "courses.db" ]; then
    echo "❌ База данных courses.db не найдена!"
    exit 1
fi

# Функция для обновления URL
update_course_url() {
    local title="$1"
    local url="$2"

    echo -n "Обновляем '$title'... "

    # Обновляем URL
    result=$(sqlite3 courses.db "UPDATE Course SET url = '$url' WHERE title = '$title'; SELECT changes();")

    if [ "$result" -gt 0 ]; then
        echo "✅ Успешно!"
    else
        # Пробуем частичное совпадение
        result=$(sqlite3 courses.db "UPDATE Course SET url = '$url' WHERE title LIKE '%$title%'; SELECT changes();")
        if [ "$result" -gt 0 ]; then
            echo "✅ Успешно (частичное совпадение)!"
        else
            echo "⚠️  Не найден"
        fi
    fi
}

echo ""
echo "🔄 Начинаем обновление URL..."
echo ""

# Обновляем URL для каждого курса
update_course_url "Консультация на миллион" "https://sointera-biz.ru/million-consultation"
update_course_url "Короткие стрижки 2.0" "https://sointera-biz.ru/short-haircuts-2"
update_course_url "Очный курс по стрижкам: фундамент" "https://sointera-biz.ru/haircuts-foundation"
update_course_url "Стрижки 2.0" "https://sointera-biz.ru/haircuts-2"
update_course_url "СПА-стажировка в онлайн формате" "https://sointera-biz.ru/spa-online"
update_course_url "Стрижка SOINTERA" "https://sointera-biz.ru/strizhka-sointera"
update_course_url "Мастер-группа для руководителей" "https://sointera-biz.ru/master-group"
update_course_url "Планирование в салоне" "https://sointera-biz.ru/salon-planning"
update_course_url "Школа маркетинга" "https://sointera-biz.ru/marketing-school"
update_course_url "ДНК Цвета. Курс по колористике" "https://sointera-biz.ru/dna-color"
update_course_url "Короткие стрижки" "https://sointera-biz.ru/short-haircuts-online"
update_course_url "Курс по стрижкам" "https://sointera-biz.ru/haircuts-online"
update_course_url "Наставник по стрижкам" "https://sointera-biz.ru/haircuts-mentor"
update_course_url "Наставник-колорист" "https://sointera-biz.ru/colorist-mentor"
update_course_url "Парикмахер с нуля" "https://sointera-biz.ru/hairdresser-from-zero"
update_course_url "Корейские стрижки" "https://sointera-biz.ru/korean-haircuts"
update_course_url "Факультет по неуправляемым волосам" "https://sointera-biz.ru/unruly-hair"
update_course_url "Факультет по работе с блондинками" "https://sointera-biz.ru/blonde-faculty"
update_course_url "Лицензия преподавателя" "https://sointera-biz.ru/teacher-license"
update_course_url "Федеральная программа подготовки тренеров" "https://sointera-biz.ru/federal-trainer-program"

echo ""
echo "📋 Проверка обновленных курсов:"
echo ""

# Показываем все курсы с новыми URL
sqlite3 courses.db -column -header "SELECT title, url FROM Course WHERE url LIKE '%sointera-biz.ru%' ORDER BY title;"

echo ""
echo "✅ Обновление завершено!"
