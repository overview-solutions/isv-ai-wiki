# Tasks — GitHub Issues

Follow-ups are tracked as **[GitHub Issues](https://github.com/overview-solutions/isv-ai-wiki/issues)** on this repo. The wiki Tasks page reads them via the public GitHub API.

## Where to see progress

| View | Link |
|------|------|
| Wiki task board | https://overview-solutions.github.io/isv-ai-wiki/index.html#tasks |
| Per-meeting summary | Top of each meeting note in the wiki (e.g. `#notes/metering-2026-05-28`) |
| GitHub Issues (edit here) | https://github.com/overview-solutions/isv-ai-wiki/issues |

Create, comment, assign, label, and close on **GitHub**. The wiki is a read-only dashboard that refreshes on load.

## Create a follow-up

1. [New issue → Follow-up task template](https://github.com/overview-solutions/isv-ai-wiki/issues/new?template=follow-up)
2. Fill in the form
3. Add a **meeting** label on the issue sidebar, e.g. `meeting-metering-2026-05-28`
4. Assign someone on GitHub if they have repo access
5. Comment on the issue for updates; close when done

## Labels to create (one-time)

Repo maintainers can add these labels under **Issues → Labels**:

| Label | Color suggestion | Purpose |
|-------|------------------|---------|
| `task` | Green | Default for follow-up template |
| `meeting-metering-2026-05-28` | Blue | Tech Comm 28 May 2026 |
| `meeting-power-africa-2026-workshop-planning` | Blue | Power Africa workshop |
| `in-progress` | Yellow | Active work |
| `blocked` | Red | Blocked |
| `priority-high` | Orange | Optional priority |
| `priority-medium` | Gray | Optional priority |
| `priority-low` | Gray | Optional priority |

With [GitHub CLI](https://cli.github.com/):

```bash
gh label create task --color 1a7f37 --repo overview-solutions/isv-ai-wiki
gh label create meeting-metering-2026-05-28 --color 0969da --repo overview-solutions/isv-ai-wiki
gh label create meeting-power-africa-2026-workshop-planning --color 0969da --repo overview-solutions/isv-ai-wiki
gh label create in-progress --color bf8700 --repo overview-solutions/isv-ai-wiki
gh label create blocked --color cf222e --repo overview-solutions/isv-ai-wiki
gh label create priority-high --color d1242f --repo overview-solutions/isv-ai-wiki
gh label create priority-medium --color 656d76 --repo overview-solutions/isv-ai-wiki
gh label create priority-low --color 656d76 --repo overview-solutions/isv-ai-wiki
```

## Status rules (wiki display)

| GitHub state | Labels | Shown as |
|--------------|--------|----------|
| Open | `blocked` | Blocked |
| Open | `in-progress` | In progress |
| Open | (neither) | Not started |
| Closed | — | Done |

## Config

Meeting metadata and repo URLs live in [`config.json`](config.json). The wiki loads this file plus live issues from the API.

## Legacy `tasks.json`

Previous catalog entries are preserved in [`tasks-archive.json`](tasks-archive.json) for reference while issues are migrated.
