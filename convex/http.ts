import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/* Plan B bridge for the EnterPro frontend (if the convex npm client cannot be
   installed inside the EnterPro project): plain REST endpoints + polling.
   Base URL: <deployment>.convex.site (cloud) or the local backend /http port. */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...cors } });

const http = httpRouter();

http.route({ path: "/report", method: "POST", handler: httpAction(async (ctx, req) => {
  const body = await req.json();
  const res = await ctx.runMutation(api.incidents.submitReport, body);
  return json(res);
})});

http.route({ path: "/upload-url", method: "POST", handler: httpAction(async (ctx) =>
  json(await ctx.runMutation(api.incidents.generateUploadUrl, {})))});

http.route({ path: "/board", method: "GET", handler: httpAction(async (ctx) =>
  json(await ctx.runQuery(api.incidents.liveBoard, {})))});

http.route({ path: "/track", method: "GET", handler: httpAction(async (ctx, req) => {
  const incidentId = new URL(req.url).searchParams.get("id") as any;
  return json(await ctx.runQuery(api.incidents.trackIncident, { incidentId }));
})});

http.route({ path: "/incident", method: "GET", handler: httpAction(async (ctx, req) => {
  const incidentId = new URL(req.url).searchParams.get("id") as any;
  return json(await ctx.runQuery(api.incidents.incidentDetail, { incidentId }));
})});

http.route({ path: "/responders", method: "GET", handler: httpAction(async (ctx) =>
  json(await ctx.runQuery(api.incidents.respondersList, {})))});

http.route({ path: "/venue", method: "GET", handler: httpAction(async (ctx) =>
  json(await ctx.runQuery(api.incidents.venueInfo, {})))});

http.route({ path: "/dispatch", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.dispatch, await req.json())))});

http.route({ path: "/accept", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.acceptAssignment, await req.json())))});

http.route({ path: "/on-scene", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.markOnScene, await req.json())))});

http.route({ path: "/resolve", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.resolve, await req.json())))});

http.route({ path: "/responder-location", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.updateResponderLocation, await req.json())))});

http.route({ path: "/login", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runQuery(api.incidents.login, await req.json())))});

http.route({ path: "/responder-login", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runQuery(api.incidents.responderLogin, await req.json())))});

http.route({ path: "/broadcast", method: "GET", handler: httpAction(async (ctx) =>
  json(await ctx.runQuery(api.incidents.activeBroadcast, {})))});

http.route({ path: "/broadcast", method: "POST", handler: httpAction(async (ctx, req) =>
  json(await ctx.runMutation(api.incidents.sendBroadcast, await req.json())))});

http.route({ path: "/broadcast-clear", method: "POST", handler: httpAction(async (ctx) =>
  json(await ctx.runMutation(api.incidents.clearBroadcast, {})))});

// CORS preflight for every POST route above.
for (const path of [
  "/report", "/upload-url", "/dispatch", "/accept", "/on-scene", "/resolve",
  "/responder-location", "/login", "/responder-login", "/broadcast", "/broadcast-clear",
])
  http.route({ path, method: "OPTIONS", handler: httpAction(async () =>
    new Response(null, { status: 204, headers: cors })) });

export default http;
