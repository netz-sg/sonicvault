<p align="right">
  <a href="https://buymeacoffee.com/sgnetz">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-E8A849?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node">
  <img src="https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/lang-EN%20%7C%20DE-lightgrey?style=flat-square" alt="Languages">
</p>

<h1 align="center">SonicVault</h1>

<p align="center">
  <strong>Your music collection is a mess. SonicVault fixes that.</strong>
</p>

<p align="center">
  Self-hosted music library manager that scans your files, pulls metadata from the best sources on the web, and organizes everything into a clean folder structure — automatically. Runs on your hardware, works with Plex, Jellyfin, and Emby out of the box.
</p>

---

## What It Does

You point SonicVault at a folder full of badly named music files. It figures out what each file is, grabs artist bios, album details, cover art, genres, and synced lyrics from multiple online databases — then sorts everything into a properly structured library with consistent naming.

**Before:**
```
downloads/
  track01.flac
  Unknown Artist - Song.mp3
  album_rip_2024.flac
```

**After:**
```
library/
  Radiohead/
    1997 - OK Computer/
      01 - Airbag.flac
      02 - Paranoid Android.flac
      cover.jpg
  Daft Punk/
    2001 - Discovery/
      01 - One More Time.flac
```

No cloud dependencies. No subscriptions. Just your music, properly organized.

## Features

- **Smart Scanning** — Reads audio metadata from FLAC, MP3, AAC, OGG, and more using embedded tags and acoustic fingerprinting
- **Metadata Enrichment** — Automatically fetches artist bios, album details, genres, cover art, and synced lyrics from multiple sources
- **Library Organization** — Moves or copies files into a clean folder structure with customizable naming patterns
- **Cover Art** — Downloads high-resolution cover art and optionally embeds it directly into audio files
- **Tag Writing** — Writes corrected metadata back into file tags after enrichment
- **NFO Generation** — Creates .nfo sidecar files for media server compatibility
- **Auto-Watch** — Monitors your library and automatically processes new files on a configurable interval
- **Source Folders** — Scan from multiple locations (downloads, NAS, USB drives) into one organized library
- **Undo Operations** — Every file operation can be reversed from the operations history
- **Multi-Language** — Full English and German interface, selectable during setup or in settings
- **Docker Ready** — Ship it anywhere with the included Dockerfile and docker-compose setup

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | [Next.js 14](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), [Drizzle ORM](https://orm.drizzle.team/) |
| Audio | [music-metadata](https://github.com/borewit/music-metadata), [node-taglib-sharp](https://github.com/benrr101/node-taglib-sharp) |
| Images | [sharp](https://sharp.pixelplumbing.com/) |
| State | [Zustand](https://zustand.docs.pmnd.rs/), [TanStack Query](https://tanstack.com/query) |
| Icons | [Lucide](https://lucide.dev/) |

## APIs & Data Sources

SonicVault enriches your library using these free, public APIs:

| Source | What It Provides | Link |
|--------|-----------------|------|
| **MusicBrainz** | Artist, album, and track identification. The backbone of all metadata lookups. | [musicbrainz.org](https://musicbrainz.org/) |
| **Cover Art Archive** | Album cover art in multiple resolutions, sourced from the MusicBrainz ecosystem. | [coverartarchive.org](https://coverartarchive.org/) |
| **fanart.tv** | High-quality artist images, backgrounds, and additional album artwork. Requires a free API key. | [fanart.tv](https://fanart.tv/) |
| **LRCLIB** | Synced and plain-text lyrics, community-maintained and completely free. | [lrclib.net](https://lrclib.net/) |
| **Wikipedia / Wikidata** | Artist biographies and contextual information. | [wikidata.org](https://www.wikidata.org/) |
| **AcoustID** | Audio fingerprinting for identifying unknown tracks. *(Planned — not yet active)* | [acoustid.org](https://acoustid.org/) |

> MusicBrainz, Cover Art Archive, and LRCLIB require no API keys. fanart.tv needs a free key — sign up at [fanart.tv/get-an-api-key](https://fanart.tv/get-an-api-key/).

## Installation

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/netz-sg/sonicvault.git
cd sonicvault/docker
cp .env.example .env
```

Edit `.env` — point `MUSIC_PATH` to your music folder:
```env
PORT=3000
MUSIC_PATH=/path/to/your/music
```

Start it:
```bash
docker compose up -d --build
```

Open `http://localhost:3000` and follow the setup wizard.

### Option 2: Native (Node.js)

**Requirements:** Node.js 20+, npm

```bash
git clone https://github.com/netz-sg/sonicvault.git
cd sonicvault
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. The setup wizard will guide you through configuration.

### Environment Variables

Create a `.env` file in the project root:

```env
# Where SonicVault stores its database and cached images
DATA_PATH=./data

# Optional API keys
FANART_API_KEY=your_fanart_key
ACOUSTID_API_KEY=your_acoustid_key
```

## Configuration

All settings are configurable through the web interface under **Settings**:

| Setting | Description |
|---------|------------|
| **Library Path** | Destination folder for organized music files |
| **Naming Patterns** | Customize folder/file naming (`{artist}`, `{year}`, `{album}`, `{track_number}`, `{title}`) |
| **Organize Mode** | Copy or move files from source to library |
| **Duplicate Handling** | Skip, overwrite, or rename when a file already exists |
| **Auto Tag Write** | Automatically write corrected metadata back into audio files |
| **Cover Embedding** | Embed cover art directly into audio file metadata |
| **NFO Generation** | Generate .nfo sidecar files for media servers |
| **Auto-Watch** | Periodically scan, enrich, and organize new files |
| **Interface Language** | English or German |

## Project Structure

```
sonicvault/
├── renderer/                  # Next.js application
│   ├── app/                   # Pages and API routes
│   │   ├── api/               # REST API (albums, artists, tracks, settings, ...)
│   │   ├── albums/            # Album browser
│   │   ├── artists/           # Artist browser
│   │   ├── scan/              # Scanner page
│   │   └── settings/          # Settings page
│   ├── components/            # React components
│   │   ├── layout/            # Sidebar, TopBar, AppShell
│   │   ├── onboarding/        # Setup wizard
│   │   └── ui/                # Reusable UI primitives
│   ├── lib/
│   │   ├── api/               # External API clients (MusicBrainz, fanart, etc.)
│   │   ├── db/                # Database schema, migrations, connection
│   │   ├── i18n/              # Translations (EN/DE)
│   │   ├── services/          # Scanner, enrichment, organizer logic
│   │   └── store/             # Zustand state stores
│   └── styles/                # Global CSS, Tailwind config
├── docker/                    # Dockerfile, docker-compose, migration runner
├── drizzle.config.ts          # Drizzle ORM configuration
└── package.json
```

## Contributing

Contributions are welcome. Fork the repo, create a branch, and open a pull request.

If you find a bug or have a feature request, [open an issue](https://github.com/netz-sg/sonicvault/issues).

## License

MIT

---

<p align="center">
  Built with obsessive attention to music metadata by <a href="https://github.com/netz-sg">@netz-sg</a>
</p>
