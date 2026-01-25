# Azure Container Apps Deployment Guide (Docker Compose)

This guide explains **how to deploy a multi-container Docker Compose project to Azure Container Apps (ACA)** using Azure CLI. It is written as a practical checklist you can follow step by step.

---

## 1. Prerequisites

Before starting, make sure you have:

- Azure subscription
- Azure CLI installed
- Docker installed
- A Docker Compose project that already works locally

Login to Azure:

```bash
az login
```

---

## 2. High-level Architecture (ACA Ingress Routing)

```
Internet
  ↓
Azure Container Apps Ingress
  ├─ frontend  ( / )
  ├─ backend   ( /api/* )
  └─ face-recognition-service (internal only)
```

- Azure Container Apps **Ingress replaces nginx**
- Routing is handled by **HTTP path rules**
- Only frontend & backend are public
- Face recognition service stays internal

---

## 3. Prepare Docker Images (Docker Hub – Public)

To reduce cost and simplify setup, this guide uses **Docker Hub public repositories** instead of Azure Container Registry (ACR).

### Why Docker Hub (Public)

- ✅ Free for public images
- ✅ No Azure Container Registry cost
- ✅ Supported natively by Azure Container Apps

> ⚠️ Do **NOT** use public images for sensitive or private production code.

---

## 3.1 Docker Hub Login

```bash
docker login
```

---

### 3.2 Build and Push Images

```bash
docker build -t myacr.azurecr.io/backend ./backend
docker push myacr.azurecr.io/backend

docker build -t myacr.azurecr.io/face-service ./face-service
docker push myacr.azurecr.io/face-service

docker build -t myacr.azurecr.io/frontend ./frontend
docker push myacr.azurecr.io/frontend

docker build -t myacr.azurecr.io/nginx ./nginx
docker push myacr.azurecr.io/nginx
```

---

## 4. Prepare docker-compose.yml for Azure

### Important Rules

- ❌ Remove `nginx`
- ❌ Remove `cloudflared`
- ❌ Remove SSL termination logic
- ❌ Remove local bind volumes
- ❌ Only ONE ingress per container app
- ✅ Use ACA ingress path routing

---

## 5. Create Container Apps Environment

```bash
az extension add --name containerapp
```

```bash
az containerapp env create \
  --name aca-env \
  --resource-group aca-rg \
  --location southeastasia
```

---

## 6. Deploy Docker Compose to Azure Container Apps

```bash
az containerapp compose create \
  --resource-group aca-rg \
  --environment aca-env \
  --file docker-compose.yml
```

This command:

- Creates **one Container App per service**
- Enables internal service discovery
- Preserves service names

---

## 7. Configure Ingress & Routing

### 7.1 Enable Ingress for Frontend

```bash
az containerapp ingress enable \
  --name frontend \
  --resource-group aca-rg \
  --target-port 3000 \
  --type external
```

### 7.2 Enable Ingress for Backend

```bash
az containerapp ingress enable \
  --name backend \
  --resource-group aca-rg \
  --target-port 3001 \
  --type external
```

### 7.3 Configure Path-based Routing

```bash
az containerapp ingress traffic set \
  --name backend \
  --resource-group aca-rg \
  --rule-name api \
  --path /api/*
```

Frontend handles `/`, backend handles `/api/*`.

Face-recognition-service remains internal-only.

---

## 8. Set Environment Variables & Secrets

```bash
az containerapp update \
  --name backend \
  --resource-group aca-rg \
  --set-env-vars \
  DATABASE_URL=... \
  JWT_SECRET=... \
  GOOGLE_CLIENT_ID=... \
  GOOGLE_CLIENT_SECRET=...
```

> For production, use **Azure Key Vault**.

---

## 9. Storage Strategy

Local volumes are **not supported**.

Recommended options:

- Azure Blob Storage (best)
- Azure Files (mountable volume)

Use Blob Storage SDK in your backend and face-recognition service.

---

## 10. Scaling & Cost Control

Azure Container Apps supports:

- Scale to zero
- HTTP-based scaling
- CPU & memory-based scaling

Example:

```bash
az containerapp update \
  --name backend \
  --resource-group aca-rg \
  --min-replicas 0 \
  --max-replicas 5
```

---

## 11. Common Pitfalls

- `depends_on` does not guarantee startup order
- Services must handle cold starts
- Images must be rebuilt and pushed on every update
- Logs are per-container (check in Portal)

---

## 12. When to Use Container Apps

Best for:

- Microservices
- AI / ML services
- Docker Compose projects
- Variable or low traffic workloads

Avoid if:

- You need full Kubernetes control (use AKS)
- You need Windows containers

---

## 13. Next Improvements

- Add Azure Key Vault for secrets
- Add autoscaling rules (HTTP & CPU)
- Add custom domain
- Enable Dapr service invocation (optional)
- Add Application Insights monitoring

---

**End of guide**
