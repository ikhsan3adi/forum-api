const LikeOrDislikeCommentUseCase = require('../../../../Applications/use_case/LikeOrDislikeCommentUseCase');

class LikesHandler {
  constructor(container) {
    this._container = container;
  }

  async putLikeHandler(request, h) {
    const { id: userId } = request.auth.credentials;

    const likeOrDislikeCommentUseCase = this._container.getInstance(
      LikeOrDislikeCommentUseCase.name,
    );

    await likeOrDislikeCommentUseCase.execute(userId, request.params);

    const response = h.response({
      status: 'success',
    });

    response.code(200);
    return response;
  }
}

module.exports = LikesHandler;
