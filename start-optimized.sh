#!/bin/bash

# Optimized startup script that uses production build for faster startup time

echo "Building optimized production bundle..."
npm run build:prod

echo "Starting CW Logger with optimized build..."
npx electron . 