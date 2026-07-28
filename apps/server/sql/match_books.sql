-- =============================================================
-- Supabase pgvector: 도서 벡터 유사도 검색 함수
-- =============================================================
-- 이 파일은 Supabase 대시보드에 배포된 RPC 함수의 레포 내 사본입니다.
-- 변경 시 Supabase 대시보드에서도 동일하게 반영해야 합니다.
--
-- 사용처: VectorSearchService.searchSimilarBooks()
-- 거리 함수: cosine distance (<=>), 유사도 = 1 - distance (높을수록 유사)
-- =============================================================

CREATE OR REPLACE FUNCTION match_books(
  query_embedding vector(768),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  isbn text,
  title text,
  author text,
  publisher text,
  description text,
  image text,
  similarity float
) AS $$
  SELECT
    isbn, title, author, publisher, description, image,
    1 - (embedding <=> query_embedding) AS similarity
  FROM books
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
