# Public-repo hygiene

This repository is public. Everything the studio commits is read by strangers, indexed by
search engines, and permanent in git history. The checklist below is enforced by
`npm run studio:check` over the studio-owned paths; the reasoning is here.

## Never committed

| Category | Examples | Why |
|---|---|---|
| **Secrets** | API keys, tokens, passwords, private keys, `.env` contents | Obvious, and unrecoverable once pushed |
| **Personal identifiers** | Home or street addresses, phone numbers, email addresses, full names of private individuals, dates of birth | The studio's work needs none of it |
| **Private planning paths** | Absolute paths into personal folders, cloud-drive paths, note-vault paths | Leaks a private directory structure and the fact of what is in it |
| **Note-vault syntax** | `[[wikilinks]]`, note front-matter copied from private notes <!-- studio-check:allow --> | A tell that private material was pasted in, and a broken link for every reader |
| **Private context** | Household, health, family, financial or employment details | None of it belongs to this project |
| **Verbatim direction** | The executive's raw messages | The repo records the resulting *decision*, in neutral technical language |
| **Oversized binaries** | Anything over 1 MB, uncompressed art, audio files | The studio synthesizes audio and draws its own art; a big file is a smell |

## Always true of what is committed

- A stranger can read any studio document and understand it without outside context.
- Tickets and decisions are written in neutral technical language, in the third person.
- Commit messages are conventional and describe the change, not the conversation.
- Links between documents are relative repo paths that resolve on GitHub.
- The repository's existing license applies to everything added.

## Translating direction into the record

The executive's input arrives as conversation. It enters the repo only after translation:

| Input | Repo record |
|---|---|
| "make it moodier, the current thing is too cheerful" | `SS-0NN: lower the gallery's ambient brightness and shift the accent toward the cool end of the palette. Motivation: art direction feedback — the current treatment reads too bright for the intended mood.` |
| A "no" to a proposal | A ticket closed as *won't do*, with the technical reason |
| A preference with no reason given | A decision record stating the choice and that it was a directed preference |

Nothing is lost by this: the verbatim version is kept privately, outside the repository.

## When a leak happens

1. Stop. Do not push.
2. If it is unpushed, amend or rebase it out and re-run the check.
3. If it is already pushed, report it immediately and treat any exposed credential as
   compromised — rotate first, clean history second.
