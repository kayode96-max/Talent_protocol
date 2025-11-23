# CosmicCreator Quick Setup Script for Windows

Write-Host "🌌 CosmicCreator Setup Script" -ForegroundColor Cyan
Write-Host "=============================="

# Check prerequisites
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
$forgeInstalled = Get-Command forge -ErrorAction SilentlyContinue
$psqlInstalled = Get-Command psql -ErrorAction SilentlyContinue

if (-not $nodeInstalled) {
    Write-Host "❌ Node.js is required but not installed. Install from nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not $forgeInstalled) {
    Write-Host "❌ Foundry is required but not installed." -ForegroundColor Red
    Write-Host "   Install with: irm https://github.com/foundry-rs/foundry/releases/latest/download/foundry_nightly_windows_amd64.zip -OutFile foundry.zip" -ForegroundColor Yellow
    exit 1
}

if (-not $psqlInstalled) {
    Write-Host "⚠️  PostgreSQL not found. You'll need to install it manually." -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Install root dependencies
Write-Host ""
Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
npm install

# Setup contracts
Write-Host ""
Write-Host "⚡ Setting up smart contracts..." -ForegroundColor Cyan
Set-Location contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
Copy-Item .env.example .env
Write-Host "✅ Contracts setup complete. Please edit contracts\.env with your values." -ForegroundColor Green
Set-Location ..

# Setup backend
Write-Host ""
Write-Host "🔧 Setting up backend..." -ForegroundColor Cyan
Set-Location backend
npm install
Copy-Item .env.example .env
Write-Host "✅ Backend setup complete. Please edit backend\.env with your values." -ForegroundColor Green
Set-Location ..

# Setup frontend
Write-Host ""
Write-Host "🎨 Setting up frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
Copy-Item .env.local.example .env.local
Write-Host "✅ Frontend setup complete. Please edit frontend\.env.local with your values." -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "=============================="
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Edit configuration files:"
Write-Host "   - contracts\.env"
Write-Host "   - backend\.env"
Write-Host "   - frontend\.env.local"
Write-Host ""
Write-Host "2. Setup database:"
Write-Host "   cd backend; npm run prisma:migrate"
Write-Host ""
Write-Host "3. Deploy contracts (local):"
Write-Host "   Terminal 1: anvil"
Write-Host "   Terminal 2: cd contracts; npm run deploy:local"
Write-Host ""
Write-Host "4. Start development:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "📖 See README_COSMIC.md for detailed instructions"
