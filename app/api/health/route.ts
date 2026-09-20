export function GET() {
  return Response.json(
    { status: "ok", application: "med-assurance" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
