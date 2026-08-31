#!/bin/bash
# ===========================================
# SCRIPT DE DEPLOY - Tremeliko's Burguer
# Uso: ./deploy.sh
# ===========================================

set -e

APP_NAME="tremelikos"
APP_DIR="/var/www/tremelikos"
PM2_PROCESS="tremelikos"

echo "🚀 Iniciando deploy..."

# Navegar para o diretório
cd $APP_DIR

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build
echo "🔨 Fazendo build..."
npm run build

# Reiniciar PM2
echo "🔄 Reiniciando aplicação..."
pm2 restart $PM2_PROCESS || pm2 start npm --name "$PM2_PROCESS" -- start

# Salvar estado do PM2
pm2 save

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplicação rodando em: http://localhost:3000"
