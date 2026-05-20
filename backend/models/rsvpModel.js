import pool from '../config/db.js';

export const RsvpModel = {
  async upsertForUser({ id, eventId, userId, response, guestsCount, notes }) {
    await pool.execute(
      `INSERT INTO rsvps (id, event_id, user_id, response, guests_count, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         response = VALUES(response),
         guests_count = VALUES(guests_count),
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [id, eventId, userId, response, guestsCount, notes]
    );

    const [rows] = await pool.execute(
      `SELECT
        r.id,
        r.event_id AS eventId,
        r.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        r.response,
        r.guests_count AS guestsCount,
        r.notes,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt
      FROM rsvps r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ? AND r.user_id = ?
      LIMIT 1`,
      [eventId, userId]
    );

    return rows[0] || null;
  },

  async listByEvent(eventId) {
    const [rows] = await pool.execute(
      `SELECT
        r.id,
        r.event_id AS eventId,
        r.user_id AS userId,
        u.name AS userName,
        u.email AS userEmail,
        u.role AS userRole,
        r.response,
        r.guests_count AS guestsCount,
        r.notes,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt
      FROM rsvps r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC`,
      [eventId]
    );
    return rows;
  },

  async listByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT
        r.id,
        r.event_id AS eventId,
        e.title AS eventTitle,
        e.poster_url AS posterUrl,
        e.location,
        e.start_at AS startAt,
        r.user_id AS userId,
        r.response,
        r.guests_count AS guestsCount,
        r.notes,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt
      FROM rsvps r
      INNER JOIN events e ON e.id = r.event_id
      WHERE r.user_id = ?
      ORDER BY e.start_at ASC`,
      [userId]
    );
    return rows;
  }
};
