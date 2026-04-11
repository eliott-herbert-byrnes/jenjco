import { paths } from "./app/paths.ts"

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: paths.login, destination: paths.signIn, permanent: false },
    ]
  },
}

export default nextConfig