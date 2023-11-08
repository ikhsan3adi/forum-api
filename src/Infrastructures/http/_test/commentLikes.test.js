const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const CommentLikesTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const ServerTestHelper = require('../../../../tests/ServerTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('comment likes endpoint', () => {
  let server;
  let serverTestHelper;

  beforeAll(async () => {
    server = await createServer(container);
    serverTestHelper = new ServerTestHelper(server);
  });

  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

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

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and like comment if comment is not liked', async () => {
      // Arrange
      // user login
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}/likes`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndUserId(
        dummyComment.id,
        userId,
      );
      expect(likes).toHaveLength(1);
    });

    it('should response 200 and unlike comment if comment is liked', async () => {
      // Arrange
      // user login
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });
      // add like
      await CommentLikesTableTestHelper.addLike({ commentId: dummyComment.id, owner: userId });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}/likes`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      const likes = await CommentLikesTableTestHelper.findLikeByCommentIdAndUserId(
        dummyComment.id,
        userId,
      );
      expect(likes).toHaveLength(0);
    });

    it('should response 404 if liked comment is not exist in thread', async () => {
      // Arrange
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // add other thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, id: 'other-thread', owner: userId });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/other-thread/comments/${dummyComment.id}/likes`, // wrong thread
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar dalam thread tidak ditemukan');
    });

    it('should response 404 if comment is not exist', async () => {
      // Arrange
      // user login
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${dummyThread.id}/comments/comment-789/likes`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 if comment is not valid or deleted', async () => {
      // Arrange
      // user login
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // delete comment
      await server.inject({
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}/likes`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak valid');
    });

    it('should response 404 if thread is not exist', async () => {
      // Arrange
      const { accessToken } = await serverTestHelper.getAccessTokenAndUserId();

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: '/threads/thread-345/comments/comment-321/likes',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 401 if headers not contain access token', async () => {
      // Arrange
      const { userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}/likes`,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });
});
