const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ServerTestHelper = require('../../../../tests/ServerTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('threads comments endpoint', () => {
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

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and added comment', async () => {
      // Arrange
      const requestPayload = { content: 'A comment' };

      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${dummyThread.id}/comments`,
        payload: requestPayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeTruthy();
      expect(responseJson.data.addedComment.content).toEqual(requestPayload.content);
    });

    it('should response 400 if payload not contain needed property', async () => {
      // Arrange
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${dummyThread.id}/comments`,
        payload: {},
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 if payload wrong data type', async () => {
      // Arrange
      const requestPayload = { content: 1234 };

      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${dummyThread.id}/comments`,
        payload: requestPayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar harus berupa string');
    });

    it('should response 404 if thread is not exist', async () => {
      // Arrange
      const requestPayload = { content: 'A comment' };

      const { accessToken } = await serverTestHelper.getAccessTokenAndUserId();

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-567/comments',
        payload: requestPayload,
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
      const requestPayload = { content: 'A comment' };

      const { userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${dummyThread.id}/comments`,
        payload: requestPayload,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    const dummyComment = {
      id: 'comment-123',
      content: 'A comment',
      date: new Date().toISOString(),
      thread: 'thread-123',
      isDelete: false,
    };

    it('should response 200', async () => {
      // Arrange
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 404 if comment is not exist', async () => {
      // Arrange
      const { accessToken, userId } = await serverTestHelper.getAccessTokenAndUserId();

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/comment-678`,
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
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak valid');
    });

    it('should response 404 if comment is not exist in thread', async () => {
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
        method: 'DELETE',
        url: `/threads/other-thread/comments/${dummyComment.id}`, // wrong thread
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar dalam thread tidak ditemukan');
    });

    it('should response 404 if thread is not exist', async () => {
      // Arrange
      const { accessToken } = await serverTestHelper.getAccessTokenAndUserId();

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-456/comments/comment-123',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 403 if comment owner is not authorized', async () => {
      // Arrange
      const { userId } = await serverTestHelper.getAccessTokenAndUserId();
      const { accessToken: otherAccessToken } = await serverTestHelper.getAccessTokenAndUserId(
        {
          username: 'otheruser',
          password: 'otherpassword',
          fullname: 'Anonymous',
        },
      );

      // add thread
      await ThreadsTableTestHelper.addThread({ ...dummyThread, owner: userId });
      // add comment
      await CommentsTableTestHelper.addComment({ ...dummyComment, owner: userId });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}`,
        headers: { Authorization: `Bearer ${otherAccessToken}` }, // using different access token
      });

      // Assert
      expect(response.statusCode).toEqual(403);
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
        method: 'DELETE',
        url: `/threads/${dummyThread.id}/comments/${dummyComment.id}`,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });
});
