# Database Backup Strategy

## Overview
PaperIQ uses Supabase PostgreSQL as the primary database. This document outlines the backup and disaster recovery strategy.

## Supabase Built-in Backups

### Automated Backups
Supabase provides automated daily backups for all Pro tier projects:
- **Frequency**: Daily backups
- **Retention**: 7 days (default) to 30 days (configurable)
- **Scope**: Entire database including all tables, indexes, and data
- **Recovery**: Point-in-time recovery available within the retention window

### Point-in-Time Recovery (PITR)
- **Granularity**: Recovery to any point within the backup retention window
- **Use Case**: Recover from accidental data deletion, corruption, or bad migrations
- **Access**: Available through Supabase Dashboard → Database → Backups

## Manual Backup Procedures

### Export Schema and Data
```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql

# Using pg_dump directly
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

### Export Specific Tables
```bash
# Export only critical tables
pg_dump -h db.xxx.supabase.co -U postgres -d postgres \
  -t user_profiles -t analysis_reports -t study_plans \
  -f critical_backup_$(date +%Y%m%d).sql
```

## Backup Schedule

### Automated (Supabase)
- Daily backups at 00:00 UTC
- 30-day retention period
- Point-in-time recovery enabled

### Manual (Recommended)
- Weekly full exports before major deployments
- Pre-migration backups before schema changes
- Export after critical data imports (scraping results, analysis reports)

## Critical Data Priorities

### Tier 1 (Critical - Daily Backup)
- `user_profiles` - User onboarding data
- `analysis_reports` - Generated analysis results
- `study_plans` - Personalized study plans
- `papers` - Paper metadata and extraction results
- `questions` - Parsed question data

### Tier 2 (Important - Weekly Backup)
- `subjects`, `colleges`, `branches` - Academic reference data
- `syllabi`, `syllabus_topics` - Syllabus data
- `scraping_jobs` - Scraping job history

### Tier 3 (Reference - Monthly Backup)
- `regulations` - Regulation definitions
- `plans`, `subscriptions` - Payment data

## Disaster Recovery Procedure

### 1. Identify the Issue
- Determine the scope of data loss or corruption
- Identify the point in time to recover to

### 2. Choose Recovery Method
- **Small data loss**: Use point-in-time recovery
- **Large corruption**: Restore from full backup
- **Table-specific**: Restore specific table from backup

### 3. Execute Recovery
```bash
# Using Supabase Dashboard
1. Go to Database → Backups
2. Select the backup point
3. Click "Restore to this point"
4. Confirm and wait for restoration

# Using CLI (for manual backups)
psql -h db.xxx.supabase.co -U postgres -d postgres < backup_20240608.sql
```

### 4. Verify Recovery
- Check critical tables for data integrity
- Run application health checks
- Verify user data and analysis results
- Test critical user flows

### 5. Communicate with Users
- Notify users of any data restoration
- Provide timeline for service restoration
- Document the incident for post-mortem

## Monitoring and Alerts

### Backup Status Monitoring
- Monitor Supabase backup status via Dashboard
- Set up alerts for backup failures
- Regularly verify backup integrity

### Database Health Monitoring
- Monitor database connection counts
- Track query performance metrics
- Set up alerts for unusual activity patterns

## Testing Backup Recovery

### Monthly Recovery Test
- Test restore process on staging environment
- Verify backup integrity
- Document recovery time metrics
- Update recovery procedures based on findings

## Security Considerations

### Backup Access Control
- Restrict backup access to authorized personnel
- Store backup credentials securely
- Use encryption for backup storage

### Backup Storage
- Store critical backups in multiple locations
- Consider off-site backup storage for disaster recovery
- Encrypt sensitive data in backups

## Compliance and Retention

### Data Retention Policy
- Follow institutional data retention requirements
- Comply with student data privacy regulations
- Implement data anonymization for long-term storage

### Backup Retention
- Keep daily backups for 30 days
- Keep weekly backups for 12 weeks
- Keep monthly backups for 12 months

## Contact Information

### Primary Database Administrator
- Name: [Your Name]
- Email: [your.email@example.com]
- Phone: [Your Phone Number]

### Supabase Support
- Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs
- Support: support@supabase.com
