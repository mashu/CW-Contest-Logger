#!/bin/bash

# CW Contest Logger - Quick Start Script

echo "🎙️  CW Contest Logger - Starting..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "🔨 Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Failed to build application"
        exit 1
    fi
fi

echo "🚀 Launching CW Contest Logger..."
npm start
