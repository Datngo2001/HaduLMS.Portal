# Azure CLI Login & Subscription Setup Guide

This guide helps you **log in to Azure CLI**, fix common login errors, and **set the correct subscription** before deploying resources (Azure Container Apps, App Service, etc.).

---

## 1. Check Azure CLI Installation

Make sure Azure CLI is installed:

```bash
az version
```

If not installed:

- Windows: https://aka.ms/installazurecliwindows
- macOS: `brew install azure-cli`
- Linux: https://aka.ms/InstallAzureCLILinux

---

## 2. Login to Azure

### Option A (Recommended – Browser login)

```bash
az login
```

- A browser window will open
- Sign in with your Azure account
- Close the browser after success

---

### Option B (If you have tenant issues)

```bash
az login --tenant <TENANT_ID>
```

Use this if Azure tells you to log in with a specific tenant.

---

### Option C (Device Code – if browser login doesn't work)

```bash
az login --use-device-code
```

- The CLI will display a code and URL
- Open the URL in a browser (on any machine)
- Enter the code when prompted
- Sign in with your Azure account
- Return to the CLI for confirmation

Use this if:

- You can't open a browser on the same machine
- You're on a remote/SSH session
- Browser login fails

---

## 3. Fix: Refresh Token Expired Error

If you see:

```
AADSTS700082: The refresh token has expired due to inactivity
```

Run:

```bash
az logout
az account clear
az login
```

This **fully resets authentication**.

---

## 4. List Available Subscriptions

After login:

```bash
az account list --output table
```

You will see:

- **Name** – Subscription name
- **SubscriptionId** – This is what you use to set active subscription
- **TenantId** – Directory (NOT the same as subscription)

⚠️ **Subscription ID ≠ Tenant ID**

---

## 5. Set Active Subscription

### Option A: Using Subscription ID (recommended)

```bash
az account set --subscription <SUBSCRIPTION_ID>
```

### Option B: Using Subscription Name

```bash
az account set --subscription "My Subscription Name"
```

---

## 6. Verify Active Subscription

```bash
az account show
```

Confirm:

- `id` → correct subscription ID
- `isDefault` → true

---

## 7. If No Subscriptions Are Shown

If `az account list` shows **no subscriptions**:

- Make sure the account **actually owns or is assigned** to a subscription
- Check Azure Portal → **Subscriptions** → Access control (IAM)
- Ensure your account has at least **Reader** role

---

## 8. Register Required Providers (One-Time Setup)

For Azure Container Apps:

```bash
az provider register -n Microsoft.App --wait
az provider register -n Microsoft.OperationalInsights --wait
```

Verify:

```bash
az provider show -n Microsoft.App --query registrationState
az provider show -n Microsoft.OperationalInsights --query registrationState
```

Both should return:

```
Registered
```

---

## 9. Ready for Deployment ✅

Once completed:

- Azure CLI logged in
- Correct subscription set
- Providers registered

You are ready to deploy:

- Azure Container Apps
- App Service
- Azure Functions
- AKS

---

## 10. Quick Troubleshooting Cheatsheet

| Problem            | Fix                                         |
| ------------------ | ------------------------------------------- |
| Token expired      | `az logout && az account clear && az login` |
| Wrong subscription | `az account set --subscription <id>`        |
| No subscriptions   | Check Azure Portal IAM                      |

| ACA deployment fail
