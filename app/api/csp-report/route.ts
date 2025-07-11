// app/api/csp-report/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  console.error("CSP Violation:", JSON.stringify(body, null, 2));
  return new Response(null, { status: 204 });
}
