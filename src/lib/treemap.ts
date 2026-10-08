import type { LayoutItem } from "../types/node";

function splitNearHalf(items: LayoutItem[]) {
  const total = items.reduce(
    (sum, item) => sum + item.node.value,
    0
  );

  let running = 0;
  let bestIndex = 1;
  let bestDifference = Infinity;

  for (let i = 1; i < items.length; i++) {
    running += items[i - 1].node.value;

    const difference = Math.abs(total / 2 - running);

    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = i;
    }
  }

  return [
    items.slice(0, bestIndex),
    items.slice(bestIndex),
  ];
}

export function createTreemap(
  items: LayoutItem[],
  x = 0,
  y = 0,
  width = 100,
  height = 100
): LayoutItem[] {
  if (items.length === 0) {
    return [];
  }

  if (items.length === 1) {
    return [
      {
        ...items[0],
        x,
        y,
        width,
        height,
      },
    ];
  }

  const [groupA, groupB] = splitNearHalf(items);

  const totalA = groupA.reduce(
    (sum, item) => sum + item.node.value,
    0
  );

  const totalB = groupB.reduce(
    (sum, item) => sum + item.node.value,
    0
  );

  const total = totalA + totalB;

  if (total <= 0) {
    return [];
  }

  const ratioA = totalA / total;

  if (width >= height) {
    const widthA = width * ratioA;

    return [
      ...createTreemap(
        groupA,
        x,
        y,
        widthA,
        height
      ),

      ...createTreemap(
        groupB,
        x + widthA,
        y,
        width - widthA,
        height
      ),
    ];
  }

  const heightA = height * ratioA;

  return [
    ...createTreemap(
      groupA,
      x,
      y,
      width,
      heightA
    ),

    ...createTreemap(
      groupB,
      x,
      y + heightA,
      width,
      height - heightA
    ),
  ];
}