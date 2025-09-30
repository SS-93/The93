# Supabase CLI + Docker Protocol & Setup Guide

## Overview

This document outlines the complete protocol for managing local Supabase development with Docker, including migration management, security considerations, and troubleshooting procedures for the Buckets_V1 project.

## Project Configuration

### Environment Details
- **Project Name**: Buckets_V1
- **Project ID**: `iutnwgvzwyupsuguxnls`
- **Remote URL**: `https://iutnwgvzwyupsuguxnls.supabase.co`
- **Database Version**: PostgreSQL 15
- **Local Development Port Range**: 54320-54329

### File Structure
```
my-app/
├── .env.local                          # Environment variables (DO NOT COMMIT)
├── supabase/
│   ├── config.toml                     # Supabase configuration
│   ├── migrations/                     # SQL migration files
│   │   └── 20250926171221_remote_schema.sql
│   ├── seed.sql                        # Database seed data
│   └── .temp/                          # Temporary files (auto-generated)
├── database/
│   └── migrations/                     # Legacy migration location
│       └── 009_host_access_system.sql  # Migrated to supabase/migrations/
└── documents/
    └── Supabase_CLI_Docker_Protocol.md # This document
```

## Installation & Setup

### 1. Prerequisites
```bash
# Ensure Docker Desktop is installed and running
docker --version

# Verify Node.js and npm are available
node --version
npm --version
```

### 2. Supabase CLI Installation
```bash
# Install as development dependency
npm install supabase --save-dev

# Verify installation
npx supabase --version
```

### 3. Environment Configuration

#### .env.local (Never commit this file)
```env
REACT_APP_SUPABASE_URL=https://iutnwgvzwyupsuguxnls.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ACCESS_TOKEN=sbp_819b604a6ee8df5fc445e62e6dd3bc1b65185d24
```

#### supabase/config.toml Key Settings
```toml
project_id = "my-app"

[db]
port = 54322
major_version = 15  # Must match remote database version

[api]
port = 54321

[studio]
port = 54323

[auth]
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
```

## Core Commands

### Authentication
```bash
# Login (opens browser for authentication)
npx supabase login

# Set access token directly
export SUPABASE_ACCESS_TOKEN=your_token_here

# List available projects
SUPABASE_ACCESS_TOKEN=your_token npx supabase projects list
```

### Project Linking
```bash
# Link local project to remote
SUPABASE_ACCESS_TOKEN=your_token npx supabase link --project-ref iutnwgvzwyupsuguxnls

# Verify link status
npx supabase status
```

### Local Development Server
```bash
# Start all Supabase services locally
npx supabase start

# Stop all services
npx supabase stop

# Check service status
npx supabase status
```

### Database Management
```bash
# Pull remote schema to local migrations
SUPABASE_ACCESS_TOKEN=your_token npx supabase db pull

# Reset local database (applies all migrations)
npx supabase db reset

# Push local changes to remote
SUPABASE_ACCESS_TOKEN=your_token npx supabase db push

# Generate new migration file
npx supabase migration new migration_name
```

### Migration Management
```bash
# List migration history
npx supabase migration list

# Repair migration history if out of sync
npx supabase migration repair --status applied MIGRATION_ID

# Squash multiple migrations into one
npx supabase migration squash
```

## Docker Services & Ports

When `npx supabase start` is running, these services are available:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| API Gateway | 54321 | http://127.0.0.1:54321 | REST API & GraphQL |
| Database | 54322 | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct DB access |
| Studio | 54323 | http://127.0.0.1:54323 | Database management UI |
| Inbucket | 54324 | http://127.0.0.1:54324 | Email testing |
| Auth | 54321 | - | Authentication service |
| Realtime | 54321 | - | WebSocket connections |
| Storage | 54321 | - | File storage |

### Docker Container Names
Supabase creates containers with predictable names:
- `supabase_db_my-app` - PostgreSQL database
- `supabase_auth_my-app` - GoTrue auth server
- `supabase_rest_my-app` - PostgREST API
- `supabase_realtime_my-app` - Realtime server
- `supabase_storage_my-app` - Storage server

## Migration Workflow

### 1. Development Cycle
```bash
# 1. Start local development
npx supabase start

# 2. Create new migration
npx supabase migration new add_new_feature

# 3. Edit the generated SQL file
# 4. Test locally
npx supabase db reset

# 5. When satisfied, push to remote
SUPABASE_ACCESS_TOKEN=your_token npx supabase db push
```

### 2. Schema Synchronization

#### From Remote to Local (Pull)
```bash
# Download current remote schema
SUPABASE_ACCESS_TOKEN=your_token npx supabase db pull

# Apply to local database
npx supabase db reset
```

#### From Local to Remote (Push)
```bash
# Verify local changes first
npx supabase db diff

# Push to remote database
SUPABASE_ACCESS_TOKEN=your_token npx supabase db push
```

### 3. Migration File Locations

#### Primary Migration Directory
```
supabase/migrations/
├── 20250926171221_remote_schema.sql    # Current complete schema
└── [timestamp]_[name].sql              # Future migrations
```

#### Migration File Naming Convention
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20250926171221_remote_schema.sql`
- Migrations are applied in chronological order

#### Legacy Migration Location (Deprecated)
```
database/migrations/
└── 009_host_access_system.sql          # Migrated to supabase/migrations/
```

## Security Protocols

### 1. Environment Security
- **Never commit** `.env.local` or access tokens to git
- **Separate credentials** for local vs production environments
- **Use different service keys** for different environments
- **Rotate access tokens** periodically

### 2. Docker Security
- Local containers run on `localhost` only - not exposed publicly
- Default passwords are used locally (safe for development)
- Production data is never pulled to local environment
- Only schema and structure are synchronized

### 3. Network Security
```bash
# Local services are bound to localhost
# API: http://127.0.0.1:54321 (not 0.0.0.0:54321)
# Studio: http://127.0.0.1:54323

# Verify no external exposure
netstat -an | grep :5432
```

### 4. Access Control
- **Service Role Key**: Full database access (server-side only)
- **Anon Key**: Limited public access (client-side safe)
- **Access Token**: CLI operations only
- **User JWTs**: Per-user authentication

## Troubleshooting

### Docker Issues

#### 1. Docker Not Running
```bash
# Error: "dial unix docker.raw.sock: connect: connection refused"
# Solution: Start Docker Desktop application
open -a Docker
```

#### 2. Docker Image Download Timeouts
```bash
# For slow connections, increase timeout
SUPABASE_ACCESS_TOKEN=your_token timeout 600 npx supabase db pull

# Or use manual migration workflow (see section below)
```

#### 3. Port Conflicts
```bash
# Check which ports are in use
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Stop Supabase services to free ports
npx supabase stop
```

### Migration Issues

#### 1. Migration History Mismatch
```bash
# Error: "migration history does not match local files"
# Solution: Repair the migration history
SUPABASE_ACCESS_TOKEN=your_token npx supabase migration repair --status applied MIGRATION_ID
```

#### 2. Database Version Mismatch
```bash
# Error: "Local database version differs from linked project"
# Solution: Update config.toml
# Change major_version = 17 to major_version = 15
```

#### 3. Schema Sync Issues
```bash
# Force reset local database
npx supabase db reset --force

# If that fails, stop and restart
npx supabase stop
npx supabase start
npx supabase db reset
```

#### 4. Storage Bucket Schema Compatibility Issues

**Problem**: Storage bucket schema has changed in newer Supabase versions, causing migration failures.

**Common Errors**:
```bash
ERROR: column "public" of relation "buckets" does not exist (SQLSTATE 42703)
ERROR: column "file_size_limit" of relation "buckets" does not exist (SQLSTATE 42703)
ERROR: column "allowed_mime_types" of relation "buckets" does not exist (SQLSTATE 42703)
```

**Root Cause**:
- Older migration files use deprecated storage bucket columns
- `public`, `file_size_limit`, and `allowed_mime_types` columns no longer exist
- Bucket privacy is now controlled through policies, not column flags

**Resolution Process**:

1. **Identify Affected Files**: Search for storage bucket INSERT statements
```bash
grep -r "storage.buckets" supabase/migrations/
grep -r "storage.buckets" database/migrations/
```

2. **Update Bucket Creation Syntax**:

**OLD (Deprecated)**:
```sql
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES
  ('artist-content','artist-content',false,104857600,ARRAY['audio/*','video/*','image/*']),
  ('visual-clips','visual-clips',true,52428800,ARRAY['video/mp4','video/quicktime'])
ON CONFLICT (id) DO NOTHING;
```

**NEW (Compatible)**:
```sql
INSERT INTO storage.buckets (id,name)
VALUES
  ('artist-content','artist-content'),
  ('visual-clips','visual-clips')
ON CONFLICT (id) DO NOTHING;
```

3. **Apply Fix to All Migration Files**:
- Update `supabase/migrations/*.sql`
- Update `database/migrations/*.sql` (if present)
- Ensure consistency across all migration files

4. **Control Bucket Access via Policies** (instead of public column):
```sql
-- Example: Make visual-clips bucket public
CREATE POLICY "Public can view visual clips" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'visual-clips');

-- Example: Restrict artist-content to artists only
CREATE POLICY "Artists can manage content" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'artist-content' AND EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'artist'
));
```

**Debugging Tips**:
```bash
# Run with debug flag for detailed error information
npx supabase start --debug

# Check current storage schema in running instance
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d storage.buckets"

# Verify bucket policies are in place
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT * FROM pg_policies WHERE schemaname='storage'"
```

**Prevention**:
- Always test migrations on latest Supabase CLI version before deploying
- Monitor Supabase changelog for breaking changes
- Use `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for idempotency
- Document storage bucket policies alongside bucket creation

### Manual Migration Workflow (Fallback)

When Docker downloads are problematic:

1. **Manual Schema Management**
```bash
# Copy existing SQL to migration file
cp database/migrations/009_host_access_system.sql supabase/migrations/20250926171221_remote_schema.sql
```

2. **Version Control Approach**
```bash
# Track migration files in git
git add supabase/migrations/
git commit -m "Add database schema migration"
```

3. **Remote Application**
```bash
# When Docker is stable, apply migrations
npx supabase start
npx supabase db push
```

## Best Practices

### 1. Development Workflow
- **Always test migrations locally** before pushing to production
- **Use descriptive migration names** that explain the change
- **Keep migrations atomic** - one logical change per file
- **Include rollback instructions** in migration comments

### 2. Schema Management
- **Use IF NOT EXISTS** for table creation to avoid conflicts
- **Make migrations idempotent** - safe to run multiple times
- **Include proper indexes** for performance
- **Add Row Level Security (RLS)** policies for data protection

### 3. Team Collaboration
- **Coordinate migration timing** to avoid conflicts
- **Communicate schema changes** before merging
- **Test migrations** on staging before production
- **Document breaking changes** in migration comments

### 4. Performance Considerations
- **Use connection pooling** in production
- **Monitor query performance** with Studio
- **Add appropriate indexes** for common queries
- **Regular database maintenance** and statistics updates

## Monitoring & Maintenance

### 1. Local Development Monitoring
```bash
# Check service status
npx supabase status

# View logs
npx supabase logs

# Monitor database connections
npx supabase db inspect
```

### 2. Migration Monitoring
```bash
# View applied migrations
npx supabase migration list

# Check for schema drift
npx supabase db diff
```

### 3. Performance Monitoring
- Use Supabase Studio (http://127.0.0.1:54323) for:
  - Query performance analysis
  - Table statistics
  - Index usage
  - Connection monitoring

### 4. Cleanup Procedures
```bash
# Clean up stopped containers
docker container prune

# Remove unused images (careful with this)
docker image prune

# Reset Supabase completely
npx supabase stop
rm -rf supabase/.temp
npx supabase start
```

## Emergency Procedures

### 1. Complete Reset
```bash
# Nuclear option - reset everything
npx supabase stop
rm -rf supabase/.temp
npx supabase start
SUPABASE_ACCESS_TOKEN=your_token npx supabase db pull
npx supabase db reset
```

### 2. Backup Procedures
```bash
# Backup local database
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > backup.sql

# Restore from backup
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup.sql
```

### 3. Recovery from Bad Migration
```bash
# Rollback to previous migration
npx supabase migration repair --status reverted MIGRATION_ID

# Or reset and reapply good migrations
npx supabase db reset
# Remove bad migration file
# Run reset again
```

## Additional Resources

### Documentation Links
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Migration Management](https://supabase.com/docs/guides/local-development/migrations)

### Support Channels
- Supabase Discord: https://discord.supabase.com/
- GitHub Issues: https://github.com/supabase/cli/issues
- Documentation: https://supabase.com/docs

---

**Document Version**: 1.0
**Last Updated**: September 26, 2025
**Project**: Buckets_V1
**Author**: Development Team