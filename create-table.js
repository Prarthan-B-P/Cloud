import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  multipleStatements: true
});

const schema = `
DROP TABLE IF EXISTS rsvps;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('guest', 'host') NOT NULL DEFAULT 'guest',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  host_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200) NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  capacity INT NULL,
  poster_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_host
    FOREIGN KEY (host_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rsvps (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  response ENUM('yes', 'no', 'maybe') NOT NULL,
  guests_count INT NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_event_user (event_id, user_id),
  CONSTRAINT fk_rsvps_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_rsvps_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
`;

try {
  await pool.query(schema);
  console.log('Database tables created successfully.');
} catch (error) {
  console.error('Error creating database tables:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
