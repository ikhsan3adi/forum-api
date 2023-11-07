/* eslint-disable camelcase */
class CommentDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, content, date, replies, likeCount, is_delete,
    } = payload;

    this.id = id;
    this.username = username;
    this.content = is_delete ? '**komentar telah dihapus**' : content;
    this.date = date;
    this.replies = replies;
    this.likeCount = likeCount;
  }

  _verifyPayload(payload) {
    const {
      id,
      username,
      content,
      date,
      replies,
      likeCount,
    } = payload;

    if (!id || !username || !content || !date || likeCount === undefined) {
      throw new Error('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof content !== 'string'
      || (typeof date !== 'string' && typeof date !== 'object')
      || !Array.isArray(replies)
      || typeof likeCount !== 'number'
    ) {
      throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = CommentDetail;
