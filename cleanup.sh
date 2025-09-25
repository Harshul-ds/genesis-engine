#!/bin/bash
# Script to clean up sensitive information from git history

# Remove sensitive files from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch start.sh test-comprehensive.py fix-all.py test-direct.py" \
  --prune-empty --tag-name-filter cat -- --all

# Remove sensitive environment variables from all files
for file in $(git ls-files); do
  # Remove Google AI API key
  sed -i '' 's/AIzaSyDyM[^"'"'`[:space:]]*//g' "$file"
  
  # Remove Supabase credentials
  sed -i '' 's/qoxvhycfjtbjdxytxaiv.supabase.co/YOUR-SUPABASE-URL/g' "$file"
  sed -i '' 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"'"'`[:space:]]*//g' "$file"
  
  # Remove database URL with password
  sed -i '' 's/postgres:[^@]*@/postgres:YOUR-PASSWORD@/g' "$file"
  
  # Remove API keys
  sed -i '' 's/\b[A-Za-z0-9]{32,}\b/REDACTED/g' "$file"
  
  # Remove JWT tokens
  sed -i '' 's/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9._-]*\b/REDACTED/g' "$file"
done

# Force push the changes
git push origin --force --all
