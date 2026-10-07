import definitions from "../../content/community-forms.json";
export const communityForms = definitions;
export type CommunityFormDefinition = (typeof definitions)[number];
export function communityForm(slug: string) {
  return definitions.find((f) => f.slug === slug);
}
