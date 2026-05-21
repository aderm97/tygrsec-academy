#!/bin/bash

# Frontend dependencies installation script
echo "Installing frontend dependencies..."

cd frontend

# Install all dependencies from package.json
npm install

# If npm install fails, try with legacy peer deps
if [ $? -ne 0 ]; then
    echo "Retrying with legacy peer deps..."
    npm install --legacy-peer-deps
fi

echo "Frontend dependencies installed successfully!"
echo ""
echo "To start the development server:"
echo "  cd frontend && npm run dev"