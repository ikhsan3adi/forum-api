const ReplyDetail = require('../ReplyDetail');

describe('ReplyDetail entities', () => {
  it('should throw error when payload not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      username: 'foobar',
    };

    // Action & Assert
    expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload does not meet data type requirements', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      username: 'foobar',
      content: 'a reply',
      date: 321,
    };

    // Action & Assert
    expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create ReplyDetail entities correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      username: 'foobar',
      content: 'a reply',
      date: '2023-09-22T07:19:09.775Z',
    };

    // Action
    const replyDetail = new ReplyDetail(payload);

    // Assert
    expect(replyDetail).toBeInstanceOf(ReplyDetail);
    expect(replyDetail.id).toEqual(payload.id);
    expect(replyDetail.username).toEqual(payload.username);
    expect(replyDetail.content).toEqual(payload.content);
    expect(replyDetail.date).toEqual(payload.date);
  });

  it('should create deleted ReplyDetail entities correctly', () => {
    // Arrange
    const payload = {
      id: 'reply-123',
      username: 'foobar',
      content: 'a reply',
      date: '2023-09-22T07:19:09.775Z',
      is_delete: true,
    };

    // Action
    const replyDetail = new ReplyDetail(payload);

    // Assert
    expect(replyDetail).toBeInstanceOf(ReplyDetail);
    expect(replyDetail.id).toEqual(payload.id);
    expect(replyDetail.username).toEqual(payload.username);
    expect(replyDetail.content).toEqual('**balasan telah dihapus**');
    expect(replyDetail.date).toEqual(payload.date);
  });
});
