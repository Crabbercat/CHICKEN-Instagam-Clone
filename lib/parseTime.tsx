import { Timestamp } from "firebase/firestore";

export function parseTime(t: any): Date {
  if (!t) return new Date();

  // Timestamp từ Firestore
  if (t instanceof Timestamp) return t.toDate();

  // Timestamp object từ Firestore snapshot
  if (t.seconds) return new Date(t.seconds * 1000);

  // Nếu là JS Date
  if (t instanceof Date) return t;

  return new Date();
}
