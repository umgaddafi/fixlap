#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Change to script directory (project root)
cd "$(dirname "$0")"

echo "==================================="
echo "🚀 Starting Deployment Process..."
echo "==================================="

# Restore local .env if swapped, even if an error occurs
cleanup() {
    if [ -f backend/.env.local_backup ]; then
        echo ""
        echo "🔄 Restoring local .env files..."
        rm -f backend/.env
        mv backend/.env.local_backup backend/.env
        git update-index --assume-unchanged backend/.env 2>/dev/null || true
    fi
}
trap cleanup EXIT

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

# 4. Swap .env files for production
ENV_HOST_FILE=""
if [ -f backend/.env.host ]; then
    ENV_HOST_FILE="backend/.env.host"
elif [ -f backend/.env.production ]; then
    ENV_HOST_FILE="backend/.env.production"
fi

if [ -n "$ENV_HOST_FILE" ]; then
    echo ""
    echo "🔄 Swapping .env files for production (using $ENV_HOST_FILE)..."
    if [ -f backend/.env ]; then
        mv backend/.env backend/.env.local_backup
    fi
    cp "$ENV_HOST_FILE" backend/.env
fi

# 5. Stage changes
echo ""
echo "📝 Staging changes for git..."
git update-index --no-assume-unchanged backend/.env 2>/dev/null || true
git add index.html assets/ images/ favicon* apple-touch-icon* .htaccess *.sql || true
git add .

# Force add backend/.env and backend/vendor if they exist
if [ -f backend/.env ]; then
    git add -f backend/.env
fi
if [ -d backend/vendor ]; then
    git add -f backend/vendor
fi
# Safeguard: never commit the local backup .env file
git reset HEAD backend/.env.local_backup 2>/dev/null || true

# 6. Commit changes
echo ""
echo "💾 Committing changes..."
# We use || true so the script doesn't fail if there's nothing to commit
git commit -m "Deploy to cPanel with vendor dependencies - $(date +'%Y-%m-%d %H:%M:%S')" || true

# 7. Push to GitHub
echo ""
echo "☁️  Pushing to GitHub..."
git pull origin HEAD --rebase || true
git push origin HEAD

echo ""
echo "✅ Deployment pushed to GitHub successfully! cPanel can now pull this."
