import { useId, useState } from "react";
import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";

const steps = [
  ["Створи ціле", "Назви команду, проєкт, бюджет або час. Без кількості це структура чи список; з кількістю та одиницею — вимірюване ціле."],
  ["Додай частини", "У структурі достатньо назви. У вимірюваному цілому частини мають ту саму одиницю й можуть задаватися кількістю або відсотком."],
  ["Відкривай глибше", "Відкрий будь-яку частину як нове ціле та додай до неї власні частини."],
  ["Переміщуйся між рівнями", "Кнопка «На рівень вище» повертає до батьківської частини. У «Рівнях» можна перейти до цілого, іншого предка або сусідньої частини."],
  ["Керуй змінами", "Меню «⋯» відкриває редагування та видалення. Стрілки у верхній панелі вкладки «Ціле» скасовують і повторюють зміни."],
  ["Змінюй порядок", "Натисни картку, щоб відкрити її; утримуй, щоб змінити порядок. Меню «⋯» відкриває дії цілого або частини."],
  ["Збережи резервну копію", "У Налаштуваннях завантаж копію для перенесення на інший пристрій. Імпорт додає цілі до наявних."],
  ["Дані на цьому пристрої", "Hundred зберігає дані в цьому браузері та може працювати офлайн після завантаження."],
] as const;

export default function BeginnerGuide() {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return <section className="surface settings-section beginner-guide" aria-labelledby="guide-heading">
    <h2 id="guide-heading"><button type="button" className="beginner-guide-toggle" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(!open)}><span>{t("Як користуватися Hundred")}</span><Icon name="chevron" /></button></h2>
    <div id={contentId} className="guide-content" hidden={!open}>
      <p>{t("Ціле → частини → нове ціле. Наприклад: команда → відділ → учасники.")}</p>
      <ol>{steps.map(([title, description]) => <li key={title}><h3>{t(title)}</h3><p>{t(description)}</p></li>)}</ol>
      <p className="guide-level-hint">{t("Кількість рівнів на картці — найбільша глибина цілого. Саме ціле є першим рівнем.")}</p>
    </div>
  </section>;
}
