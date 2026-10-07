import { readJson, assertSameOrigin, authDb, getCurrentUser } from "@/lib/auth";
import { getLessonById } from "@/lib/store";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user)
      return Response.json(
        { error: "Sign in to save your learning" },
        { status: 401 },
      );
    const { action } = await params,
      body = await readJson(request),
      id = String(body.lessonId || "");
    if (!getLessonById(id)) throw Error("Lesson not found");
    const db = authDb();
    if (action === "bookmarks") {
      const existing = db
        .prepare(
          "SELECT lesson_id FROM bookmarks WHERE user_id=? AND lesson_id=?",
        )
        .get(user.id, id);
      if (existing)
        db.prepare("DELETE FROM bookmarks WHERE user_id=? AND lesson_id=?").run(
          user.id,
          id,
        );
      else
        db.prepare("INSERT INTO bookmarks VALUES(?,?,?)").run(
          user.id,
          id,
          new Date().toISOString(),
        );
      return Response.json({ saved: !existing });
    }
    if (action === "history") {
      const position = Math.min(86400, Math.max(0, Number(body.position) || 0));
      db.prepare(
        "INSERT INTO listening_history VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET position=excluded.position,updated_at=excluded.updated_at",
      ).run(user.id, id, position, new Date().toISOString());
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unable to save" },
      { status: 400 },
    );
  }
}
