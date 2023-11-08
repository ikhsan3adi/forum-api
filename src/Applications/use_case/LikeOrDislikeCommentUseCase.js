const Like = require('../../Domains/likes/entities/Like');

class LikeOrDislikeCommentUseCase {
  constructor({
    commentLikeRepository,
    commentRepository,
    threadRepository,
  }) {
    this._commentLikeRepository = commentLikeRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(userId, useCaseParams) {
    const { threadId, commentId } = useCaseParams;
    await this._threadRepository.checkThreadAvailability(threadId);
    await this._commentRepository.checkCommentAvailability(commentId, threadId);

    const like = new Like({
      commentId,
      owner: userId,
    });

    const isCommentLiked = await this._commentLikeRepository.verifyUserCommentLike(like);

    return await isCommentLiked
      ? this._commentLikeRepository.deleteLike(like)
      : this._commentLikeRepository.addLike(like);
  }
}

module.exports = LikeOrDislikeCommentUseCase;
