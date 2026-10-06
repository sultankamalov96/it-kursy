/**
 * Google Apps Script — приём заявок с сайта в Google Таблицу.
 *
 * Установка (подробно — в README.md):
 *  1. Создайте Google Таблицу → Расширения → Apps Script.
 *  2. Вставьте этот код вместо содержимого Code.gs и сохраните.
 *  3. Выберите функцию setup → «Выполнить» (один раз; разрешите доступ).
 *  4. «Начать развёртывание» → «Новое развёртывание» → тип «Веб-приложение»,
 *     «Запуск от имени»: Я, «У кого есть доступ»: Все → «Развернуть».
 *  5. Скопируйте ссылку веб-приложения (…/exec) в data.js → googleScriptUrl.
 */

const SHEET_NAME = 'Заявки';
const HEADERS = ['Дата', 'Имя', 'Телефон', 'Направление', 'Комментарий', 'Статус', 'Заметка', 'Страница'];
const STATUSES = ['Новая', 'В работе', 'Записан', 'Отказ'];
const DUPLICATE_MINUTES = 10; // повторная заявка с того же телефона за это время не записывается

/** Один раз: создаёт лист, заголовки, список статусов и цвета */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#16295E').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, HEADERS.length, 160);
  sheet.setColumnWidth(5, 320);
  sheet.setColumnWidth(7, 260);

  // Выпадающий список статусов
  const statusCol = HEADERS.indexOf('Статус') + 1;
  const range = sheet.getRange(2, statusCol, sheet.getMaxRows() - 1, 1);
  range.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());

  // Цвет строки по статусу
  const colors = { 'Новая': '#FEF1E6', 'В работе': '#EAF1FD', 'Записан': '#EAF6ED', 'Отказ': '#EEEEEE' };
  const L = String.fromCharCode(64 + statusCol);
  const full = sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length);
  sheet.setConditionalFormatRules(Object.keys(colors).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + L + '2="' + s + '"')
      .setBackground(colors[s]).setRanges([full]).build();
  }));
}

/** Приём заявки с сайта */
function doPost(e) {
  const p = (e && e.parameter) || {};

  // Бот заполнил скрытое поле — отвечаем «ок» и ничего не пишем
  if (p.website) return json({ ok: true });

  const name = clean(p.name, 100);
  const phone = clean(p.phone, 30);
  const course = clean(p.course, 100);
  const message = clean(p.message, 1000);
  const page = clean(p.page, 300);

  const phoneDigits = phone.replace(/\D/g, '');
  if (name.length < 2) return json({ ok: false, error: 'Введите имя — от 2 до 100 символов.' });
  if (phoneDigits.length < 9 || phoneDigits.length > 15) return json({ ok: false, error: 'Введите номер телефона, например +996 700 123 456.' });

  // Защита от повторной отправки и спама с одного номера
  const cache = CacheService.getScriptCache();
  const key = 'lead_' + phoneDigits;
  if (cache.get(key)) return json({ ok: true, duplicate: true });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: false, error: 'Таблица не настроена. Сообщите нам по телефону или в WhatsApp.' });
    sheet.appendRow([new Date(), safe(name), safe(phone), safe(course || 'не выбрано'), safe(message), 'Новая', '', safe(page)]);
    cache.put(key, '1', DUPLICATE_MINUTES * 60);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Не удалось сохранить заявку. Попробуйте ещё раз или напишите нам в WhatsApp.' });
  } finally {
    lock.releaseLock();
  }
}

/** Проверка, что веб-приложение работает: откройте ссылку …/exec в браузере */
function doGet() {
  return json({ ok: true, message: 'Приём заявок работает' });
}

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max);
}

/** Значения, начинающиеся с = + - @, таблица считает формулами — делаем их текстом */
function safe(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
