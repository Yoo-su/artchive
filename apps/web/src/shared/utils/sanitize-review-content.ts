import sanitizeHtml from "sanitize-html";

// 리뷰 본문은 Tiptap 에디터가 만들어낸 HTML이지만, API로 직접 POST하면 임의의
// HTML을 저장할 수 있으므로 렌더링 직전에 항상 sanitize합니다.
//
// jsdom 기반 sanitizer(isomorphic-dompurify)는 서버 번들에 jsdom을 끌고 들어와
// Vercel 런타임에서 ERR_REQUIRE_ESM으로 SSR이 통째로 실패했습니다. sanitize-html은
// DOM 없이 동작해 서버/클라이언트 양쪽에서 같은 결과를 냅니다.

// Tiptap 확장(StarterKit, Link, Underline, Highlight, TextStyle+Color, TextAlign,
// ImageResize)이 실제로 만들어내는 태그만 허용합니다.
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "u",
  "mark",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "span",
  "div",
];

// ImageResize는 리사이즈 결과를 img의 containerstyle/wrapperstyle/width 속성에
// 직렬화합니다. 이 속성이 지워지면 기존 리뷰의 이미지 크기가 전부 초기화됩니다.
const IMAGE_ATTRIBUTES = [
  "src",
  "alt",
  "title",
  "width",
  "height",
  "style",
  "containerstyle",
  "wrapperstyle",
];

// style 값은 아래 속성만 통과시켜 CSS를 통한 공격 표면을 줄입니다.
const SAFE_LENGTH = /^\d+(?:\.\d+)?(?:px|em|rem|%)$/;
const SAFE_COLOR =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|hsl)a?\([^()]*\)|[a-z]+)$/i;

export const sanitizeReviewContent = (content: string): string =>
  sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      "*": ["class", "style", "data-*"],
      a: ["href", "title", "target", "rel"],
      img: IMAGE_ATTRIBUTES,
    },
    allowedStyles: {
      "*": {
        color: [SAFE_COLOR],
        "background-color": [SAFE_COLOR],
        "text-align": [/^(left|right|center|justify|start|end)$/],
        width: [SAFE_LENGTH],
        height: [SAFE_LENGTH, /^auto$/],
      },
    },
    // dompurify 기본 정책과 동일하게 data:/javascript: URL은 허용하지 않습니다.
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    // 새 탭으로 열리는 링크는 반드시 opener를 끊습니다.
    transformTags: {
      a: (tagName, attribs) =>
        attribs.target === "_blank"
          ? {
              tagName,
              attribs: { ...attribs, rel: "noopener noreferrer nofollow" },
            }
          : { tagName, attribs },
    },
  });
