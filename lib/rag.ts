// lib/rag.ts
// 朴素 RAG：BM25 关键词检索 + JSON 数据

import artifactsData from "@/public/data/artifacts.json";

export interface Artifact {
  id: string;
  name: string;
  nameEn: string;
  era: string;
  year?: string | null;
  size?: string | null;
  hall: string;
  category: string;
  image: string | null;
  description: string;
  descriptionEn: string;
  tags: string[];
  highlights: string[];
}

// BM25 简单实现（无需外部库）
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function calcBM25(
  query: string,
  doc: string,
  avgDL: number,
  docLen: number,
  docFreqs: Map<string, number>,
  N: number,
  k1 = 1.5,
  b = 0.75
): number {
  const queryTerms = tokenize(query);
  const docTerms = tokenize(doc);
  const docTermCounts = new Map<string, number>();
  docTerms.forEach((t) => docTermCounts.set(t, (docTermCounts.get(t) || 0) + 1));

  let score = 0;
  const docLenNorm = docLen / avgDL;

  queryTerms.forEach((qt) => {
    const df = docFreqs.get(qt) || 0;
    if (df === 0) return;
    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
    const tf = docTermCounts.get(qt) || 0;
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLenNorm));
    score += idf * tfNorm;
  });

  return score;
}

function getAllText(doc: Artifact): string {
  return [
    doc.name,
    doc.nameEn,
    doc.era,
    doc.year,
    doc.description,
    doc.descriptionEn,
    ...doc.tags,
    ...doc.highlights,
  ]
    .filter(Boolean)
    .join(" ");
}

export function retrieveRelevantArtifacts(query: string, topK = 5): Artifact[] {
  const artifacts = artifactsData.artifacts as Artifact[];
  const N = artifacts.length;

  // 构建文档频率
  const docFreqs = new Map<string, number>();
  const docLengths: number[] = [];

  artifacts.forEach((doc) => {
    const terms = tokenize(getAllText(doc));
    docLengths.push(terms.length);
    const uniqueTerms = new Set(terms);
    uniqueTerms.forEach((t) => docFreqs.set(t, (docFreqs.get(t) || 0) + 1));
  });

  const avgDL = docLengths.reduce((a, b) => a + b, 0) / N;

  // 计算每篇文档的 BM25 得分
  const scored = artifacts.map((doc) => {
    const docText = getAllText(doc);
    const score = calcBM25(query, docText, avgDL, docLengths[artifacts.indexOf(doc)], docFreqs, N);
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

export function buildContextFromArtifacts(artifacts: Artifact[]): string {
  if (artifacts.length === 0) return "";

  return artifacts
    .map(
      (a) =>
        `【文物】${a.name}（${a.era}）\n` +
        `简介：${a.description}\n` +
        `标签：${a.tags.join("、")}\n` +
        `看点：${a.highlights.join("；")}`
    )
    .join("\n\n");
}