/* eslint-disable camelcase */
class CommentDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, content, date, replies, is_delete,
    } = payload;

    this.id = id;
    this.username = username;
    this.content = is_delete ? '**komentar telah dihapus**' : content;
    this.date = date;
    this.replies = replies;
  }

  _verifyPayload(payload) {
    const {
      id,
      username,
      content,
      date,
      replies,
    } = payload;

    if (!id || !username || !content || !date) {
      throw new Error('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof content !== 'string'
      || (typeof date !== 'string' && typeof date !== 'object')
      || !Array.isArray(replies)
    ) {
      throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = CommentDetail;
