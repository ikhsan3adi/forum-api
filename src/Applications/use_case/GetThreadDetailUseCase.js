const CommentDetail = require('../../Domains/comments/entities/CommentDetail');
const ReplyDetail = require('../../Domains/replies/entities/ReplyDetail');
const ThreadDetail = require('../../Domains/threads/entities/ThreadDetail');

class GetThreadDetailUseCase {
  constructor({
    threadRepository,
    commentRepository,
    replyRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(threadId) {
    const threadDetail = await this._threadRepository.getThreadById(threadId);
    const threadComments = await this._commentRepository.getCommentsByThreadId(threadId);

    threadDetail.comments = await Promise.all(threadComments.map(async (comment) => {
      let replies = [];

      if (!comment.deleted_at) {
        const commentReplies = await this._replyRepository.getRepliesByCommentId(comment.id);
        replies = commentReplies.map((reply) => new ReplyDetail({
          ...reply,
          content: reply.deleted_at ? '**balasan telah dihapus**' : reply.content,
        }));
      }

      return new CommentDetail({
        ...comment,
        content: comment.deleted_at ? '**komentar telah dihapus**' : comment.content,
        replies,
      });
    }));

    return new ThreadDetail(threadDetail);
  }
}

module.exports = GetThreadDetailUseCase;
