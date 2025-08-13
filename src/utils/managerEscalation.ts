/**
 * Модуль эскалации к менеджеру
 * Определяет ситуации, когда нужна помощь живого менеджера
 */

// Telegram username менеджера
const MANAGER_TELEGRAM = '@natalylini';
const MANAGER_CHAT_ID = ''; // Нужно будет получить chat_id менеджера

// Ключевые фразы, требующие эскалации
const ESCALATION_TRIGGERS = {
  // Оформление заказа
  order: [
    'оформить заказ',
    'купить курс',
    'хочу оплатить',
    'готов оплатить',
    'готова оплатить',
    'как оплатить',
    'оплата курса',
    'покупаю',
    'беру курс',
    'записаться на курс'
  ],

  // Лист ожидания
  waitlist: [
    'лист ожидания',
    'запись на будущее',
    'когда будет курс',
    'следующий поток',
    'записать меня',
    'забронировать место',
    'резерв места'
  ],

  // Проблемы с доступом
  access: [
    'не могу зайти',
    'не работает личный кабинет',
    'забыл пароль',
    'не приходит письмо',
    'проблема с доступом',
    'не открывается',
    'ошибка входа',
    'не пускает'
  ],

  // Программа курса
  program: [
    'программа курса',
    'подробная программа',
    'что входит в курс',
    'план обучения',
    'учебный план',
    'расписание занятий',
    'детальная программа'
  ],

  // Рассрочка
  installment: [
    'рассрочка',
    'оплата частями',
    'можно в рассрочку',
    'платеж частями',
    'разделить оплату',
    'кредит',
    'отсрочка платежа'
  ],

  // Оплата как ИП/юрлицо
  business: [
    'оплатить как ип',
    'оплата от ип',
    'оплата от ооо',
    'юридическое лицо',
    'безналичная оплата',
    'нужен договор',
    'счет на оплату',
    'счет для ип',
    'счет для ооо',
    'официальный договор'
  ],

  // Срочные вопросы
  urgent: [
    'срочно',
    'очень важно',
    'нужен менеджер',
    'позовите менеджера',
    'хочу поговорить с человеком',
    'живой менеджер',
    'свяжите с менеджером'
  ]
};

/**
 * Проверяет, требуется ли эскалация к менеджеру
 */
export function checkIfNeedsManager(message: string): {
  needsManager: boolean;
  reason: string;
  category: string;
} {
  const lowerMessage = message.toLowerCase();

  // Проверяем каждую категорию триггеров
  for (const [category, triggers] of Object.entries(ESCALATION_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lowerMessage.includes(trigger)) {
        return {
          needsManager: true,
          reason: getReasonText(category),
          category
        };
      }
    }
  }

  return {
    needsManager: false,
    reason: '',
    category: ''
  };
}

/**
 * Получает текст причины эскалации
 */
function getReasonText(category: string): string {
  const reasons = {
    order: '🛒 Клиент готов оформить заказ',
    waitlist: '📝 Запись в лист ожидания',
    access: '🔐 Проблема с доступом к личному кабинету',
    program: '📋 Запрос детальной программы курса',
    installment: '💳 Вопрос о рассрочке',
    business: '🏢 Оплата от ИП/юридического лица',
    urgent: '🚨 Срочный вопрос'
  };

  return reasons[category] || '❓ Требуется помощь менеджера';
}

/**
 * Формирует сообщение для менеджера
 */
export function formatManagerNotification(
  clientName: string,
  clientId: string,
  clientMessage: string,
  reason: string,
  category: string
): string {
  const emoji = getCategoryEmoji(category);

  return `${emoji} *ТРЕБУЕТСЯ ПОМОЩЬ МЕНЕДЖЕРА*

*Причина:* ${reason}
*Клиент:* ${clientName}
*ID:* \`${clientId}\`

*Сообщение клиента:*
"${clientMessage}"

*Действие:* Свяжитесь с клиентом в Telegram

⏰ Время: ${new Date().toLocaleString('ru-RU')}

#эскалация #${category}`;
}

/**
 * Получает эмодзи для категории
 */
function getCategoryEmoji(category: string): string {
  const emojis = {
    order: '🛒',
    waitlist: '📝',
    access: '🔐',
    program: '📋',
    installment: '💳',
    business: '🏢',
    urgent: '🚨'
  };

  return emojis[category] || '❓';
}

/**
 * Формирует ответ для клиента при эскалации
 */
export function getClientEscalationResponse(category: string): string {
  const responses = {
    order: `Отлично! Я вижу, что вы готовы оформить заказ! 🎉

Я уже передала вашу заявку менеджеру Наталье (${MANAGER_TELEGRAM}). Она свяжется с вами в ближайшее время для оформления заказа и ответит на все вопросы.

Обычно менеджер отвечает в течение 15-30 минут в рабочее время.

Если вопрос срочный, можете написать Наталье напрямую: ${MANAGER_TELEGRAM}`,

    waitlist: `Понимаю, вы хотите записаться в лист ожидания! 📝

Я передала вашу заявку менеджеру Наталье (${MANAGER_TELEGRAM}). Она внесет вас в список и сообщит о ближайших датах курса.

Менеджер свяжется с вами в ближайшее время.`,

    access: `Вижу, у вас проблема с доступом 🔐

Это действительно требует помощи менеджера. Я уже уведомила Наталью (${MANAGER_TELEGRAM}) о вашей проблеме.

Она поможет восстановить доступ в кратчайшие сроки. Обычно такие вопросы решаются в течение 30 минут.`,

    program: `Вам нужна подробная программа курса 📋

Отличный вопрос! Я передала ваш запрос менеджеру Наталье (${MANAGER_TELEGRAM}). Она вышлет вам детальную программу с расписанием и всеми модулями.

Ожидайте ответа в ближайшее время!`,

    installment: `Понимаю, вас интересует рассрочка 💳

У нас действительно есть варианты оплаты частями! Я уже передала ваш запрос менеджеру Наталье (${MANAGER_TELEGRAM}).

Она расскажет о доступных вариантах рассрочки и поможет подобрать удобный график платежей.`,

    business: `Вам нужна оплата от юридического лица 🏢

Конечно, мы работаем с ИП и ООО! Я передала ваш запрос менеджеру Наталье (${MANAGER_TELEGRAM}).

Она подготовит все необходимые документы: договор, счет на оплату, акты. Обычно документы готовятся в течение часа.`,

    urgent: `Понимаю, ваш вопрос требует срочного решения! 🚨

Я немедленно уведомила менеджера Наталью (${MANAGER_TELEGRAM}) о вашем обращении.

Она свяжется с вами в ближайшие минуты. Если вопрос критически срочный, можете написать ей напрямую: ${MANAGER_TELEGRAM}`
  };

  return responses[category] || `Ваш вопрос требует участия менеджера.

Я уже передала информацию Наталье (${MANAGER_TELEGRAM}). Она свяжется с вами в ближайшее время.

Если вопрос срочный, можете написать напрямую: ${MANAGER_TELEGRAM}`;
}

/**
 * Проверяет, был ли клиент уже эскалирован недавно
 */
export function wasRecentlyEscalated(
  clientId: string,
  escalationHistory: Map<string, Date>
): boolean {
  const lastEscalation = escalationHistory.get(clientId);
  if (!lastEscalation) return false;

  // Не эскалировать чаще чем раз в 30 минут
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return lastEscalation > thirtyMinutesAgo;
}

/**
 * Определяет приоритет эскалации
 */
export function getEscalationPriority(category: string): 'high' | 'medium' | 'low' {
  const highPriority = ['order', 'urgent', 'access'];
  const mediumPriority = ['installment', 'business', 'waitlist'];

  if (highPriority.includes(category)) return 'high';
  if (mediumPriority.includes(category)) return 'medium';
  return 'low';
}

/**
 * Проверяет рабочее время для эскалации
 */
export function isWorkingHours(): boolean {
  const now = new Date();
  const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
  const hour = moscowTime.getHours();
  const day = moscowTime.getDay();

  // Рабочие часы: пн-пт 9:00-19:00, сб 10:00-16:00 по Москве
  if (day === 0) return false; // Воскресенье
  if (day === 6) return hour >= 10 && hour < 16; // Суббота
  return hour >= 9 && hour < 19; // Будни
}

/**
 * Формирует дополнительное сообщение для нерабочего времени
 */
export function getNonWorkingHoursMessage(): string {
  return `\n\n⏰ *Обратите внимание:* Сейчас нерабочее время. Менеджер ответит вам в начале следующего рабочего дня.

*График работы:*
Пн-Пт: 9:00-19:00
Сб: 10:00-16:00
Вс: выходной
(время московское)`;
}
