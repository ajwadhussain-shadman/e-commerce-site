/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/img/logo2.png",
        search: "?v=20261015",
      },
      {
        pathname: "/img/logo2.png",
        search: "",
      },
      {
        pathname: "/img/banner.png",
        search: "",
      },
      {
        pathname: "/img/shoppingcart.png",
        search: "",
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
