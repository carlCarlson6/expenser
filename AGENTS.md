<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Before starting with any kind of work read README.md file, it is the source of truth.
Keep it always up to date if making app changes during development cycle.

Always make a plan before executing the job, wait for user change requests or approval.
If approval create a new branch and worktree and proceed there with changes, then wait again for user changes or approval.

If approval do the following:
- rebase over current orign/main
- commit and push changes
- create PR
- remove local branch and worktree