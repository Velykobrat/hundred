
import type { Node, LayoutItem } from "../types/node";
import { createTreemap } from "../lib/treemap";
import { remaining } from "../lib/document";
import { formatNumber, formatPercent, getNodeColor } from "../lib/format";

export default function Treemap({ node, onOpen }: { node: Node; onOpen: (node: Node) => void }) {
  const totalValue = node.value;
  const free = remaining(node);
  const items: LayoutItem[] = node.children.map((child) => ({ node: child, x: 0, y: 0, width: 0, height: 0 }));
  if (free > 0) items.push({ node: { id: "__remaining__", name: "Вільно", value: free, unit: node.unit, children: [] }, x: 0, y: 0, width: 0, height: 0, isRemaining: true });
  const layout = createTreemap(items);
  return (
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
                const percent = (node.value / totalValue) * 100;

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
                    aria-label={`${node.name}: ${formatNumber(node.value)} ${node.unit}, ${formatPercent(node.value / totalValue * 100)}${isRemaining ? "" : ". Відкрити частину"}`}
                    title={`${node.name} · ${formatNumber(node.value)} ${node.unit}`}
                    onClick={() => {
                      if (!isRemaining) {
                        onOpen(node);
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

  );
}

