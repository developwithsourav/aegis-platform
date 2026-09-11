import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One row per tap. Several reports can point at the same incident.
  reports: defineTable({
    category: v.string(), // fire | medical | crowd | accident_infra | violence_security | other
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    zone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    incidentId: v.optional(v.id("incidents")),
  }).index("by_incident", ["incidentId"]),

  incidents: defineTable({
    category: v.string(),
    priority: v.number(), // 1 (critical) to 4
    headline: v.string(),
    summary: v.string(),
    confidence: v.number(), // corroboration percentage, see model.ts
    sopSteps: v.array(v.string()),
    sopSource: v.string(),
    reportCount: v.number(),
    lat: v.number(),
    lng: v.number(),
    zone: v.string(),
    status: v.string(), // ai_processing | verified | dispatched | en_route | on_scene | resolved
    assignedResponderId: v.optional(v.id("responders")),
    photoVerified: v.optional(v.boolean()),
    aiFailed: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_category_zone", ["category", "zone"]),

  // Append-only audit trail.
  events: defineTable({
    incidentId: v.id("incidents"),
    msg: v.string(),
  }).index("by_incident", ["incidentId"]),

  responders: defineTable({
    code: v.string(),
    name: v.string(),
    role: v.string(), // medic | marshal | fire | security
    lat: v.number(),
    lng: v.number(),
    available: v.boolean(),
    lastSeen: v.number(),
  }).index("by_available", ["available"]),

  // Response procedures retrieved during triage.
  sops: defineTable({
    category: v.string(),
    title: v.string(),
    text: v.string(),
    source: v.string(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_category", ["category"])
    .vectorIndex("by_embedding", { vectorField: "embedding", dimensions: 1536 }),

  broadcasts: defineTable({
    message: v.string(),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  // The single active venue: its centre and named gates or zones.
  venue: defineTable({
    name: v.string(),
    centerLat: v.number(),
    centerLng: v.number(),
    zoomLevel: v.number(),
    gates: v.array(
      v.object({ name: v.string(), lat: v.number(), lng: v.number(), isExit: v.boolean() })
    ),
  }),
});
