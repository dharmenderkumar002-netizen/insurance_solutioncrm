# Backend for insurance_solution_crm

## Setup
1. Copy `.env.example` to `.env` and edit values (MONGO, JWT_SECRET).
2. Install deps:
   npm install
3. Create uploads folders:
   mkdir -p uploads/pan uploads/aadhar uploads/gst uploads/policy uploads/rc uploads/other
4. (Optional) Run seed to create demo admin and sample data:
   npm run seed
5. Start server:
   npm run dev   (or npm start)

## Demo credentials
- Admin: admin@demo.com / Test@1234

## API Samples
- POST /api/auth/register  {name, email, mobile}
- POST /api/auth/login     {email, password}
- GET  /api/auth/approve/:userId
- GET  /api/gic/autocomplete?q=GIC-TEST
- POST /api/gic   (save GIC entry)
