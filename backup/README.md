# CMMC Compliance Portal - Complete Backup & Export Guide

## GitHub Export Process

### 1. Create GitHub Repository
1. Go to GitHub.com and sign in to your account
2. Click "New" to create a new repository
3. Name it "cmmc-compliance-portal"
4. Make it Private (recommended for compliance portals)
5. Do not initialize with README (we have our own)

### 2. Link Local Repository
```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/cmmc-compliance-portal.git
git branch -M main
git push -u origin main

# Push all tags
git push --tags
```

## Project Checkpoints and Tags

- `v1.0.0-base`: Base checkpoint - Complete working prototype with all dependencies
- `v1.0.0-auth`: Authentication and user management implementation
- `v1.0.0-docs`: Document management system with chunked upload
- `v1.0.0-assess`: Assessment tracking and reporting features
- `v1.0.0-backup`: Complete backup solution with database and configs
- `v1.0.0-backup-enhanced`: Enhanced backup with complete restoration capability

## Full Project Restoration

### 1. Create New Replit Project
```bash
# Create new project
1. Start a new Replit project
2. Choose "TypeScript" as the template
3. Import from Git repository
```

### 2. Database Setup
```sql
# Create database in Replit
1. Open "Tools" in Replit sidebar
2. Click "Database" to create PostgreSQL instance
3. Import schema:
   psql $DATABASE_URL < backup/db/schema.sql
```

### 3. Environment Configuration
```bash
# Required Environment Variables
1. DATABASE_URL (Provided by Replit)
2. PGUSER (Provided by Replit)
3. PGPASSWORD (Provided by Replit)
4. PGDATABASE (Provided by Replit)
5. PGHOST (Provided by Replit)
6. PGPORT (Provided by Replit)
```

### 4. Dependencies Installation
```bash
# Install all required packages
npm install
```

### 5. Project Structure Verification
```bash
# Verify directories and files
- /client         # React frontend
- /server         # Express backend
- /db             # Database schemas
- /backup         # Backup files
```

### 6. Development Server
```bash
# Start the development server
npm run dev
```

## Backup Components

### 1. Database
- Schema: `backup/db/schema.sql`
- Tables:
  - practices
  - assessments
  - documents
  - document_chunks
  - reports

### 2. Configuration Files
- Environment: `backup/environment.json`
- Project Config: 
  - `package.json`
  - `tsconfig.json`
  - `vite.config.ts`

### 3. Version Control
- Git Tags:
  ```bash
  git checkout v1.0.0-base    # Base implementation
  git checkout v1.0.0-auth    # Auth features
  git checkout v1.0.0-docs    # Document system
  git checkout v1.0.0-assess  # Assessment features
  git checkout v1.0.0-backup  # Full backup
  ```

## Version History

### v1.0.0 Series
- v1.0.0-base (2024-12-14): Initial working prototype
- v1.0.0-auth (2024-12-14): Authentication system
- v1.0.0-docs (2024-12-14): Document management
- v1.0.0-assess (2024-12-14): Assessment tracking
- v1.0.0-backup (2024-12-14): Complete backup solution

## Emergency Restoration

If you encounter issues during restoration:

1. **Database Issues**
   ```sql
   -- Reset database
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   -- Then reimport schema
   ```

2. **Dependencies Issues**
   ```bash
   # Clear npm cache and reinstall
## Importing to New Replit Environment

### 1. Setting up GitHub Integration
1. Click the "Tools" button in the top menu bar (wrench icon)
2. Select "Git" from the dropdown menu
3. Click "Connect to GitHub" and follow the authorization process
4. Login to your GitHub account if prompted
5. Authorize Replit by reviewing and accepting the permissions
6. After authorization, choose to create a new repository or link to an existing one
7. Once connected, you can push your code to GitHub

### 2. Setup Environment
1. Add all required secrets from backup/environment.json
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create database and import schema:
   ```sql
   psql $DATABASE_URL < backup/db/schema.sql
   ```

### 3. Verify Installation
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Access the application at the provided URL
3. Verify all features are working:
   - Assessment management
   - Document upload
   - Report generation

### 4. Troubleshooting
If you encounter issues:
1. Check Replit secrets match backup/environment.json
2. Verify database schema was imported correctly
3. Review server logs for specific errors
4. Check GitHub tags for specific versions:
   ```bash
   git checkout v1.0.0-backup-enhanced
   ```
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

3. **Replit Environment**
   - Use "Secrets" tool to set environment variables
   - Restart Replit if environment changes don't take effect

## Support and Maintenance

For restoration support or technical assistance:
1. Check the backup documentation first
2. Review the git tags for specific versions
3. Contact development team for additional support

## Regular Backup Schedule

Recommended backup frequency:
- Database dumps: Daily
- Code checkpoints: After major features
- Full backup: Weekly

Remember to maintain multiple backup points to ensure recovery options.
