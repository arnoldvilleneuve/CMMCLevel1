# CMMC Compliance Portal - Backup & Restoration Guide

## Project Checkpoints

- `v1.0.0-base`: Base checkpoint with complete working prototype
- `v1.0.0-auth`: Authentication and user management features
- `v1.0.0-docs`: Document upload and management system
- `v1.0.0-assess`: Assessment tracking and reporting functionality

## Restoration Steps

1. **Create New Replit Project**
   - Create a new TypeScript project
   - Import from Git repository

2. **Environment Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Set up database
   - Create new PostgreSQL database
   - Import schema from backup/db/schema.sql
   ```

3. **Environment Variables**
   Required environment variables:
   - DATABASE_URL
   - PGUSER
   - PGPASSWORD
   - PGDATABASE
   - PGHOST
   - PGPORT

4. **Verify Installation**
   ```bash
   # Start development server
   npm run dev
   ```

## Backup Components

1. Database Schema: `backup/db/schema.sql`
2. Environment Configuration: `backup/environment.json`
3. Git Tags: Use `git checkout <tag>` to restore specific versions

## Version History

- v1.0.0 (2024-12-14): Initial working prototype with document management
- More versions will be added as development progresses

## Support

For restoration support, please contact the development team.
