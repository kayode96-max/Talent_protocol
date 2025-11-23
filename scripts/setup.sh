#!/bin/bash

# CosmicCreator Quick Setup Script

echo "🌌 CosmicCreator Setup Script"
echo "=============================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Install from nodejs.org"; exit 1; }
command -v forge >/dev/null 2>&1 || { echo "❌ Foundry is required but not installed. Run: curl -L https://foundry.paradigm.xyz | bash"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "⚠️  PostgreSQL not found. You'll need to install it manually."; }

echo "✅ Prerequisites check passed"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Setup contracts
echo ""
echo "⚡ Setting up smart contracts..."
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
cp .env.example .env
echo "✅ Contracts setup complete. Please edit contracts/.env with your values."
cd ..

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend
npm install
cp .env.example .env
echo "✅ Backend setup complete. Please edit backend/.env with your values."
cd ..

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd frontend
npm install
cp .env.local.example .env.local
echo "✅ Frontend setup complete. Please edit frontend/.env.local with your values."
cd ..

echo ""
echo "=============================="
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit configuration files:"
echo "   - contracts/.env"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Setup database:"
echo "   cd backend && npm run prisma:migrate"
echo ""
echo "3. Deploy contracts (local):"
echo "   Terminal 1: anvil"
echo "   Terminal 2: cd contracts && npm run deploy:local"
echo ""
echo "4. Start development:"
echo "   npm run dev"
echo ""
echo "📖 See README_COSMIC.md for detailed instructions"
