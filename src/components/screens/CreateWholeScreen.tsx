import { MAX_DOCUMENTS } from "../../lib/collection";
import { usePreferences } from "../../lib/use-preferences";
import type { NodeColor } from "../../lib/node-color";
import type { NodeIcon } from "../../lib/node-icon";
import NodeForm from "../NodeForm";
type Props = { count: number; onCancel: () => void; onSubmit: (name: string, value: number | undefined, unit: string, color?: NodeColor, icon?: NodeIcon) => string | void };
export default function CreateWholeScreen({ count, onCancel, onSubmit }: Props) {
  const { t } = usePreferences();
  return (
          <section className="create-resource">
            <header className="screen-heading"><p className="eyebrow">{t("Почни з цілого")}</p><h1>{t("Нове ціле")}</h1><p>{t("Назви ціле, наприклад команду, проєкт, бюджет або час.")}</p></header>
            {count >= MAX_DOCUMENTS ? <div className="surface p-6"><p>{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("цілих. Звільни місце, перш ніж створювати нове.")}</p><button type="button" className="primary-button mt-5" onClick={onCancel}>{t("Мої цілі")}</button></div> : <div className="surface p-5 sm:p-7">
              <NodeForm createWhole submitLabel={t("Створити ціле")} onCancel={onCancel} onSubmit={onSubmit} />
            </div>}
          </section>
  );
}
