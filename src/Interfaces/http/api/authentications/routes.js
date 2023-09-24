const routes = (handler) => ([
  {
    method: 'POST',
    path: '/authentications',
    handler: (request, h) => handler.postAuthenticationHandler(request, h),
  },
  {
    method: 'PUT',
    path: '/authentications',
    handler: (request) => handler.putAuthenticationHandler(request),
  },
  {
    method: 'DELETE',
    path: '/authentications',
    handler: (request) => handler.deleteAuthenticationHandler(request),
  },
]);

module.exports = routes;
