# DYNO Mapper MCP Server

[![DYNO Mapper](https://d31ninron5tttf.cloudfront.net/images/logo_dark.c37f697f.png)](https://dynomapper.com)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server for the
[DYNO Mapper Public API](https://app.dynomapper.com/developer): projects,
accessibility audits, assignments, inventory, analytics and keyword visibility.

The repository holds two servers that share one implementation but ship
separately, because they have different transports, different security models
and different homes:

| Artifact                 | Transport                      | Ships as        | Source                           |
| ------------------------ | ------------------------------ | --------------- | -------------------------------- |
| `@dynomapper/mcp-server` | stdio                          | npm package     | [packages/stdio](packages/stdio) |
| `dynomapper-mcp` (image) | Streamable HTTP at `POST /mcp` | container image | [packages/http](packages/http)   |

Both are thin wrappers around [packages/core](packages/core), which owns the MCP
server, the tool registry and the API client. Core is never published: each
server compiles it into its own single-file bundle.

The image is an OAuth 2.0 protected resource as well as a bearer-token endpoint:
it publishes RFC 9728 metadata at `/.well-known/oauth-protected-resource`, so an
MCP client can obtain a token from the DYNO Mapper API instead of asking the
caller to paste one, and it still accepts a personal access token in a header.
See [HOSTING.md](HOSTING.md#oauth-and-personal-access-tokens).

## Which one do I need?

- **An MCP client that launches a process** — Claude Desktop, Claude Code, an
  editor plugin: install the npm package. Start with
  [packages/stdio/README.md](packages/stdio/README.md).
- **An agent that cannot launch a process** — GitHub's Copilot coding agent, a
  hosted assistant: run the image. Start with [HOSTING.md](HOSTING.md).

The two are not interchangeable: the npm package answers stdin/stdout only and
refuses `--http`, while the image serves HTTP only and refuses `--stdio`. Each
error names the artifact that does what the caller asked for.

## Layout

```
packages/core   MCP server, tool registry, API client, transport-selection rule
packages/stdio  stdio entrypoint + bin, published to npm
packages/http   Streamable HTTP app, config, host/auth/rate-limit guards, image
Dockerfile      builds only packages/http
HOSTING.md      the hosted contract: endpoint, settings, CDN deployment, Copilot
```

## Development

Requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`: Vite+ and Vitest both
refuse older runtimes.

```bash
npm install         # links the workspaces and installs the git hooks
npm run dev         # stdio server from source
npm run dev:http    # hosted server from source (http://127.0.0.1:3000/mcp)
npm test            # vitest, every workspace
npm run check       # format, lint and type-check every workspace
npm run build       # both single-file bundles
npm run check:artifact  # assert what the npm tarball and the image bundle contain
npm run check:secrets   # fail on a credential in any file git would commit
npm run verify      # all of the above, in CI order
```

`npm run verify` is the gate CI runs before it builds the image. The static
checks use Oxfmt, Oxlint's type-aware rules and tsgolint; `npm run format`
applies formatting in place. A pre-commit hook runs `vp check --fix` on staged
files — set `HUSKY=0` to skip it.

`npm run check:artifact` is not ceremony: it is what proves the npm tarball has
no hosted code in it, that every bare import in the stdio bundle is a declared
dependency, and that the version was compiled in rather than left unresolvable.

## License

Apache-2.0. See [LICENSE](LICENSE).
