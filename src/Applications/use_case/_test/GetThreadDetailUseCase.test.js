const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const ThreadDetail = require('../../../Domains/threads/entities/ThreadDetail');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const CommentDetail = require('../../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../../Domains/replies/entities/ReplyDetail');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    // Arrange
    const mockThreadDetail = {
      id: 'thread-123',
      title: 'A thread',
      body: 'A long thread',
      date: '2023-09-07T00:00:00.000Z',
      username: 'foobar',
    };

    const mockComments = [
      {
        id: 'comment-1',
        username: 'johndoe',
        date: '2023-09-07T00:00:00.000Z',
        content: 'a comment',
        is_delete: false,
      },
      {
        id: 'comment-2',
        username: 'foobar',
        date: '2023-09-08T00:00:00.000Z',
        content: 'a deleted comment',
        is_delete: true,
      },
    ];

    const mockReplies = [
      {
        id: 'reply-1',
        username: 'johndoe',
        date: '2023-09-08T00:00:00.000Z',
        content: 'a reply',
        is_delete: false,
      },
      {
        id: 'reply-2',
        username: 'foobar',
        date: '2023-09-09T00:00:00.000Z',
        content: 'a deleted reply',
        is_delete: true,
      },
    ];

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockreplyRepository = new ReplyRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(mockThreadDetail));
    mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve(mockComments));
    mockreplyRepository.getRepliesByCommentId = jest.fn(() => Promise.resolve(mockReplies));

    /** creating use case instance */
    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockreplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute('thread-123');

    // Assert
    expect(threadDetail).toStrictEqual(new ThreadDetail({
      id: 'thread-123',
      title: 'A thread',
      body: 'A long thread',
      date: '2023-09-07T00:00:00.000Z',
      username: 'foobar',
      comments: [
        new CommentDetail({
          id: 'comment-1',
          username: 'johndoe',
          date: '2023-09-07T00:00:00.000Z',
          content: 'a comment',
          replies: [
            new ReplyDetail({
              id: 'reply-1',
              username: 'johndoe',
              content: 'a reply',
              date: '2023-09-08T00:00:00.000Z',
            }),
            new ReplyDetail({
              id: 'reply-2',
              username: 'foobar',
              date: '2023-09-09T00:00:00.000Z',
              content: '**balasan telah dihapus**',
            }),
          ],
        }),
        new CommentDetail({
          id: 'comment-2',
          username: 'foobar',
          date: '2023-09-08T00:00:00.000Z',
          content: '**komentar telah dihapus**',
          replies: [],
        }),
      ],
    }));
    expect(mockThreadRepository.getThreadById).toBeCalledWith('thread-123');
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith('thread-123');
    expect(mockreplyRepository.getRepliesByCommentId).toBeCalledTimes(1);
    expect(mockreplyRepository.getRepliesByCommentId).toBeCalledWith('comment-1');
  });
});
