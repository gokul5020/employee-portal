#!/bin/bash

echo "Staging all changes..."
git add -A

echo "Creating commit..."
git commit -m "feat: add AI HR assistant feature

- Add AI insights widget and dedicated page for analytics
- Integrate AI service with Claude API backend
- Add new routes for AI-powered employee recommendations
- Update frontend API service with new endpoints
- Document AI features and capabilities

Co-Authored-By: Claude Code <noreply@anthropic.com>"

echo "Pushing to remote..."
git push