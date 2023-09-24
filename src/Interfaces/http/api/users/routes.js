const routes = (handler) => ([
  {
    method: 'POST',
    path: '/users',
    handler: (request, h) => handler.postUserHandler(request, h),
  },
]);

module.exports = routes;
