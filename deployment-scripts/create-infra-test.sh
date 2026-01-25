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
BACKEND_PORT=3001
FACE_PORT=8001

# Azure SQL Database Configuration
SQL_SERVER_NAME="hadu-education"
SQL_DATABASE_NAME="hadu-lms-test"

# Managed Identity
MANAGED_IDENTITY_NAME="hadu-lms-backend-identity"

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

# ================================
# CREATE USER-ASSIGNED MANAGED IDENTITY
# ================================
echo "🔑 Creating user-assigned managed identity"
az identity create \
  --name $MANAGED_IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Get managed identity details
IDENTITY_ID=$(az identity show \
  --name $MANAGED_IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query id \
  -o tsv)

IDENTITY_CLIENT_ID=$(az identity show \
  --name $MANAGED_IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query clientId \
  -o tsv)

IDENTITY_PRINCIPAL_ID=$(az identity show \
  --name $MANAGED_IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  -o tsv)

echo "📝 Managed Identity created:"
echo "   Client ID: $IDENTITY_CLIENT_ID"
echo "   Principal ID: $IDENTITY_PRINCIPAL_ID"

# ================================
# DEPLOY CONTAINER APPS
# ================================
echo "🚀 Deploying backend with user-assigned managed identity"

# Create backend container app with user-assigned managed identity
az containerapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $DOCKERHUB_USER/hadu-lms-backend:latest \
  --target-port $BACKEND_PORT \
  --ingress external \
  --user-assigned $IDENTITY_ID

# Create connection string for passwordless authentication with user-assigned identity
DATABASE_URL="sqlserver://${SQL_SERVER_NAME}.database.windows.net:1433;database=${SQL_DATABASE_NAME};authentication=ActiveDirectoryDefault;encrypt=true;trustServerCertificate=false;"

# Set secrets and environment variables
az containerapp secret set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    database-url="$DATABASE_URL"

az containerapp update \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    NODE_ENV=production \
    PORT=$BACKEND_PORT \
    FACE_RECOGNITION_SERVICE_URL=http://$FACE_APP:$FACE_PORT \
    DATABASE_URL=secretref:database-url \
    AZURE_CLIENT_ID=$IDENTITY_CLIENT_ID

echo ""
echo "⚠️  IMPORTANT: Grant SQL Database access to managed identity:"
echo "   Identity Name: $MANAGED_IDENTITY_NAME"
echo "   Client ID: $IDENTITY_CLIENT_ID"
echo "   Principal ID: $IDENTITY_PRINCIPAL_ID"
echo ""
echo "   Run this in Azure SQL Database:"
echo "   CREATE USER [$MANAGED_IDENTITY_NAME] FROM EXTERNAL PROVIDER; ALTER ROLE db_datareader ADD MEMBER [$MANAGED_IDENTITY_NAME]; ALTER ROLE db_datawriter ADD MEMBER [$MANAGED_IDENTITY_NAME];"
echo ""

echo "🚀 Deploying face-recognition-service (internal)"
az containerapp create \
  --name $FACE_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $DOCKERHUB_USER/hadu-lms-face-service:latest \
  --target-port $FACE_PORT \
  --ingress internal

echo "🚀 Deploying frontend with Static Web App"
az staticwebapp create \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/datngo2001/HaduLMS.Portal \
  --location eastasia \
  --branch main \
  --app-location frontend \
  --output-location dist \
  --sku Free \
  --login-with-github

# ================================
# OUTPUT URLS
# ================================
FRONTEND_URL=$(az staticwebapp show \
  --name $FRONTEND_APP \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostname \
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
