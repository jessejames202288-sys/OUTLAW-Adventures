import { db, adventuresTable, bookingsTable, marketplaceProfilesTable, notificationsTable, usersTable } from "@workspace/db";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();
const categories = ["Hunting", "Fishing", "ATV", "Dirt bike", "Snowmobile"] as const;
const roles = ["customer", "guide"] as const;
const statuses = ["pending", "confirmed", "cancelled"] as const;

const profileInput = z.object({
  role: z.enum(roles),
  phone: z.string().trim().max(80).optional().default(""),
  region: z.string().trim().max(160).optional().default(""),
  experience: z.string().trim().max(2000).optional().default(""),
});

const adventureInput = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum(categories),
  location: z.string().trim().min(2).max(160),
  state: z.string().trim().min(2).max(100),
  price: z.coerce.number().int().positive().max(100000),
  duration: z.string().trim().min(1).max(80),
  guests: z.string().trim().min(1).max(80),
  capacity: z.coerce.number().int().min(1).max(50).default(4),
  description: z.string().trim().min(10).max(2000),
  availability: z.string().trim().min(2).max(240),
  tags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
});

const bookingInput = z.object({
  adventureId: z.string().min(1),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(50),
  notes: z.string().trim().max(2000).optional().default(""),
});

function requireAuth(req: Express.Request, res: Express.Response): req is Express.Request & { user: Express.User } {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to continue." });
    return false;
  }
  return true;
}

async function getProfile(userId: string) {
  const [profile] = await db.select().from(marketplaceProfilesTable).where(eq(marketplaceProfilesTable.userId, userId));
  return profile;
}

async function requireProfile(req: Express.Request, res: Express.Response, role?: "customer" | "guide") {
  if (!requireAuth(req, res)) return null;
  const profile = await getProfile(req.user.id);
  if (!profile) {
    res.status(409).json({ error: "Complete your OUTLAW profile first." });
    return null;
  }
  if (role && profile.role !== role) {
    res.status(403).json({ error: `This action is for ${role}s only.` });
    return null;
  }
  return profile;
}

function guideName(user: { firstName: string | null; lastName: string | null; email: string | null }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "OUTLAW guide";
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "OG";
}

function listingPayload(row: typeof adventuresTable.$inferSelect, user: typeof usersTable.$inferSelect) {
  const name = guideName(user);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    state: row.state,
    price: row.price,
    duration: row.duration,
    guests: row.guests,
    capacity: row.capacity,
    rating: row.rating / 10,
    reviews: row.reviews,
    guide: name,
    initials: initials(name),
    accent: row.accent,
    description: row.description,
    tags: Array.isArray(row.tags) ? row.tags : [],
    availability: row.availability,
    ownerId: row.ownerId,
  };
}

function dateIsInPast(date: string) {
  const today = new Date();
  const current = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return new Date(`${date}T00:00:00.000Z`) < current;
}

async function addNotification(recipientUserId: string, bookingId: string, kind: string, title: string, message: string) {
  await db.insert(notificationsTable).values({ recipientUserId, bookingId, kind, title, message });
}

const seedAdventures = [
  { id: "elk-ridge", title: "September Elk Camp", category: "Hunting", location: "Cimarron Range", state: "New Mexico", price: 495, duration: "3 days", guests: "1–4 hunters", capacity: 4, rating: 49, reviews: 38, guide: ["Rhett", "Calder"], accent: "#a65327", description: "A backcountry archery camp for hunters who want long glassing days, honest miles, and a real shot at a bull.", tags: ["Archery", "Backcountry"], availability: "September 5–30 · 4 spots left" },
  { id: "copper-river", title: "Copper River Salmon Run", category: "Fishing", location: "Copper River", state: "Alaska", price: 360, duration: "Full day", guests: "1–3 anglers", capacity: 3, rating: 50, reviews: 24, guide: ["Nora", "Bell"], accent: "#26676b", description: "Cold water, heavy fish, and a guide who knows which gravel bar is holding today. Gear and lunch included.", tags: ["Fly fishing", "All gear"], availability: "June–August · 3 boats available" },
  { id: "high-desert", title: "High Desert ATV Run", category: "ATV", location: "Moab Backcountry", state: "Utah", price: 220, duration: "6 hours", guests: "2–8 riders", capacity: 8, rating: 48, reviews: 61, guide: ["Mack", "Flores"], accent: "#b56b2d", description: "Sandstone fins, hidden arches, and a two-track route that leaves the crowds behind.", tags: ["Scenic", "Beginner friendly"], availability: "Open May–October · 6 rigs available" },
  { id: "black-hills", title: "Black Hills Dirt Bike", category: "Dirt bike", location: "Black Hills", state: "South Dakota", price: 275, duration: "8 hours", guests: "2–6 riders", capacity: 6, rating: 49, reviews: 47, guide: ["Tate", "McCready"], accent: "#6b4938", description: "Technical singletrack, pine shade, and a local line for every skill level. Bikes, fuel, and trail lunch.", tags: ["Singletrack", "Bikes included"], availability: "Open April–October · 4 bikes available" },
  { id: "teton-powder", title: "Teton Powder Mission", category: "Snowmobile", location: "Teton Valley", state: "Idaho", price: 410, duration: "Full day", guests: "2–5 riders", capacity: 5, rating: 49, reviews: 29, guide: ["Hank", "Delaney"], accent: "#375a67", description: "Fresh lines, high alpine bowls, and a guide who reads the snowpack before he opens the throttle.", tags: ["Deep powder", "Avalanche aware"], availability: "December–March · 5 seats open" },
  { id: "ozark-bow", title: "Ozark Whitetail Week", category: "Hunting", location: "Ozark Highlands", state: "Missouri", price: 390, duration: "2 days", guests: "1–3 hunters", capacity: 3, rating: 47, reviews: 18, guide: ["Cal", "Hart"], accent: "#405833", description: "Quiet hardwood ridges, private ground, and a patient bowhunt built around how deer actually move.", tags: ["Whitetail", "Private land"], availability: "October–December · 3 spots left" },
] as const;

async function ensureSeeded() {
  const [existing] = await db.select({ id: adventuresTable.id }).from(adventuresTable).limit(1);
  if (existing) return;
  for (const seed of seedAdventures) {
    const ownerId = `seed-guide-${seed.id}`;
    const [owner] = await db.insert(usersTable).values({
      id: ownerId,
      email: `${seed.id}@seed.outlawadventures.local`,
      firstName: seed.guide[0],
      lastName: seed.guide[1],
    }).onConflictDoNothing().returning();
    if (owner) {
      await db.insert(marketplaceProfilesTable).values({ userId: ownerId, role: "guide", region: seed.state, experience: "Local guide on the OUTLAW roster." }).onConflictDoNothing();
    }
    await db.insert(adventuresTable).values({
      id: seed.id,
      ownerId,
      title: seed.title,
      category: seed.category,
      location: seed.location,
      state: seed.state,
      price: seed.price,
      duration: seed.duration,
      guests: seed.guests,
      capacity: seed.capacity,
      rating: seed.rating,
      reviews: seed.reviews,
      accent: seed.accent,
      description: seed.description,
      tags: [...seed.tags],
      availability: seed.availability,
    }).onConflictDoNothing();
  }
}

router.get("/profile", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const profile = await getProfile(req.user.id);
  res.json({
    user: req.user,
    profile: profile ? { role: profile.role, phone: profile.phone ?? "", region: profile.region ?? "", experience: profile.experience ?? "" } : null,
  });
});

router.post("/profile", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please complete the requested profile fields." });
    return;
  }
  const [profile] = await db.insert(marketplaceProfilesTable).values({
    userId: req.user.id,
    ...parsed.data,
  }).onConflictDoUpdate({
    target: marketplaceProfilesTable.userId,
    set: { ...parsed.data, updatedAt: new Date() },
  }).returning();
  res.json({ profile });
});

router.get("/adventures", async (_req, res) => {
  await ensureSeeded();
  const rows = await db.select({ adventure: adventuresTable, user: usersTable })
    .from(adventuresTable)
    .innerJoin(usersTable, eq(adventuresTable.ownerId, usersTable.id))
    .where(eq(adventuresTable.active, true))
    .orderBy(desc(adventuresTable.createdAt));
  res.json(rows.map(({ adventure, user }) => listingPayload(adventure, user)));
});

router.post("/adventures", async (req, res) => {
  const profile = await requireProfile(req, res, "guide");
  if (!profile) return;
  const parsed = adventureInput.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Add a title, location, price, description, availability, and valid trip details." });
    return;
  }
  const [row] = await db.insert(adventuresTable).values({
    ...parsed.data,
    ownerId: req.user.id,
    rating: 50,
  }).returning();
  res.status(201).json(row);
});

router.patch("/adventures/:id", async (req, res) => {
  const profile = await requireProfile(req, res, "guide");
  if (!profile) return;
  const parsed = adventureInput.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "The adventure details are not valid." });
    return;
  }
  const [row] = await db.update(adventuresTable).set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(adventuresTable.id, req.params.id), eq(adventuresTable.ownerId, req.user.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Adventure not found." });
    return;
  }
  res.json(row);
});

router.delete("/adventures/:id", async (req, res) => {
  const profile = await requireProfile(req, res, "guide");
  if (!profile) return;
  const [row] = await db.update(adventuresTable).set({ active: false, updatedAt: new Date() })
    .where(and(eq(adventuresTable.id, req.params.id), eq(adventuresTable.ownerId, req.user.id)))
    .returning({ id: adventuresTable.id });
  if (!row) {
    res.status(404).json({ error: "Adventure not found." });
    return;
  }
  res.status(204).end();
});

router.get("/bookings", async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;
  const rows = await db.select({ booking: bookingsTable, adventure: adventuresTable, guideUser: usersTable })
    .from(bookingsTable)
    .innerJoin(adventuresTable, eq(bookingsTable.adventureId, adventuresTable.id))
    .innerJoin(usersTable, eq(adventuresTable.ownerId, usersTable.id))
    .where(profile.role === "customer"
      ? eq(bookingsTable.customerId, req.user.id)
      : eq(adventuresTable.ownerId, req.user.id))
    .orderBy(desc(bookingsTable.createdAt));
  res.json(rows.map(({ booking, adventure, guideUser }) => ({
    id: booking.id,
    listingId: adventure.id,
    listingTitle: adventure.title,
    category: adventure.category,
    location: `${adventure.location}, ${adventure.state}`,
    guide: guideName(guideUser),
    price: adventure.price,
    total: booking.total,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    date: booking.date,
    partySize: booking.partySize,
    notes: booking.notes,
    status: booking.status,
    createdAt: booking.createdAt,
    customerId: booking.customerId,
  })));
});

router.post("/bookings", async (req, res) => {
  const profile = await requireProfile(req, res, "customer");
  if (!profile) return;
  const parsed = bookingInput.safeParse(req.body);
  if (!parsed.success || dateIsInPast(parsed.success ? parsed.data.date : "")) {
    res.status(400).json({ error: "Choose a valid future date and complete every booking field." });
    return;
  }
  const data = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      const [adventure] = await tx.select().from(adventuresTable)
        .where(and(eq(adventuresTable.id, data.adventureId), eq(adventuresTable.active, true)))
        .for("update");
      if (!adventure) throw new Error("ADVENTURE_NOT_FOUND");
      if (data.partySize > adventure.capacity) throw new Error("PARTY_TOO_LARGE");
      const existing = await tx.select({ partySize: bookingsTable.partySize }).from(bookingsTable)
        .where(and(eq(bookingsTable.adventureId, adventure.id), eq(bookingsTable.date, data.date), inArray(bookingsTable.status, ["pending", "confirmed"])));
      const used = existing.reduce((total, row) => total + row.partySize, 0);
      if (used + data.partySize > adventure.capacity) throw new Error("NO_CAPACITY");
      const [booking] = await tx.insert(bookingsTable).values({
        adventureId: adventure.id,
        customerId: req.user.id,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        date: data.date,
        partySize: data.partySize,
        total: adventure.price * data.partySize,
        notes: data.notes,
        status: "pending",
      }).returning();
      return { booking, adventure };
    });
    await addNotification(result.adventure.ownerId, result.booking.id, "booking_request", "New booking request", `${data.name} requested ${result.adventure.title} for ${data.date}.`);
    res.status(201).json({ ...result.booking, listingId: result.adventure.id, listingTitle: result.adventure.title, status: result.booking.status });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = {
      ADVENTURE_NOT_FOUND: "That adventure is no longer available.",
      PARTY_TOO_LARGE: "That party is larger than this adventure's capacity.",
      NO_CAPACITY: "There is not enough availability for that date and party size.",
    };
    res.status(code === "NO_CAPACITY" ? 409 : 400).json({ error: messages[code] ?? "We could not create that booking request." });
  }
});

router.patch("/bookings/:id/status", async (req, res) => {
  const profile = await requireProfile(req, res, "guide");
  if (!profile) return;
  const parsed = z.object({ status: z.enum(["confirmed", "cancelled"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose confirmed or cancelled." });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select({ booking: bookingsTable, adventure: adventuresTable })
        .from(bookingsTable)
        .innerJoin(adventuresTable, eq(bookingsTable.adventureId, adventuresTable.id))
        .where(and(eq(bookingsTable.id, req.params.id), eq(adventuresTable.ownerId, req.user.id)))
        .for("update");
      if (!current) throw new Error("BOOKING_NOT_FOUND");
      if (parsed.data.status === "confirmed") {
        const active = await tx.select({ partySize: bookingsTable.partySize }).from(bookingsTable)
          .where(and(
            eq(bookingsTable.adventureId, current.adventure.id),
            eq(bookingsTable.date, current.booking.date),
            inArray(bookingsTable.status, ["pending", "confirmed"]),
          ));
        const usedWithoutCurrent = active.filter((row) => row !== undefined).reduce((total, row) => total + row.partySize, 0) - (current.booking.status === "pending" ? current.booking.partySize : 0);
        if (usedWithoutCurrent + current.booking.partySize > current.adventure.capacity) throw new Error("NO_CAPACITY");
      }
      const [updated] = await tx.update(bookingsTable).set({ status: parsed.data.status, updatedAt: new Date() })
        .where(eq(bookingsTable.id, current.booking.id)).returning();
      return { updated, adventure: current.adventure };
    });
    await addNotification(result.updated.customerId, result.updated.id, `booking_${result.updated.status}`, `Booking ${result.updated.status}`, `${result.adventure.title} for ${result.updated.date} is now ${result.updated.status}.`);
    res.json(result.updated);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    res.status(code === "NO_CAPACITY" ? 409 : 404).json({ error: code === "NO_CAPACITY" ? "That date no longer has enough room to confirm this request." : "Booking not found." });
  }
});

router.get("/notifications", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.recipientUserId, req.user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.patch("/notifications/:id/read", async (req, res) => {
  if (!requireAuth(req, res)) return;
  const [row] = await db.update(notificationsTable).set({ readAt: new Date() })
    .where(and(eq(notificationsTable.id, req.params.id), eq(notificationsTable.recipientUserId, req.user.id)))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Notification not found." });
    return;
  }
  res.json(row);
});

export default router;