import resources from "../../../../../content/public-resources.json";
import { mediaRoot } from "@/lib/store";
import { streamStoredFile, type StoredFile } from "@/lib/media-stream";
const files = resources as Record<string, Omit<StoredFile, "root">>;
async function serve(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = Object.prototype.hasOwnProperty.call(files, id)
    ? files[id]
    : undefined;
  if (!file) return new Response("Resource not found", { status: 404 });
  return streamStoredFile(request, { ...file, root: mediaRoot });
}
export const GET = serve;
export const HEAD = serve;
