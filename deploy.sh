#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Change to script directory (project root)
cd "$(dirname "$0")"

echo "==================================="
echo "🚀 Starting Deployment Process..."
echo "==================================="

# 1. Backup the database to the fixlap root directory
echo ""
echo "🗄️  Backing up MySQL database in root directory..."

MYSQLDUMP="mysqldump"
if ! command -v mysqldump &> /dev/null; then
    if [ -x /opt/lampp/bin/mysqldump ]; then
        MYSQLDUMP="/opt/lampp/bin/mysqldump"
    fi
fi

# Detect database name from backend/.env or default to fixlab_db
DB_NAME="fixlab_db"
if [ -f backend/.env ]; then
    ENV_DB=$(grep -E '^DB_DATABASE=' backend/.env | head -n 1 | cut -d '=' -f2 | tr -d ' "\r\n')
    if [ -n "$ENV_DB" ]; then
        DB_NAME="$ENV_DB"
    fi
fi

BACKUP_FILE="${DB_NAME}.sql"
echo "📦 Dumping database '$DB_NAME' using 'mysql -u root' to $BACKUP_FILE..."
$MYSQLDUMP -u root "$DB_NAME" > "$BACKUP_FILE"
echo "✅ Database backup complete: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# 2. Build the frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# 3. Copy frontend build to root
echo ""
echo "📂 Copying frontend build files to root..."
cp -r frontend/dist/* .

# 4. Stage changes (Secrets / .env files are strictly excluded)
echo ""
echo "📝 Staging changes for git..."
git add index.html assets/ images/ favicon* apple-touch-icon* .htaccess *.sql || true
git add .

# Strict security safeguard: Never stage or commit any .env file
git reset HEAD backend/.env* .env* *.local_backup 2>/dev/null || true

# Force add backend/vendor if it exists for cPanel hosts lacking composer CLI
if [ -d backend/vendor ]; then
    git add -f backend/vendor
fi

# 5. Commit changes
echo ""
echo "💾 Committing changes..."
# We use || true so the script doesn't fail if there's nothing to commit
git commit -m "Deploy update to cPanel - $(date +'%Y-%m-%d %H:%M:%S')" || true

# 6. Push to GitHub
echo ""
echo "☁️  Pushing to GitHub..."
git pull origin HEAD --rebase || true
git push origin HEAD

echo ""
echo "✅ Deployment pushed to GitHub successfully! (No secrets included)"
echo "ℹ️  Remember: upload backend/.env.host to cPanel as backend/.env"
