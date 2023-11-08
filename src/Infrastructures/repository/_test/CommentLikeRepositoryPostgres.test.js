const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentLikeRepositoryPostgres = require('../CommentLikeRepositoryPostgres');
const Like = require('../../../Domains/likes/entities/Like');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');

describe('CommentLikeRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  const dummyUserId = 'user-123';

  const dummyThread = {
    id: 'thread-123',
    title: 'A New Thread',
    body: 'Thread body',
    date: new Date().toISOString(),
  };

  const dummyComment = {
    id: 'comment-123',
    content: 'A comment',
    date: new Date().toISOString(),
    thread: dummyThread.id,
    isDelete: false,
  };

  describe('addLike', () => {
    it('should add a like to the database', async () => {
      // Arrange
      // add user
      await UsersTableTestHelper.addUser({ id: dummyUserId });
      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: dummyUserId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: dummyUserId });

      const newLike = new Like({ commentId: dummyComment.id, owner: dummyUserId });

      const fakeIdGenerator = () => '123';
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await commentLikeRepositoryPostgres.addLike(newLike);

      // Assert
      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndUserId(
        dummyComment.id,
        dummyUserId,
      );
      expect(likes[0]).toStrictEqual({
        id: 'like-123',
        comment: 'comment-123',
        owner: 'user-123',
      });
    });
  });

  describe('verifyUserCommentLike', () => {
    it('should return true if a user has liked a comment', async () => {
      // Arrange
      const like = new Like({
        commentId: dummyComment.id,
        owner: dummyUserId,
      });

      // add user
      await UsersTableTestHelper.addUser({ id: dummyUserId });
      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: dummyUserId });
      // add comments
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: dummyUserId });
      // add like
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', ...like });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const isCommentLiked = await commentLikeRepositoryPostgres.verifyUserCommentLike(like);

      // Assert
      expect(isCommentLiked).toBe(true);
    });

    it('should return false if a user has not liked a comment', async () => {
      // Arrange
      const like = new Like({
        commentId: dummyComment.id,
        owner: dummyUserId,
      });

      // add user
      await UsersTableTestHelper.addUser({ id: dummyUserId });
      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: dummyUserId });
      // add comments
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: dummyUserId });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const isCommentLiked = await commentLikeRepositoryPostgres.verifyUserCommentLike(like);

      // Assert
      expect(isCommentLiked).toBe(false);
    });
  });

  describe('getLikesByThreadId', () => {
    it('should return the likes for a thread', async () => {
      // Arrange
      // add user
      await UsersTableTestHelper.addUser({ id: dummyUserId });
      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: dummyUserId });
      // add comments
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: dummyUserId });
      await CommentsTableTestHelper.addComment({ ...dummyComment, id: 'other-comment', owner: dummyUserId });
      // add likes
      await CommentLikesTableTestHelper.addLike({
        id: 'like-1',
        commentId: dummyComment.id,
        owner: dummyUserId,
      });
      await CommentLikesTableTestHelper.addLike({
        id: 'like-2',
        commentId: 'other-comment',
        owner: dummyUserId,
      });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      const threadCommentLikes = await commentLikeRepositoryPostgres
        .getLikesByThreadId(dummyThread.id);

      // Assert
      expect(threadCommentLikes).toHaveLength(2);
      expect(threadCommentLikes[0].id).toStrictEqual('like-1');
      expect(threadCommentLikes[0].comment).toStrictEqual(dummyComment.id);
      expect(threadCommentLikes[1].id).toStrictEqual('like-2');
      expect(threadCommentLikes[1].comment).toStrictEqual('other-comment');
    });
  });

  describe('deleteLike', () => {
    it('should delete a like from the database', async () => {
      // Arrange
      const like = new Like({
        commentId: dummyComment.id,
        owner: dummyUserId,
      });

      // add user
      await UsersTableTestHelper.addUser({ id: dummyUserId });
      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: dummyUserId });
      // add comments
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: dummyUserId });
      // add like
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', ...like });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      // Action
      await commentLikeRepositoryPostgres.deleteLike(like);

      // Assert
      const likes = await CommentLikesTableTestHelper.findLikeById('like-123');
      expect(likes).toHaveLength(0);
    });
  });
});
