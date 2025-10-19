# Database Seeding Scripts

This directory contains scripts to populate the Horse Health Monitoring System database with sample data.

## Available Scripts

### `seed-data.ts`
Populates the database with comprehensive sample data including:

- **3 Organizations**: Melbourne Racing Stables, Sydney Equestrian Center, Kentucky Derby Training Facility
- **55 Tracks**:
  - 17 Australian racetracks (Flemington, Royal Randwick, Eagle Farm, etc.)
  - 23 US racetracks (Churchill Downs, Belmont Park, Santa Anita, etc.)
  - 15 training facilities (distributed across organizations)
- **50 Monitoring Devices**: Assigned to horses and organizations
- **30 Horses**: Various breeds with realistic health records
- **100 Training Sessions**: With performance data and injury risk assessments
- **50 Session Comments**: Trainer feedback on sessions
- **~20 Injury Records**: Flagged, diagnosed, and dismissed injuries
- **40 Upcoming Care Appointments**: Scheduled veterinary and maintenance tasks
- **5 Sample Invitations**: Pending user invitations
- **2 Organization Requests**: Sample create/transfer requests
- **1 Track Request**: Sample track creation request

### `clear-and-seed.ts`
Safely clears all existing data from the database before seeding.

## Usage

### First Time Setup

```bash
# Ensure database schema is up to date
pnpm db:push

# Seed the database
npx tsx scripts/seed-data.ts
```

### Resetting Data

```bash
# Clear existing data and reseed
npx tsx scripts/clear-and-seed.ts && npx tsx scripts/seed-data.ts
```

### Quick Reset

```bash
# One-liner to reset everything
cd /home/ubuntu/horse-health-monitor && npx tsx scripts/clear-and-seed.ts && npx tsx scripts/seed-data.ts
```

## Data Details

### Australian Racetracks (17 total)

**Victoria:**
- Flemington Racecourse (Melbourne Cup)
- Caulfield Racecourse
- Moonee Valley Racecourse (Cox Plate)
- Sandown Racecourse

**New South Wales:**
- Royal Randwick Racecourse
- Rosehill Gardens Racecourse
- Canterbury Park Racecourse
- Warwick Farm Racecourse

**Queensland:**
- Eagle Farm Racecourse
- Doomben Racecourse
- Gold Coast Turf Club

**South Australia:**
- Morphettville Racecourse
- Cheltenham Park Racecourse

**Western Australia:**
- Ascot Racecourse
- Belmont Park Racecourse

**Tasmania:**
- Elwick Racecourse
- Mowbray Racecourse

### United States Racetracks (23 total)

**Kentucky:**
- Churchill Downs (Kentucky Derby)
- Keeneland

**New York:**
- Belmont Park (Belmont Stakes)
- Saratoga Race Course
- Aqueduct Racetrack

**California:**
- Santa Anita Park
- Del Mar Racetrack
- Golden Gate Fields
- Los Alamitos Race Course

**Florida:**
- Gulfstream Park
- Tampa Bay Downs

**Maryland:**
- Pimlico Race Course (Preakness Stakes)
- Laurel Park

**Illinois:**
- Arlington Park
- Hawthorne Race Course

**New Jersey:**
- Monmouth Park
- The Meadowlands

**Pennsylvania:**
- Parx Racing
- Penn National Race Course

**Other States:**
- Fair Grounds Race Course (Louisiana)
- Oaklawn Racing Casino Resort (Arkansas)
- Lone Star Park (Texas)
- Remington Park (Oklahoma)

### Training Facilities (5 types per organization)

- Indoor Training Arena
- Outdoor Training Track
- Cross Country Course
- Sand Training Track
- Turf Training Track

### Horse Breeds Included

- Thoroughbred
- Quarter Horse
- Arabian
- Standardbred
- Paint Horse
- Appaloosa
- Morgan
- Tennessee Walking Horse
- Warmblood
- Australian Stock Horse

### Care Types

- Veterinary Checkup
- Dental Examination
- Farrier Service
- Vaccination
- Deworming
- Physical Therapy
- Chiropractic Adjustment
- Nutritional Assessment
- Grooming Session
- Exercise Evaluation

## Customization

To customize the seed data:

1. Edit `scripts/seed-data.ts`
2. Modify the data arrays at the top of the file
3. Adjust the number of items created in the seed loops
4. Run the seed script again

## Troubleshooting

### Duplicate Entry Errors

If you see duplicate entry errors, the database already has data. Run the clear script first:

```bash
npx tsx scripts/clear-and-seed.ts
```

### Table Doesn't Exist Errors

Make sure the database schema is up to date:

```bash
pnpm db:push
```

### Connection Errors

Verify your `DATABASE_URL` environment variable is set correctly in `.env`

## Notes

- The seed script uses realistic data for demonstration purposes
- All dates are generated relative to the current date
- Performance data includes realistic heart rate, speed, and gait metrics
- Injury risk levels are distributed across low, medium, high, and critical
- Device serial numbers follow the format `HHM-XXXX`
- Organizations are assigned owners (owner1, owner2, owner3)

## Production Warning

⚠️ **Do not run these scripts on production databases!**

These scripts are intended for development and testing only. They will clear all existing data when using `clear-and-seed.ts`.

