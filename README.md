# n8n-nodes-postcards

[![npm](https://img.shields.io/npm/v/n8n-nodes-postcards.svg)](https://www.npmjs.com/package/n8n-nodes-postcards)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

The official n8n community node for [Postcards](https://designmodo.com/postcards) — the drag-and-drop email builder by Designmodo.

Design your emails visually in Postcards, then use this node to fetch them in n8n and export production-ready HTML. Pipe the output into any sending service — SendGrid, Mailgun, Amazon SES, Gmail — or into your own API.

## Installation

In n8n, go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-postcards
```

## Credentials

Generate an API key in your [Postcards](https://designmodo.com/postcards) account settings — it looks like `sk-pcds-api03-...`. See the [API guide](https://help.designmodo.com/article/537-api-getting-started) for details.

In n8n, add a **Postcards API** credential and paste the key.

## Operations

| Resource | Operation | Description |
|----------|-----------|-------------|
| Project | List | List projects in the team, optionally filtered by folder |
| Project | Get | Get one project by ID |
| Project | Export | Export a project to HTML or ZIP |
| Folder | List | List all folders in the team |
| Folder | Get | Get a folder and its projects |
| Usage | Get | Get export quota and active plan |

## Export options

| Option | Description |
|--------|-------------|
| Image Hosting | Upload assets to Postcards hosting and reference them by URL. Off returns a ZIP with local assets. |
| Use CDN | Serve assets from the Postcards CDN. Requires Image Hosting and the Pro plan. |
| Minify HTML | Strip whitespace from the exported markup. |
| Format | Return JSON `{ html }` or raw HTML. |
| Variables | Map of `{{key}}` placeholder substitutions. Values must be scalar. |
| Binary Property | Name of the binary property to store the ZIP in. Defaults to `data`. |

With Image Hosting on you get HTML on the `json` output. With it off the export arrives as a ZIP on the binary output, ready to hand to a file node or an upload step.

## Notes

Exports are metered per team plan — check the **Usage** resource before running Export in a loop.

The node sets `usableAsTool`, so n8n AI Agent nodes can call it directly.

## Links

* [Postcards](https://designmodo.com/postcards) — product page
* [Postcards API guide](https://help.designmodo.com/article/537-api-getting-started)
* [Designmodo](https://designmodo.com) — design tools and resources
* [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/installation/)

## License

[MIT](LICENSE.md) © [Designmodo](https://designmodo.com)
