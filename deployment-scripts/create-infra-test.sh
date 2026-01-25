#!/usr/bin/env bash
set -e

# ================================
# CONFIG — CHANGE THESE
# ================================
RESOURCE_GROUP="hadu_lms_test"
LOCATION="southeastasia"
ENV_NAME="aca-env-test"
SUBSCRIPTION_ID="8084ecc0-a2cf-438f-be74-b12f795f94d6"

# Docker Hub username
DOCKERHUB_USER="datngo2001"

# Container app names (must match docker-compose service names)
FRONTEND_APP="frontend"
BACKEND_APP="backend"
FACE_APP="face-recognition-service"

# Ports
FRONTEND_PORT=3000
BACKEND_PORT=3001
FACE_PORT=8001

# ================================
# CHECK REQUIREMENTS
# ================================
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }

echo "✅ Requirements OK"

# ================================
# LOGIN
# ================================
echo "🔐 Azure login"
az account show >/dev/null 2>&1 || az login
az account set --subscription $SUBSCRIPTION_ID >/dev/null

# ================================
# CREATE RESOURCE GROUP
# ================================
echo "📦 Creating resource group"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  >/dev/null

# ================================
# CREATE CONTAINER APPS ENV
# ================================
echo "🌍 Creating Container Apps environment"
az extension add --name containerapp --upgrade

az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  >/dev/null

# ================================
# BUILD & PUSH IMAGES
# ================================
echo "🐳 Building & pushing Docker images"

docker login

docker build -t $DOCKERHUB_USER/hadu-lms-backend:latest ./backend
docker push $DOCKERHUB_USER/hadu-lms-backend:latest

docker build -t $DOCKERHUB_USER/hadu-lms-face-service:latest ./face-service
docker push $DOCKERHUB_USER/hadu-lms-face-service:latest

docker build -t $DOCKERHUB_USER/hadu-lms-frontend:latest ./frontend
docker push $DOCKERHUB_USER/hadu-lms-frontend:latest

# ================================
# DEPLOY CONTAINER APPS
# ================================
echo "🚀 Deploying backend"
az containerapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $DOCKERHUB_USER/hadu-lms-backend:latest \
  --target-port $BACKEND_PORT \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    PORT=$BACKEND_PORT \
    FACE_RECOGNITION_SERVICE_URL=http://$FACE_APP:$FACE_PORT

echo "🚀 Deploying face-recognition-service (internal)"
az containerapp create \
  --name $FACE_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $DOCKERHUB_USER/hadu-lms-face-service:latest \
  --target-port $FACE_PORT \
  --ingress internal

echo "🚀 Deploying frontend"
az containerapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $DOCKERHUB_USER/hadu-lms-frontend:latest \
  --target-port $FRONTEND_PORT \
  --ingress external

# ================================
# OUTPUT URLS
# ================================
FRONTEND_URL=$(az containerapp show \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

BACKEND_URL=$(az containerapp show \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv)

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: https://$FRONTEND_URL"
echo "🔗 Backend:  https://$BACKEND_URL/api"
echo ""
