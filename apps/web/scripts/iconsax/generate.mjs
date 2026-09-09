/**
 * iconsax 아이콘 데이터 → 로컬 React 컴포넌트 생성.
 *
 *   pnpm --filter @bookjeok/web icons:gen
 *
 * iconsax 패키지는 devDependency로만 쓰고, 생성된 컴포넌트를 커밋한다.
 * (런타임 의존성 0, 실제로 쓰는 아이콘만 번들에 들어간다)
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CUSTOM, MAPPING } from "./mapping.mjs";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = join(ROOT, "src/shared/components/icons/iconsax");

const manifest = require("iconsax/manifest.json");
const dataDir = dirname(require.resolve("iconsax/manifest.json")) + "/data";
const data = Object.fromEntries(
  readdirSync(dataDir).map((f) => [
    f.replace(".json", ""),
    require(join(dataDir, f)),
  ]),
);

const rawSvg = (icon, style) => {
  const entry = manifest[icon];
  if (!entry) throw new Error(`iconsax에 '${icon}' 아이콘이 없습니다`);
  const svg = data[entry.category]?.[icon]?.[style];
  if (!svg) throw new Error(`'${icon}'에 '${style}' 스타일이 없습니다`);
  return svg;
};

const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])(\d)/g, "$1-$2")
    .toLowerCase();

/** SVG 속성을 JSX 형태로 바꾸고, 하드코딩된 흰색을 currentColor로 정규화한다. */
const toJsx = (body, uid) =>
  body
    .replace(/(stroke|fill)="white"/g, '$1="currentColor"')
    .replace(
      /\b(stroke|fill|clip|fill-rule|clip-rule)-(\w)/g,
      (_, a, b) => `${a}${b.toUpperCase()}`,
    )
    .replace(/-(\w)/g, (m, c) => (/^[a-z]$/.test(c) ? m : m)) // 경로 데이터는 건드리지 않는다
    .replace(/stroke-width/g, "strokeWidth")
    .replace(/stroke-linecap/g, "strokeLinecap")
    .replace(/stroke-linejoin/g, "strokeLinejoin")
    .replace(/stroke-miterlimit/g, "strokeMiterlimit")
    .replace(/fill-opacity/g, "fillOpacity")
    .replace(/stroke-opacity/g, "strokeOpacity")
    .replace(/clip-path/g, "clipPath")
    .replace(/fill-rule/g, "fillRule")
    .replace(/clip-rule/g, "clipRule")
    // <defs>의 id가 페이지 안에서 충돌하지 않도록 컴포넌트별로 접두사를 붙인다
    .replace(/id="([^"]+)"/g, (_, id) => `id="${uid}_${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${uid}_${id})`)
    .trim();

/**
 * <svg> 껍데기를 벗기고 내부 마크업만 남긴다.
 * iconsax 원본은 24x24 전체를 덮는 무의미한 clipPath로 감싸여 있는 경우가 많은데,
 * 그대로 인라인하면 id가 페이지 안에서 충돌하므로 아예 걷어낸다.
 */
const inner = (svg) => {
  let body = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();

  const trivialClip =
    /<clipPath id="([^"]+)">\s*<rect[^>]*width="24"[^>]*height="24"[^>]*\/>\s*<\/clipPath>/g;
  const trivialIds = [...body.matchAll(trivialClip)].map((m) => m[1]);
  if (trivialIds.length) {
    body = body.replace(/<defs>[\s\S]*?<\/defs>/g, "");
    for (const id of trivialIds) {
      const open = `<g clip-path="url(#${id})">`;
      if (!body.includes(open)) continue;
      body = body.split(open).join("");
      const close = body.lastIndexOf("</g>");
      if (close !== -1) body = body.slice(0, close) + body.slice(close + 4);
    }
  }
  return body.replace(/\s+/g, " ").trim();
};

/** 컨테이너 도형을 뺀 나머지 path만 뽑아 가운데 기준으로 확대한다. */
const derive = ({ from, paths, scale }, style = "outline") => {
  const all = [...rawSvg(from, style).matchAll(/<path\s[^>]*\/>/g)].map(
    (m) => m[0],
  );
  const picked = paths.map((i) => all[i]);
  if (picked.some((p) => !p))
    throw new Error(`'${from}'에서 path ${paths}를 찾지 못했습니다`);
  return `<g transform="translate(12 12) scale(${scale}) translate(-12 -12)">${picked.join("")}</g>`;
};

const componentSource = ({ name, aliases, note, source, outline, bold }) => {
  const doc = [
    "/**",
    ` * ${source}`,
    ...(note ? [` * ${note}`] : []),
    " */",
  ].join("\n");
  const varied = Boolean(bold);
  return `${doc}
export const ${name} = ({
  className,
  size = 24,${varied ? '\n  variant = "outline",' : ""}
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    ${varied ? `{variant === "bold" ? (\n      <>${bold}</>\n    ) : (\n      <>${outline}</>\n    )}` : outline}
  </svg>
);
${(aliases ?? []).map((a) => `\nexport { ${name} as ${a} };\n`).join("")}`;
};

mkdirSync(OUT_DIR, { recursive: true });
// 디렉터리째 지우면 Windows에서 잠금에 걸리므로 파일만 비운다
for (const f of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, f), { force: true });

writeFileSync(
  join(OUT_DIR, "_base.tsx"),
  `import type React from "react";

/** iconsax 아이콘 공통 props. 색은 currentColor를 따르고, 크기는 className으로도 덮어쓸 수 있다. */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  /** 좋아요·재생처럼 채워진 상태가 필요할 때 "bold"를 넘긴다. 일부 아이콘만 지원한다. */
  variant?: "outline" | "bold";
}
`,
);

const files = [];
const report = [];

for (const entry of MAPPING) {
  const { name, icon, alias, note, bold: needsBold } = entry;
  const uid = kebab(name).replace(/-/g, "");
  const outline = entry.derive
    ? toJsx(derive(entry.derive), uid)
    : toJsx(inner(rawSvg(icon, "outline")), uid);
  const bold = needsBold ? toJsx(inner(rawSvg(icon, "bold")), `${uid}b`) : null;
  const source = entry.derive
    ? `iconsax · ${entry.derive.from} (outline, 일부 path 추출)`
    : `iconsax · ${icon} (outline${needsBold ? " + bold" : ""})`;

  files.push({
    file: kebab(name),
    name,
    aliases: alias,
    source,
    note,
    outline,
    bold,
  });
  report.push({ name, aliases: alias ?? [], source, note: note ?? "" });
}

for (const { name, alias, note, body } of CUSTOM) {
  files.push({
    file: kebab(name),
    name,
    aliases: alias,
    source: "직접 그림 (iconsax 24px 그리드 기준)",
    note,
    outline: body.trim(),
    bold: null,
  });
  report.push({
    name,
    aliases: alias ?? [],
    source: "custom",
    note: note ?? "",
  });
}

for (const f of files) {
  writeFileSync(
    join(OUT_DIR, `${f.file}.tsx`),
    `import { cn } from "@/shared/utils/cn";\n\nimport type { IconProps } from "./_base";\n\n${componentSource(f)}`,
  );
}

writeFileSync(
  join(OUT_DIR, "index.ts"),
  `// 이 파일은 scripts/iconsax/generate.mjs가 생성합니다. 직접 수정하지 마세요.\n` +
    `export type { IconProps } from "./_base";\n` +
    files
      .slice()
      .sort((a, b) => a.file.localeCompare(b.file))
      .map(
        (f) =>
          `export { ${[f.name, ...(f.aliases ?? [])].join(", ")} } from "./${f.file}";`,
      )
      .join("\n") +
    "\n",
);

writeFileSync(
  join(OUT_DIR, "MAPPING.md"),
  `# lucide → iconsax 매핑\n\n` +
    `\`scripts/iconsax/mapping.mjs\`에서 생성됩니다. 아이콘을 추가하려면 매핑 테이블에 한 줄 넣고 \`pnpm --filter @bookjeok/web icons:gen\`을 실행하세요.\n\n` +
    `| 컴포넌트 | 별칭 | 출처 | 비고 |\n| --- | --- | --- | --- |\n` +
    report
      .map(
        (r) =>
          `| \`${r.name}\` | ${r.aliases.map((a) => `\`${a}\``).join(", ") || "—"} | ${r.source} | ${r.note || "—"} |`,
      )
      .join("\n") +
    "\n",
);

console.log(
  `생성 완료: ${files.length}개 컴포넌트 → src/shared/components/icons/iconsax/`,
);
