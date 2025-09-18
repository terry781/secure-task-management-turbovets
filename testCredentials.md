# Test Credentials

This document contains the test credentials for the Task Management System with 2-level organization hierarchy.

## Default Password
All users created through the user management interface will have the default password: **`password123`**

## Super Admin (System Administrator)
- **Email**: `admin@system.com`
- **Password**: `admin123`
- **Role**: Super Admin (Global Owner)
- **Organization**: None (Global access)
- **Permissions**: All permissions across all organizations
- **Capabilities**: Can CRUD all users and tasks across all organizations

## Main Organization Owners

### Tech Solutions Inc (Main Organization)
- **Owner**: `owner@techsolutions.com` / `password123`
- **Role**: Main Organization Owner
- **Level**: 0 (Main Organization)
- **Capabilities**: Can manage users and tasks in their main org and all sub-organizations

### Global Enterprises (Main Organization)
- **Owner**: `owner@globalenterprises.com` / `password123`
- **Role**: Main Organization Owner
- **Level**: 0 (Main Organization)
- **Capabilities**: Can manage users and tasks in their main org and all sub-organizations

### Innovation Labs (Main Organization)
- **Owner**: `owner@innovationlabs.com` / `password123`
- **Role**: Main Organization Owner
- **Level**: 0 (Main Organization)
- **Capabilities**: Can manage users and tasks in their main org and all sub-organizations

## Sub-Organization Users

### Tech Solutions - Development Team (Sub-Organization)
- **Admin**: `admin@techsolutions-dev.com` / `password123`
- **Admin**: `admin2@techsolutions-dev.com` / `password123`
- **Viewer**: `viewer@techsolutions-dev.com` / `password123`
- **Viewer**: `viewer2@techsolutions-dev.com` / `password123`
- **Viewer**: `viewer3@techsolutions-dev.com` / `password123`

### Tech Solutions - QA Team (Sub-Organization)
- **Admin**: `admin@techsolutions-qa.com` / `password123`
- **Admin**: `admin2@techsolutions-qa.com` / `password123`
- **Viewer**: `viewer@techsolutions-qa.com` / `password123`
- **Viewer**: `viewer2@techsolutions-qa.com` / `password123`

### Global Enterprises - Finance Division (Sub-Organization)
- **Admin**: `admin@globalenterprises-finance.com` / `password123`
- **Admin**: `admin2@globalenterprises-finance.com` / `password123`
- **Viewer**: `viewer@globalenterprises-finance.com` / `password123`
- **Viewer**: `viewer2@globalenterprises-finance.com` / `password123`

### Global Enterprises - Marketing Division (Sub-Organization)
- **Admin**: `admin@globalenterprises-marketing.com` / `password123`
- **Admin**: `admin2@globalenterprises-marketing.com` / `password123`
- **Viewer**: `viewer@globalenterprises-marketing.com` / `password123`
- **Viewer**: `viewer2@globalenterprises-marketing.com` / `password123`

### Innovation Labs - Research Team (Sub-Organization)
- **Admin**: `admin@innovationlabs-research.com` / `password123`
- **Admin**: `admin2@innovationlabs-research.com` / `password123`
- **Viewer**: `viewer@innovationlabs-research.com` / `password123`
- **Viewer**: `viewer2@innovationlabs-research.com` / `password123`

### Innovation Labs - Product Team (Sub-Organization)
- **Admin**: `admin@innovationlabs-product.com` / `password123`
- **Admin**: `admin2@innovationlabs-product.com` / `password123`
- **Viewer**: `viewer@innovationlabs-product.com` / `password123`
- **Viewer**: `viewer2@innovationlabs-product.com` / `password123`

## Role Permissions & Capabilities

### Super Admin (Global Owner)
- ✅ **Create Task** (across all organizations)
- ✅ **Read Task** (across all organizations)
- ✅ **Update Task** (across all organizations)
- ✅ **Delete Task** (across all organizations)
- ✅ **Manage Users** (all organizations)
- ✅ **Manage Organizations**
- ✅ **Read Audit Log**
- **UI Behavior**: Dialogs include organization selection for CRUD operations

### Main Organization Owner
- ✅ **Create Task** (main org + all sub-organizations)
- ✅ **Read Task** (main org + all sub-organizations)
- ✅ **Update Task** (main org + all sub-organizations)
- ✅ **Delete Task** (main org + all sub-organizations)
- ✅ **Manage Users** (main org + all sub-organizations)
- ❌ **Manage Organizations** (globally)
- ✅ **Read Audit Log**
- **UI Behavior**: Can see and manage all sub-organizations under their main org

### Sub-Organization Admin
- ✅ **Create Task** (own sub-organization only)
- ✅ **Read Task** (own sub-organization only)
- ✅ **Update Task** (own sub-organization only)
- ✅ **Delete Task** (own sub-organization only)
- ✅ **Manage Users** (own sub-organization only)
- ❌ **Manage Organizations**
- ✅ **Read Audit Log**
- **UI Behavior**: Dialogs do NOT include organization selection (admin's sub-org is implicit)

### Sub-Organization Viewer
- ❌ **Create Task**
- ✅ **Read Task** (own sub-organization only)
- ❌ **Update Task**
- ❌ **Delete Task**
- ❌ **Manage Users**
- ❌ **Manage Organizations**
- ✅ **Read Audit Log**
- **UI Behavior**: Read-only access to tasks in their sub-organization

## Database Seeding

To seed the database with test data, use the seeder:

```bash
# Start the API
npm run start:api

# Seed the database with test credentials
curl -X POST http://localhost:3333/seed
```

**Alternative methods:**
- Use the development script: `./scripts/dev-start.sh` (includes automatic seeding)
- Use the reset script: `./scripts/reset-db.sh` (resets and seeds database)
- Use the seed script: `./scripts/seed-db.sh` (seeds existing database)

## Notes

- All users created through the user management interface will automatically have the password `password123`
- The Super Admin (`admin@system.com`) can see and manage all users and tasks across all organizations
- Main Organization Owners can see and manage users and tasks in their main organization and all sub-organizations
- Sub-Organization Admins can only see and manage users and tasks within their own sub-organization
- Sub-Organization Viewers have read-only access to tasks within their sub-organization
- The system supports a 2-level organization hierarchy:
  - **Level 0**: Main Organizations (with Owner users)
  - **Level 1**: Sub-Organizations (with Admin and Viewer users)
- The seeder creates 3 main organizations with 2 sub-organizations each:
  - **Tech Solutions Inc**: Development Team, QA Team
  - **Global Enterprises**: Finance Division, Marketing Division
  - **Innovation Labs**: Research Team, Product Team
- **UI Requirements**:
  - Super Admin's dialogs must include organization selection dropdown
  - Main Org Owner's dialogs can include organization selection for their main org and sub-orgs
  - Sub-org Admin's dialogs must NOT include organization selection (their sub-org is implicit)
  - Sub-org Viewer's interface is read-only for tasks
