"use client";
import { useRef, useState, type ChangeEvent } from "react";
import { decodeCollection, MAX_DOCUMENTS, MAX_FILE_SIZE, type Collection } from "../lib/collection";
import { formatNumber } from "../lib/format";
import Modal from "./Modal";

export default function ImportBackup({ currentCount, onImport, onClose }: { currentCount: number; onImport: (collection: Collection) => string | void; onClose: () => void }) {
  const [incoming, setIncoming] = useState<Collection | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const sequence = useRef(0);
  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const job = ++sequence.current;
    setIncoming(null);
    setError("");
    setFileName(file.name);
    if (file.size > MAX_FILE_SIZE) { setError("Файл завеликий. Вибери копію до 4 МБ."); return; }
    setReading(true);
    try {
      const collection = decodeCollection(await file.text());
      if (sequence.current !== job) return;
      if (!collection.documents.length) throw new Error("У цьому файлі немає збережених розподілів.");
      if (currentCount + collection.documents.length > MAX_DOCUMENTS) throw new Error(`Можна зберегти до ${MAX_DOCUMENTS} розподілів. Спочатку звільни місце.`);
      setIncoming(collection);
    } catch (cause) {
      if (sequence.current === job) setError(cause instanceof Error ? cause.message : "Не вдалося прочитати файл.");
    } finally { if (sequence.current === job) setReading(false); }
  }
  return <Modal title="Імпорт резервної копії" onClose={onClose}>
    <p className="mb-5 text-sm leading-relaxed text-neutral-300">Вибери JSON-копію Hundred. Розподіли з файлу буде додано як окремі копії; наявні залишаться. Підтримуються також копії попередньої версії.</p>
    <label htmlFor="hundred-import-file" className="mb-2 block text-sm text-neutral-300">Файл резервної копії</label>
    <input id="hundred-import-file" type="file" accept=".json,application/json" disabled={reading} onChange={readFile} aria-describedby="hundred-import-hint" className="block w-full rounded-2xl border border-white/15 p-3 text-sm text-neutral-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-black" />
    <p id="hundred-import-hint" className="mt-2 text-xs text-neutral-400">До 4 МБ. Зараз збережено {currentCount} із {MAX_DOCUMENTS} розподілів.</p>
    {reading && <p role="status" className="mt-4 text-sm text-neutral-300">Перевіряю файл…</p>}
    {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
    {incoming && <section className="mt-5 rounded-2xl border border-white/10 p-4">
      <h3 className="break-words text-sm font-medium">{fileName}</h3>
      <p className="mt-1 text-xs text-neutral-400">Буде додано розподілів: {incoming.documents.length}</p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {incoming.documents.map(({ root }) => <li key={root!.id} className="text-sm"><span className="break-words">{root!.name}</span><span className="mt-1 block text-xs text-neutral-400">{formatNumber(root!.value)} {root!.unit}</span></li>)}
      </ul>
    </section>}
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-2xl border border-white/15 px-4 py-3 text-sm hover:bg-white/5">Скасувати</button>
      <button type="button" disabled={!incoming || reading} onClick={() => {
        if (!incoming) return;
        const issue = onImport(incoming);
        if (issue) setError(issue); else onClose();
      }} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40">Додати розподіли</button>
    </div>
  </Modal>;
}
