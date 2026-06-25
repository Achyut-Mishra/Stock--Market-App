// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   eslint: {
//     ignoreDuringBuilds: true,
//   },typescript: {
//     ignoreBuildErrors: true,
//   },
// };

// export default nextConfig;

 import type { NextConfig } from "next";

 const nextConfig = {
   eslint: {
     ignoreDuringBuilds: true,
   },
   typescript: {
     ignoreBuildErrors: true,
   },
 } satisfies NextConfig;

 export default nextConfig;
