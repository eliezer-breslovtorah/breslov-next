import "server-only";
import settings from "../../content/homepage.json";
import type { FeaturedItem } from "@/components/home-media";
import type { PublicTrack } from "@/components/media-provider";
type HomepageSettings = {
  featured: FeaturedItem;
  clips: PublicTrack[];
  courseSlugs: string[];
  firstLessons: Record<string, string>;
};
// Staff selections live in one portable JSON file. Rebuild after changing them.
// Only verified public excerpts belong here; member recordings remain separate.
export const homepage: HomepageSettings = settings;
