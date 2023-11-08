const CommentLikeRepository = require('../../Domains/likes/CommentLikeRepository');

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addLike(like) {
    const id = `like-${this._idGenerator()}`;
    const { commentId, owner } = like;

    const query = {
      text: 'INSERT INTO user_comment_likes (id, comment, owner) VALUES ($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikesByThreadId(threadId) {
    const query = {
      text: `SELECT user_comment_likes.* FROM user_comment_likes 
      LEFT JOIN comments ON comments.id = user_comment_likes.comment
      WHERE comments.thread = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deleteLike(like) {
    const { commentId, owner } = like;

    const query = {
      text: 'DELETE FROM user_comment_likes WHERE comment = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async verifyUserCommentLike(like) {
    const { commentId, owner } = like;

    const query = {
      text: 'SELECT 1 FROM user_comment_likes WHERE comment = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return !!result.rowCount;
  }
}

module.exports = CommentLikeRepositoryPostgres;
