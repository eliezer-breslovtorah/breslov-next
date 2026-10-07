import "server-only";
import { getDb } from "./store";
export function inquiriesDb() {
  const db = getDb();
  db.exec(
    "CREATE TABLE IF NOT EXISTS inquiries(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS inquiries_date ON inquiries(created_at DESC)",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS inquiry_attachments(inquiry_id TEXT PRIMARY KEY REFERENCES inquiries(id) ON DELETE CASCADE,path TEXT NOT NULL,mime TEXT NOT NULL)",
  );
  return db;
}
