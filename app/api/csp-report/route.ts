export async function POST(request: Request) {
  const body = await request.json();
  console.warn("CSP Report", JSON.stringify(body, null, 2));
  return new Response(null, { status: 204 });
}
