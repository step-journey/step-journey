// client-web/src/utils/mathMarkdown.ts

// 수학 문제의 마크다운을 HTML로 변환하는 유틸리티 함수

/**
 * 마크다운(또는 문자열 배열)을 HTML로 변환하는 함수
 * - 수학 기호와 수식을 적절히 표현하도록 변환
 */
export function mathMarkdownToHtml(markdown: string | string[]): string {
  // 1) null/undefined 처리
  if (!markdown) return "";

  // 2) 만약 배열이면 \n으로 이어붙여 문자열화
  if (Array.isArray(markdown)) {
    markdown = markdown.join("\n");
  }

  // 3) 이후 문자열에 대해 각종 치환
  let html = markdown
    // 헤더
    .replace(
      /^#{1,6}\s+(.+)$/gm,
      '<h3 class="text-lg font-semibold mb-2">$1</h3>',
    )

    // 굵은 글씨, 기울임 글씨
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")

    // 수학 기호 예시 치환
    .replace(/f\(x\)/g, '<span class="math-symbol">f(x)</span>')
    .replace(/f'\(x\)/g, '<span class="math-symbol">f\'(x)</span>')
    .replace(/f'\((\d+)\)/g, '<span class="math-symbol">f\'($1)</span>')

    // 제곱, 세제곱 표현
    .replace(/(\d+)²/g, '<span class="math-symbol">$1<sup>2</sup></span>')
    .replace(/(\d+)³/g, '<span class="math-symbol">$1<sup>3</sup></span>')
    .replace(/x²/g, '<span class="math-symbol">x<sup>2</sup></span>')
    .replace(/x³/g, '<span class="math-symbol">x<sup>3</sup></span>')

    // 간단한 분수 표현
    .replace(/(\d+)\/(\d+)/g, '<span class="math-fraction">$1/$2</span>')

    // 수학 공식 블록 (가정된 포맷)
    .replace(
      /\n\{(.+?)\n\{(.+?)(?:\n\{)?/gs,
      '<div class="math-block">{$1<br>{$2',
    )

    // 특수 수학 기호
    .replace(/⟹/g, '<span class="math-symbol">⟹</span>')
    .replace(/⟷/g, '<span class="math-symbol">⟷</span>')
    .replace(/⟺/g, '<span class="math-symbol">⟺</span>')

    // 단락 및 줄바꿈 처리
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, "<br/>");

  return html;
}
