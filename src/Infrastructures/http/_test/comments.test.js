const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  const getAccessToken = async (server, payload = {
    username: 'foobar',
    password: 'secret',
    fullname: 'Foo Bar',
  }) => {
    // add user
    await server.inject({
      method: 'POST',
      url: '/users',
      payload,
    });

    // get access token
    const response = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: payload.username,
        password: payload.password,
      },
    });

    return JSON.parse(response.payload).data.accessToken;
  };

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and added comment', async () => {
      // Arrange
      const requestPayload = { content: 'A comment' };
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
      expect(responseJson.data.addedComment.content).toEqual(requestPayload.content);
    });

    it('should response 400 if payload not contain needed property', async () => {
      // Arrange
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200', async () => {
      // Arrange
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: { content: 'A comment' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: commentId } = JSON.parse(commentResponse.payload).data.addedComment;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 404 if comment is not exist', async () => {
      // Arrange
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/comment-678`,
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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: { content: 'A comment' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: commentId } = JSON.parse(commentResponse.payload).data.addedComment;

      // delete comment
      await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

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
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);
      const otherAccessToken = await getAccessToken(server, {
        username: 'otheruser',
        password: 'otherpassword',
        fullname: 'Anonymous',
      });

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: { content: 'A comment' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: commentId } = JSON.parse(commentResponse.payload).data.addedComment;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: { Authorization: `Bearer ${otherAccessToken}` }, // using different access token
      });

      // Assert
      expect(response.statusCode).toEqual(403);
    });

    it('should response 401 if headers not contain access token', async () => {
      // Arrange
      const server = await createServer(container);

      const accessToken = await getAccessToken(server);

      // add thread
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'A thread',
          body: 'A long thread',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: threadId } = JSON.parse(threadResponse.payload).data.addedThread;

      // add comment
      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: { content: 'A comment' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { id: commentId } = JSON.parse(commentResponse.payload).data.addedComment;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
      });

      // Assert
      expect(response.statusCode).toEqual(401);
    });
  });
});
