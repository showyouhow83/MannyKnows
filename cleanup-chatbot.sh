#!/bin/bash

# MannyKnows Chatbot Cleanup Script
# This script removes unused/over-engineered files and keeps only the working core

echo "🧹 Starting MannyKnows Chatbot Cleanup..."

# Create backup of current files before deletion
echo "📦 Creating backup of files to be removed..."
mkdir -p .cleanup-backup
cp src/lib/chatbot/leadScoring.ts .cleanup-backup/ 2>/dev/null || true
cp src/lib/chatbot/tools.ts .cleanup-backup/ 2>/dev/null || true
cp src/lib/database/chatbotDatabase.ts .cleanup-backup/ 2>/dev/null || true
cp src/pages/api/admin/leads.ts .cleanup-backup/ 2>/dev/null || true

# Remove over-engineered lead scoring system
echo "🗑️  Removing over-engineered lead scoring system..."
rm -f src/lib/chatbot/leadScoring.ts

# Remove complex tools system (not actually being used)
echo "🗑️  Removing unused tools system..."
rm -f src/lib/chatbot/tools.ts

# Remove incomplete database adapters
echo "🗑️  Removing incomplete database adapters..."
rm -f src/lib/database/chatbotDatabase.ts

# Remove broken admin leads API
echo "🗑️  Removing broken admin API..."
rm -f src/pages/api/admin/leads.ts

# Keep schema.sql for reference but move it to docs
echo "📁 Moving database schema to docs..."
mkdir -p docs/database
mv src/lib/database/schema.sql docs/database/ 2>/dev/null || true

# Clean up empty directories
echo "🧹 Cleaning up empty directories..."
rmdir src/lib/database 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ Removed: leadScoring.ts (over-engineered)"
echo "  ✅ Removed: tools.ts (unused tool system)"
echo "  ✅ Removed: chatbotDatabase.ts (incomplete adapters)"
echo "  ✅ Removed: admin/leads.ts (broken API)"
echo "  📁 Moved: schema.sql to docs/database/"
echo "  💾 Backup: Files saved in .cleanup-backup/"
echo ""
echo "🎯 What's left (the working core):"
echo "  ✅ src/pages/api/chat.ts - Main chat API"
echo "  ✅ src/pages/api/chat-simple.ts - Simplified version"
echo "  ✅ src/lib/chatbot/promptBuilder.ts - System prompts"
echo "  ✅ src/components/ui/ProjectConsultationModal.astro - Frontend"
echo "  ✅ src/config/chatbot/environments.json - Configuration"
echo ""
echo "🔧 Next steps:"
echo "  1. Test the simplified chat system"
echo "  2. Replace chat.ts with chat-simple.ts if it works well"
echo "  3. Update documentation to reflect the new simple structure"
