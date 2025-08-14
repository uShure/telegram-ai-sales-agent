#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import os

# Новые URL для курсов
course_urls = {
    'Консультация на миллион': 'https://sointera-biz.ru/million-consultation',
    'Короткие стрижки 2.0': 'https://sointera-biz.ru/short-haircuts-2',
    'Очный курс по стрижкам: фундамент': 'https://sointera-biz.ru/haircuts-foundation',
    'Стрижки 2.0': 'https://sointera-biz.ru/haircuts-2',
    'СПА-стажировка в онлайн формате': 'https://sointera-biz.ru/spa-online',
    'Стрижка SOINTERA': 'https://sointera-biz.ru/strizhka-sointera',
    'Мастер-группа для руководителей': 'https://sointera-biz.ru/master-group',
    'Планирование в салоне': 'https://sointera-biz.ru/salon-planning',
    'Школа маркетинга': 'https://sointera-biz.ru/marketing-school',
    'ДНК Цвета. Курс по колористике': 'https://sointera-biz.ru/dna-color',
    'Короткие стрижки': 'https://sointera-biz.ru/short-haircuts-online',
    'Курс по стрижкам': 'https://sointera-biz.ru/haircuts-online',
    'Наставник по стрижкам': 'https://sointera-biz.ru/haircuts-mentor',
    'Наставник-колорист': 'https://sointera-biz.ru/colorist-mentor',
    'Парикмахер с нуля': 'https://sointera-biz.ru/hairdresser-from-zero',
    'Корейские стрижки': 'https://sointera-biz.ru/korean-haircuts',
    'Факультет по неуправляемым волосам': 'https://sointera-biz.ru/unruly-hair',
    'Факультет по работе с блондинками': 'https://sointera-biz.ru/blonde-faculty',
    'Лицензия преподавателя': 'https://sointera-biz.ru/teacher-license',
    'Федеральная программа подготовки тренеров': 'https://sointera-biz.ru/federal-trainer-program'
}

# Альтернативные URL
alternative_urls = {
    'Консультация на миллион': 'https://sointera-biz.ru/million-consultation',
    'Короткие стрижки 2.0': 'https://sointera-biz.ru/short_haircuts2',
    'Очный курс по стрижкам: фундамент': 'https://sointera-biz.ru/stajirovka',
    'Стрижки 2.0': 'https://sointera-biz.ru/haircuts-2-0',
    'СПА-стажировка в онлайн формате': 'https://sointera-biz.ru/spa-online',
    'Стрижка SOINTERA': 'https://sointera-biz.ru/haircut-sointera',
    'Мастер-группа для руководителей': 'https://sointera-biz.ru/master-gruppa',
    'Планирование в салоне': 'https://sointera-biz.ru/planning',
    'Школа маркетинга': 'https://sointera-biz.ru/school-of-marketing',
    'ДНК Цвета. Курс по колористике': 'https://sointera-biz.ru/dna_online',
    'Короткие стрижки': 'https://sointera-biz.ru/short_haircuts',
    'Курс по стрижкам': 'https://sointera-biz.ru/haircut_course',
    'Наставник по стрижкам': 'https://sointera-biz.ru/hair_mentor',
    'Наставник-колорист': 'https://sointera-biz.ru/nastavnik-kolorist',
    'Парикмахер с нуля': 'https://sointera-biz.ru/parikmakher-s-nulya',
    'Корейские стрижки': 'https://sointera-biz.ru/koreyskiye-strizhki',
    'Факультет по неуправляемым волосам': 'https://sointera-biz.ru/fakultat-po-neupravlyayemym-volosam',
    'Факультет по работе с блондинками': 'https://sointera-biz.ru/fakultet-blond',
    'Лицензия преподавателя': 'https://sointera-biz.ru/licenziya-prepodavatelya',
    'Федеральная программа подготовки тренеров': 'https://sointera-biz.ru/federalnaya-programma-podgotovki'
}

def main():
    db_path = 'courses.db'

    if not os.path.exists(db_path):
        print(f"❌ База данных {db_path} не найдена!")
        return

    print(f"📚 Обновление URL курсов в базе данных: {db_path}")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("✅ Подключено к базе данных")

        # Получаем все курсы из базы
        cursor.execute("SELECT id, title, url FROM Course ORDER BY title")
        all_courses = cursor.fetchall()

        print(f"\n📋 Всего курсов в базе: {len(all_courses)}")
        print("\n🔄 Начинаем обновление URL...\n")

        updated_count = 0
        not_found_count = 0
        not_found_courses = []

        # Обновляем URL для каждого курса
        for title, new_url in course_urls.items():
            found = False

            # Ищем точное или частичное совпадение
            for course_id, course_title, old_url in all_courses:
                if (course_title == title or
                    title.lower() in course_title.lower() or
                    course_title.lower() in title.lower()):

                    # Обновляем URL
                    cursor.execute("UPDATE Course SET url = ? WHERE id = ?", (new_url, course_id))
                    print(f"✅ Обновлен: {course_title}")
                    print(f"   Старый URL: {old_url}")
                    print(f"   Новый URL: {new_url}")

                    # Добавляем альтернативный URL если есть
                    if title in alternative_urls and alternative_urls[title] != new_url:
                        alt_url = alternative_urls[title]
                        alt_info = f"Альтернативный URL: {alt_url}"

                        cursor.execute("""
                            UPDATE Course
                            SET additionalInfo =
                                CASE
                                    WHEN additionalInfo IS NULL THEN ?
                                    WHEN additionalInfo NOT LIKE '%Альтернативный URL:%' THEN additionalInfo || char(10) || ?
                                    ELSE additionalInfo
                                END
                            WHERE id = ?
                        """, (alt_info, alt_info, course_id))

                        print(f"   Альт. URL: {alt_url}")

                    found = True
                    updated_count += 1
                    break

            if not found:
                not_found_courses.append(title)
                not_found_count += 1

        # Сохраняем изменения
        conn.commit()

        print(f"\n📊 Результаты обновления:")
        print(f"   ✅ Обновлено курсов: {updated_count}")
        print(f"   ⚠️  Не найдено курсов: {not_found_count}")

        if not_found_courses:
            print("\n⚠️  Не найдены следующие курсы:")
            for course in not_found_courses:
                print(f"   - {course}")

        # Показываем обновленные курсы
        print("\n📋 Проверка обновленных URL:")
        cursor.execute("SELECT title, url FROM Course ORDER BY title")
        updated_courses = cursor.fetchall()

        for title, url in updated_courses:
            has_new_url = url in course_urls.values() or url in alternative_urls.values()
            status = "✅" if has_new_url else "❓"
            print(f"{status} {title}")
            print(f"   {url}")

        conn.close()
        print("\n✅ Обновление завершено!")

    except sqlite3.Error as e:
        print(f"❌ Ошибка SQLite: {e}")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()
