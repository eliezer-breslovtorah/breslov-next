import articleData from "../../content/articles.json";
export const articles = articleData;
export type Article = (typeof articles)[number];
export function getArticles() {
  return articles;
}
export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
