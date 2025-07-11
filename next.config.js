/** @type {import('next').NextConfig} */
const nextConfig = {
 async headers() {
  return [
   {
    source: "/(.*)", // Applies headers to all routes
    headers: [
     {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
     },
     {
      key: "Content-Security-Policy",
      value:
       "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src *; font-src 'self'; connect-src *",
     },
     {
      key: "X-Frame-Options",
      value: "DENY",
     },
     {
      key: "X-Content-Type-Options",
      value: "nosniff",
     },
     {
      key: "Referrer-Policy",
      value: "no-referrer",
     },
     {
      key: "Permissions-Policy",
      value: "geolocation=(), camera=(), microphone=(), fullscreen=(self)",
     },
    ],
   },
  ];
 },
};

module.exports = nextConfig;
