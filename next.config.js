/** @type {import('next').NextConfig} */
const nextConfig = {
 async headers() {
  return [
   {
    source: "/(.*)",
    headers: [
     {
      key: "Content-Security-Policy",
      value:
       `"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",`
        .replace(/\s{2,}/g, " ")
        .trim(),
     },
     {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
     },
     { key: "X-Content-Type-Options", value: "nosniff" },
     { key: "X-Frame-Options", value: "DENY" },
     { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
     {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
     },
    ],
   },
  ];
 },
};

module.exports = nextConfig;
