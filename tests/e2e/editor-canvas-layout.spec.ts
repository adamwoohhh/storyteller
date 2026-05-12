import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("editor canvas default node positions do not overlap", async ({ page, request }) => {
  const create = await request.post("/api/stories", {
    data: {
      inputMode: "paste",
      storyText: "第一段。第二段。第三段。第四段。第五段。第六段。",
      characters: [],
    },
  });
  const { id } = await create.json();
  await request.post(`/api/stories/${id}/storyboard`, { data: { targetMin: 6, targetMax: 6 } });

  await page.goto(`/s/${id}?mode=edit`);
  const cards = page.locator(".react-flow__node-story");
  await expect(cards).toHaveCount(6, { timeout: 30_000 });

  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }),
  );

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const overlaps =
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      expect(overlaps, `node ${i + 1} overlaps node ${j + 1}`).toBe(false);
    }
  }
});

test("editor canvas reflows persisted legacy dense node positions", async ({ page, request }) => {
  const create = await request.post("/api/stories", {
    data: {
      inputMode: "paste",
      storyText: "第一段。第二段。第三段。第四段。第五段。第六段。",
      characters: [],
    },
  });
  const { id } = await create.json();
  await request.post(`/api/stories/${id}/storyboard`, { data: { targetMin: 6, targetMax: 6 } });
  await expect
    .poll(async () => {
      const response = await request.get(`/api/stories/${id}`);
      const bundle = await response.json();
      return bundle.nodes.length;
    })
    .toBe(6);
  const bundle = await (await request.get(`/api/stories/${id}`)).json();
  const createdNodes = bundle.nodes as { id: string }[];

  await Promise.all(
    createdNodes.map((node: { id: string }, index: number) =>
      request.patch(`/api/nodes/${node.id}`, {
        data: {
          positionX: (index % 3) * 344,
          positionY: Math.floor(index / 3) * 524,
        },
      }),
    ),
  );

  await page.goto(`/s/${id}?mode=edit`);
  const cards = page.locator(".react-flow__node-story");
  await expect(cards).toHaveCount(6, { timeout: 30_000 });

  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }),
  );

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const overlaps =
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      expect(overlaps, `node ${i + 1} overlaps node ${j + 1}`).toBe(false);
    }
  }
});
