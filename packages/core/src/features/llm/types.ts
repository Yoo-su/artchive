export interface TalkRequest {
  message: string;
  history?: string;
}

export interface RecommendedBook {
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  isbn: string;
  pubdate: string;
}

export interface TalkResponse {
  message: string;
  isFinal: boolean;
  recommendedBooks?: RecommendedBook[];
}
