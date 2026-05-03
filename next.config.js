/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src https://www.youtube.com https://youtube.com; connect-src https://www.youtube.com https://youtube.com https://www.youtube.com/s/player/ 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com https://www.youtubeimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:;",
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), vr-spatial-tracking=(), xr-spatial-tracking=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
