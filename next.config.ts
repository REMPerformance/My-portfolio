import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
        ]
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" }
        ]
      }
    ];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/auta", destination: "/ponuka", permanent: true }
    ];
  }
};

export default nextConfig;
