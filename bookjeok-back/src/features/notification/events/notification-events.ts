export class ReviewCommentCreatedEvent {
  constructor(
    public readonly reviewId: number,
    public readonly bookTitle: string,
    public readonly commentContent: string,
    public readonly recipientId: number,
    public readonly actorId: number,
    public readonly actorNickname: string,
    public readonly actorProfileUrl: string | null,
  ) {}
}

export class ReviewReactionCreatedEvent {
  constructor(
    public readonly reviewId: number,
    public readonly bookTitle: string,
    public readonly recipientId: number,
    public readonly actorId: number,
    public readonly actorNickname: string,
    public readonly actorProfileUrl: string | null,
  ) {}
}

export class CommentLikeCreatedEvent {
  constructor(
    public readonly commentId: number,
    public readonly reviewId: number | null,
    public readonly recipientId: number,
    public readonly actorId: number,
    public readonly actorNickname: string,
    public readonly actorProfileUrl: string | null,
  ) {}
}
