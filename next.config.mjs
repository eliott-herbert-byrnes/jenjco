import { paths } from "./app/paths.ts"

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: paths.login, destination: paths.signIn, permanent: false },
      { source: "/processes", destination: paths.processes, permanent: false },
      {
        source: "/processes/:id",
        destination: `${paths.processes}/:id`,
        permanent: false,
      },
      {
        source: "/org-structure",
        destination: paths.orgStructure,
        permanent: false,
      },
    ]
  },
}

export default nextConfig