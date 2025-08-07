# Database Setup for Property Inspector

This directory contains the database schema and setup instructions for the Property Inspector application.

## Quick Setup

1. **Open your Supabase dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project

2. **Run the SQL schema**
   - Go to the "SQL Editor" in your Supabase dashboard
   - Copy the contents of `schema.sql`
   - Paste and run the SQL commands

3. **Verify the setup**
   - Check the "Table Editor" to confirm the tables were created
   - Verify Row Level Security (RLS) is enabled

## Database Structure

### Tables

#### `inspections`
Main table for property inspection records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `address` | TEXT | Property address |
| `inspection_type` | VARCHAR(20) | Type: 'entry', 'exit', or 'routine' |
| `owner_name` | VARCHAR(255) | Property owner name |
| `tenant_name` | VARCHAR(255) | Tenant name (optional) |
| `inspection_date` | DATE | Scheduled inspection date |
| `inspector_id` | UUID | Foreign key to auth.users |
| `status` | VARCHAR(20) | Status: 'pending', 'in_progress', 'completed', 'cancelled' |
| `notes` | TEXT | General inspection notes |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### `inspection_items`
Detailed checklist items for each inspection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `inspection_id` | UUID | Foreign key to inspections table |
| `category` | VARCHAR(100) | Item category (kitchen, bathroom, etc.) |
| `item_name` | VARCHAR(255) | Specific item being inspected |
| `condition` | VARCHAR(20) | Condition: 'good', 'fair', 'poor', 'damaged', 'not_applicable' |
| `notes` | TEXT | Item-specific notes |
| `photo_urls` | TEXT[] | Array of photo URLs |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### `rooms`
Room selection for each inspection.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `inspection_id` | UUID | Foreign key to inspections table |
| `room_name` | VARCHAR(100) | Name of the room |
| `room_type` | VARCHAR(50) | Type: 'standard' or 'custom' |
| `is_selected` | BOOLEAN | Whether room is selected for inspection |
| `notes` | TEXT | Room-specific notes |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own inspection records
- Policies are automatically enforced based on the authenticated user

### Indexes

Optimized indexes are created for:
- Inspector lookups
- Date-based queries
- Status filtering
- Inspection item relationships

## Sample Categories

Common inspection categories include:

- **Kitchen**: Sink, faucet, countertops, cabinets, appliances
- **Bathroom**: Toilet, shower/tub, ventilation, water pressure
- **Living Areas**: Walls, flooring, windows, lighting
- **Bedrooms**: Same as living areas plus closets
- **Exterior**: Roof, gutters, paint, driveway, landscaping
- **HVAC**: Heating, cooling, ventilation systems
- **Electrical**: Outlets, switches, panel, fixtures
- **Plumbing**: Water pressure, leaks, drainage

## Environment Variables

Ensure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Setup

After running the schema:

1. Sign up/login to your application
2. Navigate to `/inspections/new`
3. Create a test inspection
4. Verify the data appears in your Supabase dashboard

## Troubleshooting

### Common Issues

1. **RLS Policies**: If you get permission errors, verify RLS policies are correctly applied
2. **Foreign Key Constraints**: Ensure the user is authenticated before creating inspections
3. **Missing Tables**: Re-run the schema.sql file if tables are missing

### Verification Queries

Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('inspections', 'inspection_items');
```

Check RLS status:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('inspections', 'inspection_items');
```

## Next Steps

1. **Extend the schema** as needed for your specific inspection requirements
2. **Add custom inspection templates** for different property types
3. **Implement photo upload** functionality using Supabase Storage
4. **Create reports and analytics** based on inspection data