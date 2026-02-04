import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("should load the application", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/); // Should have some title
  });

  test("should have working navigation links on login page", async ({
    page,
  }) => {
    await page.goto("/login");

    // Check for register link if it exists
    const registerLink = page.getByRole("link", { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/i);
    }
  });

  test("should display responsive design", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator("body")).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("should handle 404 pages gracefully", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-12345");

    // Should either redirect to login or show 404 page (not crash)
    const status = response?.status();
    expect(status).toBeDefined();
    expect(page.locator("body")).toBeVisible();
  });

  test("should not show console errors on page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out expected errors (like failed API calls when not authenticated)
    const criticalErrors = errors.filter(
      (error) => !error.includes("401") && !error.includes("Unauthorized"),
    );

    expect(criticalErrors.length).toBe(0);
  });
});
