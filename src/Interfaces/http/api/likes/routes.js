const routes = (handler) => ([
  {
    method: 'PUT',
    path: '/threads/{threadId}/comments/{commentId}/likes',
    handler: (request, h) => handler.putLikeHandler(request, h),
    options: {
      auth: 'forum_jwt',
    },
  },
]);

module.exports = routes;
