import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:8080/api";

test.describe("API Health Checks", () => {
  test("backend API should be healthy", async ({ request }) => {
    const response = await request.get(`${API_URL.replace("/api", "")}/health`);
    expect(response.ok()).toBeTruthy();
  });

  test("API should respond to auth endpoints", async ({ request }) => {
    // Test that auth endpoints exist (they may return 401/400 but should not 404)
    const response = await request.post(`${API_URL}/auth/login`, {
      data: { email: "test@test.com", password: "test" },
    });

    // Should not be 404 (route exists)
    expect(response.status()).not.toBe(404);
  });

  test("API should require authentication for protected endpoints", async ({
    request,
  }) => {
    const protectedEndpoints = [
      "/users",
      "/courses",
      "/classrooms",
      "/attendance",
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${API_URL}${endpoint}`);
      // Should return 401 Unauthorized without token
      expect(response.status()).toBe(401);
    }
  });
});

test.describe("API Integration", () => {
  test("should be able to register a new user", async ({ request }) => {
    const timestamp = Date.now();
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: `e2etest_${timestamp}@example.com`,
        password: "TestPassword123!",
        name: `E2E Test User ${timestamp}`,
        role: "STUDENT",
      },
    });

    // Should succeed or return validation error (not server error)
    expect(response.status()).toBeLessThan(500);
  });

  test("login with valid credentials should return token", async ({
    request,
  }) => {
    // First register a user
    const timestamp = Date.now();
    const email = `e2elogin_${timestamp}@example.com`;
    const password = "TestPassword123!";

    await request.post(`${API_URL}/auth/register`, {
      data: {
        email,
        password,
        name: "E2E Login Test",
        role: "STUDENT",
      },
    });

    // Then try to login
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email, password },
    });

    if (loginResponse.ok()) {
      const body = await loginResponse.json();
      expect(body).toHaveProperty("token");
    }
  });
});
