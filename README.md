# Hundred

**Hundred — система опису Цілого через Частини, де кожна Частина може стати новим Цілим.**

Створи Ціле, за бажанням задай вимірювану кількість, поділи його на Частини та відкрий будь-яку Частину як нове Ціле.

**ЦІЛЕ → ЧАСТИНИ → НОВЕ ЦІЛЕ → ЧАСТИНИ → …**

[Відкрити Hundred](https://hundred-pearl-ten.vercel.app)

## Дві форми цілого

**Вимірюване ціле** має додатну кількість та одиницю: бюджет 50 000 грн, тиждень 168 год, квартира 80 m². Частини вводяться як обсяг або відсоток поточного цілого. Вони мають ту саму одиницю, а їхня сума не перевищує ціле. Пропорційна карта показує частини та залишок.

**Структурне ціле** потребує лише назви: компанія, команда, проєкт або список. Залиш кількість порожньою. Частини показано рівними картками або компактним списком, без штучних відсотків чи залишку. Видно кількість прямих частин, усіх вкладених частин та рівнів. Внутрішня вага структурного вузла за замовчуванням дорівнює 1.

Тип задається для кожного вузла окремо. Наприклад: Компанія (структура) → Відділ (структура) → Бюджет відділу (100 000 грн) → Оренда (40 000 грн). Структурне ціле може містити обидва типи частин. Вимірюване ціле містить лише вимірювані частини з тією самою одиницею.

## Як користуватися

1. Натисни **«Нове ціле»**, введи назву. Кількість необов’язкова.
2. Якщо кількість задана, обери одиницю зі списку або **«Своя одиниця»**. Одиниці зберігаються як довільні рядки; готовий список лише допомагає введенню.
3. Натисни **«Додати частину»**. У структурі достатньо назви; можна додати кількість та власну одиницю. У вимірюваному цілому введи обсяг або відсоток.
4. Відкрий будь-яку частину як нове ціле. Навігація зберігає шлях та дозволяє переходити до предків і сусідніх частин.
5. Меню **«⋯»** дозволяє редагувати, копіювати ціле або видаляти. Верхня панель скасовує та повторює зміни.

Редагування зберігає тип вузла: структурному можна змінити назву, вимірюваному — назву та кількість із перевіркою вкладених частин і доступного обсягу батька. Зміна типу та одиниці вже створеного вузла в цій версії не підтримується.

Під час створення або редагування можна вибрати один із 12 кольорів та 15 значків. Автоматичний колір і стандартний значок залишають попередню поведінку. Оформлення зберігається як необов’язкові атрибути вузла у форматі v3, переноситься через резервні копії та підтримує undo/redo. Значки можна вибирати клавіатурою; активний підсвічується обраним кольором.

Для структурних цілих перемикач **«Картки / Список»** змінює лише подання. Обраний вигляд зберігається з налаштуваннями браузера та не впливає на дерево чи історію змін. Вимірювані цілі продовжують використовувати пропорційну карту.

Вкладки **«Головна»**, **«Ціле»**, **«Налаштування»** та відкритий шлях відновлюються після перезавантаження. Українська/англійська мова та темна/світла/системна тема зберігаються окремо. Назви та одиниці користувача не перекладаються. На ПК карта та список розташовані поруч; на телефоні список під картою. Форми доступні з клавіатури.

## Збереження та резервні копії

Дані автоматично зберігаються у localStorage поточного браузера та домену. Облікового запису, серверної бази й синхронізації між пристроями немає. Для перенесення або захисту від очищення браузера завантаж JSON-копію в налаштуваннях.

Поточний формат збереження й експорту — **v3**, з явним типом кожного вузла. Підтримуються **v1 → v3**, **v2 → v3**, **v3 → v3**. Усі старі вузли стають вимірюваними; значення, одиниці, ідентифікатори, ієрархія, активне ціле та коректний шлях зберігаються. Некоректний шлях обрізається до останнього наявного предка.

Ключ сховища `hundred.document.v1` залишено для сумісності: старі дані читаються без перенесення вручну; наступне збереження пише v3. Некоректні дані не перезаписуються автоматично. Імпорт додає незалежні копії з новими ідентифікаторами та не замінює наявні цілі.

Введений відсоток перетворюється на абсолютну кількість. Зміна кількості батька не перераховує частини автоматично.

## Технічні межі

До 20 цілих, 5 000 вузлів і 41 рівня в одному дереві. Вимірювані кількості — понад нуль, до 1 000 000 000, з точністю до 6 знаків після коми; допускаються кома та крапка. Назва — до 120 символів, одиниця — до 20. Файл імпорту — до 4 МБ; фактична місткість localStorage залежить від браузера.

## Development

Hundred lets a user create a **Whole**, optionally give it a measurable quantity, split it into **Parts**, and open every Part as a new Whole. Structural wholes need only a name; measured wholes have capacity and arbitrary units. Mixed hierarchies are supported beneath structural parents.

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4. Use Node.js 24.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

```sh
node tests/core.mjs
npm run lint
npm run build
```

Core tests cover measured precision/capacity, structural and mixed trees, v1/v2 migration, v3 roundtrips, import/export, ID regeneration, deletion, path repair, and undo/redo.

- `src/types/node.ts`: discriminated measured/structural node union.
- `src/lib/node-mode.ts`: type guards and layout weight.
- `src/lib/tree.ts`: traversal, parent lookup, descendants and levels.
- `src/lib/document.ts`: creation, validation, tree edits, document codec.
- `src/lib/collection.ts`: collections, migration, backups and copies.
- `src/lib/history.ts`, `use-document.ts`: history and persistence.
- `src/components/`: forms, metadata, navigation, measured treemap and structural cards.
- `src/lib/i18n.ts`: Ukrainian/English UI.
- `app/page.tsx`: workspace integration.
- `tests/core.mjs`: core regression scenarios.

Vercel runs tests, lint and production build before deployment using `vercel.json`.

## Offline / PWA

Production builds include an offline app shell and a Web App Manifest. After one
completed online service-worker installation, Home, Whole, Settings and local
editing/backup workflows can run offline. Install using the browser's menu where
supported. Local data still uses the existing v3 localStorage format.

Updates download in the background and wait until all Hundred tabs/windows close;
a small notice explains when an update is ready. Development mode does not register
the worker. See [PWA implementation and manual QA](docs/pwa.md) for cache policy,
installation requirements, limitations and the complete online/offline/update test.
