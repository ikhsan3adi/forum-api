const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async checkReplyAvailability(id) {
    const query = {
      text: 'SELECT id, deleted_at FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }

    if (result.rows[0].deleted_at) {
      throw new NotFoundError('balasan tidak valid');
    }
  }

  async verifyReplyOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    const reply = result.rows[0];

    if (reply.owner !== owner) {
      throw new AuthorizationError('akses dilarang');
    }
  }

  async addReply(userId, commentId, newReply) {
    const { content } = newReply;
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, date, commentId, userId],
    };

    const result = await this._pool.query(query);

    return new AddedReply({ ...result.rows[0] });
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: 'SELECT replies.id, users.username, replies.date, replies.content, replies.deleted_at FROM replies LEFT JOIN users ON users.id = replies.owner WHERE replies.comment = $1 ORDER BY replies.date ASC',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deleteReplyById(id) {
    const date = new Date().toISOString();

    const query = {
      text: 'UPDATE replies SET deleted_at = $1 WHERE id = $2',
      values: [date, id],
    };

    await this._pool.query(query);
  }
}

module.exports = ReplyRepositoryPostgres;
