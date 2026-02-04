import { test as base, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:8080/api";

// Extend the base test with authenticated context
export const test = base.extend<{
  authenticatedPage: ReturnType<typeof base.extend>;
  adminPage: ReturnType<typeof base.extend>;
  testUser: { email: string; password: string; token: string };
}>({
  // Create a test user and provide credentials
  testUser: async ({ request }, use) => {
    const timestamp = Date.now();
    const email = `e2e_fixture_${timestamp}@example.com`;
    const password = "TestPassword123!";

    // Register the user
    const registerResponse = await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password,
        name: `E2E Fixture User ${timestamp}`,
        role: "STUDENT",
      },
    });

    let token = "";

    if (registerResponse.ok()) {
      // Login to get token
      const loginResponse = await request.post(`${API_URL}/auth/login`, {
        data: { email, password },
      });

      if (loginResponse.ok()) {
        const body = await loginResponse.json();
        token = body.token || "";
      }
    }

    await use({ email, password, token });
  },

  // Authenticated page with stored auth state
  authenticatedPage: async ({ page, testUser }, use) => {
    if (testUser.token) {
      // Set the auth token in localStorage
      await page.goto("/");
      await page.evaluate((token) => {
        localStorage.setItem("token", token);
      }, testUser.token);
    }
    await use(page as any);
  },
});

export { expect };

/**
 * Helper function to login via UI
 */
export async function loginViaUI(
  page: any,
  email: string,
  password: string,
): Promise<boolean> {
  await page.goto("/login");

  const emailInput = page
    .getByLabel(/email/i)
    .or(page.getByPlaceholder(/email/i));
  const passwordInput = page
    .getByLabel(/password/i)
    .or(page.getByPlaceholder(/password/i));

  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.getByRole("button", { name: /login|sign in/i }).click();

    // Wait for navigation away from login page
    await page
      .waitForURL((url: URL) => !url.pathname.includes("login"), {
        timeout: 10000,
      })
      .catch(() => {});

    return !page.url().includes("login");
  }

  return false;
}

/**
 * Helper function to logout
 */
export async function logout(page: any): Promise<void> {
  // Try clicking logout button if visible
  const logoutButton = page.getByRole("button", { name: /logout|sign out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Clear localStorage as fallback
    await page.evaluate(() => {
      localStorage.removeItem("token");
    });
    await page.goto("/login");
  }
}
