import { test, expect, resetE2EData } from "./fixtures";

test.beforeAll(() => resetE2EData());

test("structured input runs through wizard to canvas", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("故事设定").fill("森林深处");
  await page.getByRole("button", { name: "+ 添加角色" }).click();
  await page.getByPlaceholder("名字").fill("小红");
  await page.getByPlaceholder("描述").fill("勇敢的小女孩");
  await page.getByLabel("起始剧情").fill("她踏上旅程");
  await page.getByRole("button", { name: "下一步" }).click();

  await expect(page.getByRole("heading", { name: "故事文本" })).toBeVisible();
  await page.getByRole("button", { name: "继续 → 分镜" }).click({ timeout: 30_000 });

  await expect(page.getByRole("heading", { name: "分镜" })).toBeVisible();
  await page.getByRole("button", { name: "继续 → 画风" }).click({ timeout: 30_000 });

  await page.getByText("水彩绘本").click();
  await page.getByRole("button", { name: /确认 → CDS/ }).click();

  await expect(page.getByRole("heading", { name: "Character Design Sheet" })).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: /生成参考图/ }).first().click();
  await expect(page.getByText("已采纳").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "开始生成插图" }).click();

  await expect(page.getByRole("button", { name: "阅读态" })).toBeVisible({ timeout: 60_000 });
});
