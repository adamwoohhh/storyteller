import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("paste mode runs character extraction and storyboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "粘贴完整故事" }).click();
  await page
    .getByLabel("完整故事")
    .fill("从前小红和小蓝在森林里走着。后来他们遇到了狼。最后大家成了朋友。");
  await page.getByRole("button", { name: "下一步" }).click();

  await expect(page.getByRole("heading", { name: "确认角色" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "继续 → 分镜" }).click();

  await expect(page.getByRole("heading", { name: "分镜" })).toBeVisible({ timeout: 30_000 });
  const firstText = page.locator("textarea[disabled]").first();
  await expect(firstText).toBeVisible();
});
