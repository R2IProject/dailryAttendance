/** @type {import('next').NextConfig} */
const nextConfig = {
 async headers() {
  return [
   {
    source: "/(.*)",
    headers: [
     {
      key: "Content-Security-Policy",
      value: `
    default-src 'self';
    script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'sha256-Q/TqtzFIC9hyqo1FBRA30dtJImf0ehsqSfiLjEMF6ak=';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.yourdomain.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
    report-uri https://wattendance.vercel.app/api/csp-report;
  `
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
