# Roadmap

Engineering baseline after the dependency refresh. Product behavior is unchanged.

## Current baseline

- Node.js 24 in CI and local verification.
- Direct dependencies are on the newest published releases that install and pass lint, typecheck, tests, and the production build.
- TypeScript 7.0 is the `tsc` used by `npm run typecheck` (`@typescript/native`). The `typescript` package stays on the TypeScript 6 API (`@typescript/typescript6`) so ESLint and Next.js can keep importing a compiler API. TypeScript 7.0 does not ship that API; typescript-eslint rejects 7.0 until 7.1.
- `npm audit` is clean with the existing security overrides, plus `minimatch` `>=11.0.4` for the glob-matching advisory in ESLint’s tree. `jwks-rsa` still pins `jose` 5.10.0, and `@grpc/grpc-js` stays on `^1.14.6`.

## Not in this pass

- Firebase rules, indexes, Vercel project settings, and environment values stay as they are.
- No AI model or provider changes (this app does not call one).
- No user-facing feature removals.
