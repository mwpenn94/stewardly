# Archival PR Draft — `mwpenn94/stewardly-ai`

This document is the draft of the PR that will be opened against the
legacy `mwpenn94/stewardly-ai` repository once the seven-day watch
window has completed cleanly. The PR is the *only* mechanism by which
stewardly-ai's main branch is touched after cutover; the destructive
"Archive repository" click in GitHub Settings is a separate, manual
operator action gated by Mike.

---

## PR Title

```
chore: redirect repository to mwpenn94/stewardly (v3 cutover)
```

## PR Description

> The Stewardly v3 build (clean foundation = `mwpenn94/manus-next-app`,
> with five renamed engines, the wealth-engine port, additive schema
> migration, glass component integration, and full Phase-3 customer-data
> migration) has been live at `stewardly.app` for seven days with all
> green dashboards and zero customer-visible regressions.
>
> This PR retires the codebase here and points everything to
> `mwpenn94/stewardly`. It does not delete anything. The git history,
> all branches, and the issue tracker remain readable.
>
> The single destructive action — clicking "Archive this repository"
> in GitHub Settings — is intentionally **not** part of this PR and
> remains Mike's manual click after merge.

## File changes in the PR

The PR introduces three additions and updates two files. None of the
existing code is removed.

### `ARCHIVED.md` (new)

```markdown
# This repository has been archived

Stewardly's active development moved to **[mwpenn94/stewardly](https://github.com/mwpenn94/stewardly)**
on 2026-05-13 after a seven-day green watch window post-cutover.

The full history, branches, and issue tracker remain available here for
reference. New issues, pull requests, and deploys should be filed
against `mwpenn94/stewardly`.

If you have a customer-data question that pre-dates the cutover, the
relevant artifacts are also imported into v3 (`migrations/scripts/`).
```

### `README.md` (replaced)

```markdown
# stewardly-ai (archived)

Active development moved to **[mwpenn94/stewardly](https://github.com/mwpenn94/stewardly)**
on 2026-05-13. See [ARCHIVED.md](./ARCHIVED.md) for context.
```

The previous README is preserved at `docs/legacy/README.md` for any
operator who needs to reference the original setup steps.

### Tag

The PR includes the operator instruction to tag the merge commit as
`v-final-pre-archival` so the exact pre-archive tree is permanently
referenceable.

### `.github/repo-config.yml` (new)

```yaml
# Read by mwpenn94/.github automation. Not strictly required by GitHub
# itself; the actual archive flag is set via the UI in step 3 below.
archived: true
redirect_to: mwpenn94/stewardly
archived_on: "2026-05-13"
reason: "Replaced by Stewardly v3 build (clean foundation + engine modules)."
```

### Branch protection

The PR removes the `protect-main` rule on this repo so the archive flag
can be applied. (Branch protection rules block GitHub's archive button.)

## Operator post-merge steps

Once the PR is merged:

1. Tag the merge commit: `git tag v-final-pre-archival && git push origin v-final-pre-archival`.
2. Open the rendered repo in GitHub.
3. Settings → General → scroll to "Danger Zone" → click **Archive this repository** → confirm.

The repository is now read-only. Any operator who tries to push to
`main` will receive `archived` from the API.

## Rollback

If a critical issue is discovered after archival:

1. Settings → General → click **Unarchive this repository**.
2. Revert the merge commit on `main`.
3. Open a new PR re-applying the previous README and removing
   `ARCHIVED.md`.
4. Notify the team in `#stewardly-ops`.

Unarchive + revert is fully non-destructive; everything in `main`
remains intact under the archive flag.
