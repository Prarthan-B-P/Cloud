import pool from '../config/db.js';

export const UserModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ id, name, email, passwordHash, role }) {
    await pool.execute(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, passwordHash, role]
    );
    return this.findById(id);
  }
};
