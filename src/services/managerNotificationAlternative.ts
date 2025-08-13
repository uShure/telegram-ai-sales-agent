/**
 * Альтернативный способ создания ссылки на пользователя через inline mention
 */

import { Api } from 'telegram';

/**
 * Создает inline mention для пользователя
 */
export function createUserMention(userId: string, userName: string): any {
  // Создаем объект MessageEntityMentionName
  return new Api.MessageEntityMentionName({
    offset: 0,
    length: userName.length,
    userId: BigInt(userId)
  });
}

/**
 * Форматирует сообщение с inline mention
 */
export function formatWithInlineMention(
  text: string,
  userId: string,
  userName: string
): { message: string; entities: any[] } {
  // Заменяем placeholder на имя пользователя
  const placeholder = '{{USER_MENTION}}';
  const message = text.replace(placeholder, userName);

  // Находим позицию имени в тексте
  const offset = message.indexOf(userName);

  // Создаем entity для mention
  const entity = new Api.MessageEntityMentionName({
    offset: offset,
    length: userName.length,
    userId: BigInt(userId)
  });

  return {
    message,
    entities: [entity]
  };
}

/**
 * Пример использования:
 *
 * const { message, entities } = formatWithInlineMention(
 *   'Клиент {{USER_MENTION}} готов оформить заказ',
 *   '186757140',
 *   'Андрей Могучев'
 * );
 *
 * await client.sendMessage(MANAGER_USERNAME, {
 *   message: message,
 *   formattingEntities: entities
 * });
 */
