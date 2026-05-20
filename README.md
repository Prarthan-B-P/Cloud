# RSVP Studio

A professional RSVP event management system built with Express.js, React, AWS RDS MySQL, and AWS S3 poster uploads.

## Stack

- Node.js + Express
- React + Vite
- AWS RDS MySQL
- AWS S3 for event posters
- JWT auth
- Custom responsive UI

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Set environment variables in `.env`:

```env
DB_HOST=your-rds-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database

JWT_SECRET=your-secret
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-bucket-name
AWS_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_PUBLIC_BASE_URL=https://your-bucket-or-cloudfront-url
```

3. Create the schema:

```bash
npm run setup-db
```

4. Build the frontend:

```bash
npm run build
```

5. Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Features

- Register and login with JWT auth
- Host and guest views
- Full CRUD for events
- RSVP with yes/no/maybe, guest count, and notes
- S3 poster upload on event create/update
- Responsive React UI

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/events`
- `GET /api/events/mine`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/rsvp/events/:eventId/rsvps`
- `GET /api/rsvp/events/:eventId/rsvps`
- `GET /api/rsvp/me/rsvps`

## Production Deploy

1. Install dependencies with `npm install`.
2. Build the frontend with `npm run build`.
3. Start the server with `npm start`.
4. Ensure your EC2 instance has the `.env` values for RDS, JWT, and S3.

## Database schema

See [create-table.js](./create-table.js) for the current schema definition.
