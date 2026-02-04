import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application before each test
    await page.goto("/");
  });

  test("should display login page", async ({ page }) => {
    // Wait for the login page to load
    await expect(page).toHaveURL(/.*login.*/i);

    // Check for login form elements
    await expect(
      page.getByRole("heading", { name: /login|sign in/i }),
    ).toBeVisible();
  });

  test("should show validation errors for empty form submission", async ({
    page,
  }) => {
    // Wait for login page
    await page.waitForURL(/.*login.*/i);

    // Find and click the login button without filling form
    const loginButton = page.getByRole("button", { name: /login|sign in/i });

    if (await loginButton.isVisible()) {
      await loginButton.click();

      // Should show validation error
      await expect(page.getByText(/required|email|password/i)).toBeVisible();
    }
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Wait for login page
    await page.waitForURL(/.*login.*/i);

    // Fill in invalid credentials
    const emailInput = page
      .getByLabel(/email/i)
      .or(page.getByPlaceholder(/email/i));
    const passwordInput = page
      .getByLabel(/password/i)
      .or(page.getByPlaceholder(/password/i));

    if (await emailInput.isVisible()) {
      await emailInput.fill("invalid@example.com");
      await passwordInput.fill("wrongpassword");

      // Submit the form
      await page.getByRole("button", { name: /login|sign in/i }).click();

      // Wait for error message
      await expect(
        page.getByText(/invalid|incorrect|failed|error/i),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("should have Google login option", async ({ page }) => {
    // Wait for login page
    await page.waitForURL(/.*login.*/i);

    // Check for Google OAuth button
    const googleButton = page
      .getByRole("button", { name: /google/i })
      .or(page.locator('button:has-text("Google")'))
      .or(page.locator('[aria-label*="Google"]'));

    await expect(googleButton).toBeVisible();
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing dashboard without auth", async ({
    page,
  }) => {
    // Try to access protected route directly
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/i);
  });

  test("should redirect to login when accessing courses without auth", async ({
    page,
  }) => {
    // Try to access protected route directly
    await page.goto("/courses");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/i);
  });

  test("should redirect to login when accessing users without auth", async ({
    page,
  }) => {
    // Try to access protected route directly
    await page.goto("/users");

    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/i);
  });
});
