import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("single node regenerate from canvas", async ({ page, request }) => {
  const create = await request.post("/api/stories", {
    data: {
      inputMode: "paste",
      storyText: "段一。段二。段三。",
      characters: [],
    },
  });
  const { id } = await create.json();
  await request.post(`/api/stories/${id}/storyboard`, { data: { targetMin: 3, targetMax: 3 } });
  await page.waitForTimeout(1500);
  await request.post(`/api/stories/${id}/cds`, {
    data: { artStyleKey: "watercolor-picturebook", artStylePrompt: "watercolor" },
  });
  await page.waitForTimeout(1500);
  await request.post(`/api/stories/${id}/render-all`);
  await page.waitForTimeout(3000);

  await page.goto(`/s/${id}?mode=edit`);
  const button = page.getByRole("button", { name: "重生图" }).first();
  await expect(button).toBeVisible({ timeout: 30_000 });
  await button.click();
});
