"use client";

import { useMemo, useState, type FormEvent } from "react";

import type { LayoutItem, Node } from "../src/types/node";
import { findNodeById, updateNodeById } from "../src/lib/tree";
import { createTreemap } from "../src/lib/treemap";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ef4444",
  "#3b82f6",
  "#a855f7",
  "#10b981",
];

function getNodeColor(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  return COLORS[Math.abs(hash) % COLORS.length];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export default function Home() {
  const [root, setRoot] = useState<Node | null>(null);
  const [pathIds, setPathIds] = useState<string[]>([]);

  const [rootName, setRootName] = useState("");
  const [rootValue, setRootValue] = useState("");
  const [rootUnit, setRootUnit] = useState("");

  const [childName, setChildName] = useState("");
  const [childValue, setChildValue] = useState("");

  const current = useMemo(() => {
    if (!root) {
      return null;
    }

    const currentId =
      pathIds[pathIds.length - 1] ?? root.id;

    return findNodeById(root, currentId);
  }, [root, pathIds]);

  const path = useMemo(() => {
    if (!root) {
      return [];
    }

    return pathIds
      .map((id) => findNodeById(root, id))
      .filter((node): node is Node => node !== null);
  }, [root, pathIds]);

  function createRoot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number(rootValue);

    if (
      !rootName.trim() ||
      !rootUnit.trim() ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    const newRoot: Node = {
      id: crypto.randomUUID(),
      name: rootName.trim(),
      value,
      unit: rootUnit.trim(),
      children: [],
    };

    setRoot(newRoot);
    setPathIds([newRoot.id]);

    setRootName("");
    setRootValue("");
    setRootUnit("");
  }

  function openNode(node: Node) {
    setPathIds((previous) => [...previous, node.id]);
  }

  function goToLevel(index: number) {
    setPathIds((previous) =>
      previous.slice(0, index + 1)
    );
  }

  if (!root) {
    return (
      <main className="min-h-screen bg-neutral-950 px-5 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
            Hundred
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Створи свої 100%
          </h1>

          <p className="mt-3 leading-relaxed text-neutral-400">
            Вкажи ціле. Це може бути бюджет, час, площа,
            люди, пам&apos;ять або будь-яка інша величина.
          </p>

          <form
            onSubmit={createRoot}
            className="mt-10 space-y-5 rounded-[28px] border border-white/10 bg-neutral-900 p-6"
          >
            <div>
              <label className="mb-2 block text-sm text-neutral-400">
                Назва
              </label>

              <input
                value={rootName}
                onChange={(event) =>
                  setRootName(event.target.value)
                }
                placeholder="Наприклад: Місячний бюджет"
                className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-[1fr_120px] gap-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Значення
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={rootValue}
                  onChange={(event) =>
                    setRootValue(event.target.value)
                  }
                  placeholder="1000"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Одиниця
                </label>

                <input
                  value={rootUnit}
                  onChange={(event) =>
                    setRootUnit(event.target.value)
                  }
                  placeholder="грн"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-white/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200"
            >
              Створити 100%
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!current) {
    return null;
  }

  const children = current.children;

  const usedValue = children.reduce(
    (sum, child) => sum + child.value,
    0
  );

  const remainingValue = Math.max(
    current.value - usedValue,
    0
  );

  const usedPercent =
    current.value > 0
      ? (usedValue / current.value) * 100
      : 0;

  const rawLayoutItems: LayoutItem[] = children.map(
    (node) => ({
      node,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
  );

  if (remainingValue > 0) {
    rawLayoutItems.push({
      node: {
        id: "__remaining__",
        name: "Вільно",
        value: remainingValue,
        unit: current.unit,
        children: [],
      },
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      isRemaining: true,
    });
  }

  const layout = createTreemap(rawLayoutItems);

  function addChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!current) {
      return;
    }

    const value = Number(childValue);

    if (
      !childName.trim() ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return;
    }

    if (value > remainingValue) {
      alert(
        `Доступно лише ${formatNumber(
          remainingValue
        )} ${current.unit}`
      );

      return;
    }

    const newChild: Node = {
      id: crypto.randomUUID(),
      name: childName.trim(),
      value,
      unit: current.unit,
      children: [],
    };

    setRoot((previousRoot) => {
      if (!previousRoot) {
        return previousRoot;
      }

      return updateNodeById(
        previousRoot,
        current.id,
        (node) => ({
          ...node,
          children: [...node.children, newChild],
        })
      );
    });

    setChildName("");
    setChildValue("");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-white md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          {path.map((node, index) => (
            <div
              key={node.id}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => goToLevel(index)}
                className="transition hover:text-white"
              >
                {node.name}
              </button>

              {index < path.length - 1 && (
                <span className="text-neutral-700">
                  /
                </span>
              )}
            </div>
          ))}
        </nav>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Whole
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-6xl">
              {current.name}
            </h1>

            <p className="mt-3 text-neutral-400">
              {formatNumber(current.value)}{" "}
              {current.unit}

              <span className="mx-2 text-neutral-700">
                ·
              </span>

              100%
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-neutral-500">
              Розподілено
            </p>

            <p className="mt-1 text-2xl font-medium">
              {formatPercent(usedPercent)}
            </p>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-white/10 bg-neutral-900 xl:aspect-auto xl:min-h-[700px]">
            {layout.map(
              ({
                node,
                x,
                y,
                width,
                height,
                isRemaining,
              }) => {
                const percent =
                  (node.value / current.value) * 100;

                const area = width * height;

                const showFullInfo =
                  !isRemaining && area >= 650;

                const showCompactInfo =
                  !isRemaining &&
                  area >= 250 &&
                  area < 650;

                const color = isRemaining
                  ? "#171717"
                  : getNodeColor(node.id);

                return (
                  <button
                    key={node.id}
                    type="button"
                    disabled={isRemaining}
                    onClick={() => {
                      if (!isRemaining) {
                        openNode(node);
                      }
                    }}
                    className={`group absolute overflow-hidden border border-neutral-950/80 text-left transition-all duration-300 ${
                      isRemaining
                        ? "cursor-default"
                        : "cursor-pointer hover:z-20 hover:brightness-110"
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      backgroundColor: color,
                    }}
                  >
                    {isRemaining && area >= 500 && (
                      <div className="flex h-full flex-col justify-between p-4 text-neutral-600 md:p-6">
                        <span className="text-sm">
                          {formatPercent(percent)}
                        </span>

                        <div>
                          <p className="font-medium">
                            Вільно
                          </p>

                          <p className="mt-1 text-xs">
                            {formatNumber(node.value)}{" "}
                            {node.unit}
                          </p>
                        </div>
                      </div>
                    )}

                    {showFullInfo && (
                      <div className="flex h-full flex-col justify-between p-4 md:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm text-white/75">
                            {formatPercent(percent)}
                          </span>

                          <span className="text-white/50 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white">
                            ↗
                          </span>
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold tracking-tight md:text-2xl">
                            {node.name}
                          </h2>

                          <p className="mt-1 text-sm text-white/70">
                            {formatNumber(node.value)}{" "}
                            {node.unit}
                          </p>
                        </div>
                      </div>
                    )}

                    {showCompactInfo && (
                      <div className="flex h-full flex-col justify-between p-3">
                        <span className="text-xs text-white/75">
                          {formatPercent(percent)}
                        </span>

                        <p className="truncate text-sm font-medium">
                          {node.name}
                        </p>
                      </div>
                    )}
                  </button>
                );
              }
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-neutral-900 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                Add part
              </p>

              <h2 className="mt-3 text-xl font-medium">
                Додати частину
              </h2>

              <form
                onSubmit={addChild}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm text-neutral-500">
                    Назва
                  </label>

                  <input
                    value={childName}
                    onChange={(event) =>
                      setChildName(event.target.value)
                    }
                    placeholder="Наприклад: Оренда"
                    className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-500">
                    Значення
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={remainingValue}
                      step="any"
                      value={childValue}
                      onChange={(event) =>
                        setChildValue(event.target.value)
                      }
                      placeholder={`До ${formatNumber(
                        remainingValue
                      )}`}
                      className="w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 pr-16 outline-none transition focus:border-white/30"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neutral-600">
                      {current.unit}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={remainingValue <= 0}
                  className="w-full rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  Додати
                </button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Розподілено
                  </span>

                  <span>
                    {formatNumber(usedValue)}{" "}
                    {current.unit}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 text-sm">
                  <span className="text-neutral-500">
                    Залишилось
                  </span>

                  <span>
                    {formatNumber(remainingValue)}{" "}
                    {current.unit}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-neutral-900 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Structure
                  </p>

                  <h2 className="mt-2 text-xl font-medium">
                    Структура
                  </h2>
                </div>

                <span className="text-sm text-neutral-500">
                  {children.length}
                </span>
              </div>

              {children.length === 0 ? (
                <p className="mt-6 text-sm leading-relaxed text-neutral-600">
                  Додай першу частину. Її площа автоматично
                  відповідатиме частці від поточних 100%.
                </p>
              ) : (
                <div className="mt-6 space-y-2">
                  {children.map((child) => {
                    const percent =
                      (child.value / current.value) * 100;

                    const color =
                      getNodeColor(child.id);

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() =>
                          openNode(child)
                        }
                        className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/5"
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-[5px]"
                          style={{
                            backgroundColor: color,
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-neutral-200">
                            {child.name}
                          </p>

                          <p className="mt-0.5 text-xs text-neutral-600">
                            {formatNumber(
                              child.value
                            )}{" "}
                            {child.unit}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm">
                            {formatPercent(percent)}
                          </p>

                          <p className="text-xs text-neutral-700 transition group-hover:text-neutral-400">
                            ↗
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {remainingValue > 0 && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3 px-2">
                    <span className="h-4 w-4 shrink-0 rounded-[5px] border border-white/10 bg-neutral-950" />

                    <div className="flex-1 text-sm text-neutral-600">
                      Вільно
                    </div>

                    <span className="text-sm text-neutral-600">
                      {formatPercent(
                        (remainingValue /
                          current.value) *
                          100
                      )}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}