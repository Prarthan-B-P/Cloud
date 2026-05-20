import pool from '../config/db.js';

const eventBaseSelect = `
  SELECT
    e.id,
    e.host_id AS hostId,
    u.name AS hostName,
    u.email AS hostEmail,
    e.title,
    e.description,
    e.location,
    e.start_at AS startAt,
    e.end_at AS endAt,
    e.capacity,
    e.poster_url AS posterUrl,
    e.created_at AS createdAt,
    e.updated_at AS updatedAt
  FROM events e
  INNER JOIN users u ON u.id = e.host_id
`;

const applyStats = async (rows) => {
  if (!rows.length) return rows;

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => '?').join(', ');

  const [statsRows] = await pool.execute(
    `
      SELECT
        event_id AS eventId,
        SUM(CASE WHEN response = 'yes' THEN 1 ELSE 0 END) AS yesCount,
        SUM(CASE WHEN response = 'no' THEN 1 ELSE 0 END) AS noCount,
        SUM(CASE WHEN response = 'maybe' THEN 1 ELSE 0 END) AS maybeCount,
        COUNT(*) AS rsvpCount
      FROM rsvps
      WHERE event_id IN (${placeholders})
      GROUP BY event_id
    `,
    ids
  );

  const statsByEventId = new Map(
    statsRows.map((row) => [
      row.eventId,
      {
        yesCount: Number(row.yesCount || 0),
        noCount: Number(row.noCount || 0),
        maybeCount: Number(row.maybeCount || 0),
        rsvpCount: Number(row.rsvpCount || 0)
      }
    ])
  );

  return rows.map((row) => ({
    ...row,
    ...(statsByEventId.get(row.id) || {
      yesCount: 0,
      noCount: 0,
      maybeCount: 0,
      rsvpCount: 0
    })
  }));
};

export const EventModel = {
  async listAll() {
    const [rows] = await pool.execute(`${eventBaseSelect} ORDER BY e.start_at ASC`);
    return applyStats(rows);
  },

  async listByHost(hostId) {
    const [rows] = await pool.execute(`${eventBaseSelect} WHERE e.host_id = ? ORDER BY e.start_at ASC`, [hostId]);
    return applyStats(rows);
  },

  async findById(id) {
    const [rows] = await pool.execute(`${eventBaseSelect} WHERE e.id = ? LIMIT 1`, [id]);
    const enriched = await applyStats(rows);
    return enriched[0] || null;
  },

  async create({ id, hostId, title, description, location, startAt, endAt, capacity, posterUrl }) {
    await pool.execute(
      `INSERT INTO events (id, host_id, title, description, location, start_at, end_at, capacity, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, hostId, title, description, location, startAt, endAt, capacity, posterUrl]
    );
    return this.findById(id);
  },

  async update(id, updates) {
    const columns = [];
    const values = [];

    if (updates.title !== undefined) { columns.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { columns.push('description = ?'); values.push(updates.description); }
    if (updates.location !== undefined) { columns.push('location = ?'); values.push(updates.location); }
    if (updates.startAt !== undefined) { columns.push('start_at = ?'); values.push(updates.startAt); }
    if (updates.endAt !== undefined) { columns.push('end_at = ?'); values.push(updates.endAt); }
    if (updates.capacity !== undefined) { columns.push('capacity = ?'); values.push(updates.capacity); }
    if (updates.posterUrl !== undefined) { columns.push('poster_url = ?'); values.push(updates.posterUrl); }

    if (columns.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await pool.execute(
      `UPDATE events SET ${columns.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  },

  async remove(id) {
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};
