const fs = require('fs');
const path = require('path');

// Читаем файл
const filePath = path.join(__dirname, 'src/database/coursesDB.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Находим метод searchCourses
const methodStart = content.indexOf('async searchCourses(keywords: string)');
const methodEnd = content.indexOf('}', content.indexOf('} catch (err)', methodStart)) + 1;

// Новый метод с исправленным поиском
const newMethod = `async searchCourses(keywords: string): Promise<Course[]> {
    try {
      const query = \`
        SELECT * FROM courses
        WHERE (
          LOWER(name) LIKE LOWER(?) OR
          LOWER(description) LIKE LOWER(?) OR
          LOWER(targetAudience) LIKE LOWER(?) OR
          LOWER(benefits) LIKE LOWER(?)
        ) AND active = 1
        ORDER BY price ASC
      \`;
      const searchPattern = \`%\${keywords}%\`;
      const rows = this.db.prepare(query).all(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      ) as Course[];
      console.log(\`✅ Найдено курсов по запросу "\${keywords}": \${rows.length}\`);
      if (rows.length > 0) {
        console.log(\`📋 Найденные курсы: \${rows.map(r => r.name).join(', ')}\`);
      }
      return rows;
    } catch (err) {
      console.error('❌ Ошибка поиска курсов:', err);
      return [];
    }
  }`;

// Заменяем метод
content = content.substring(0, methodStart) + newMethod + content.substring(methodEnd);

// Записываем обратно
fs.writeFileSync(filePath, content);
console.log('✅ Метод searchCourses обновлен с LOWER() для поиска без учета регистра');
