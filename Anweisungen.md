SonicVault – MVP Build Guide für Claude Code
Projektübersicht
SonicVault ist ein Self-Hosted Music Library Manager – vergleichbar mit Lidarr/MusicBrainz Picard, aber mit einer atemberaubenden, modernen UI. Die App verwaltet Musikbibliotheken: Artists, Alben und Tracks werden automatisch mit Metadaten, Covers, Lyrics und Artist-Informationen angereichert.
Zielplattformen: macOS, Windows (via Electron) und Docker (Web-App)
Eine Codebase. Ein Framework. Eine Sprache: TypeScript.

Tech Stack (STRIKT EINHALTEN)
KomponenteTechnologieZweckFrameworkNext.js 14+ (App Router)Frontend + Backend API in einemDesktopElectron (via nextron)Native Desktop-AppDockerNode.js ContainerGleicher Next.js BuildDatenbankbetter-sqlite3Lokale DB, kein externer ServerORMDrizzle ORMType-safe DB-Zugriff, SQLite-AdapterAudio Parsingmusic-metadataID3, FLAC, Ogg, MP3 Tags lesenAudio Tag Writingnode-taglib-sharpTags SCHREIBEN in Audio-DateienBild-ProcessingsharpCover-Resize, ThumbnailsState ManagementZustandLeichtgewichtig, kein BoilerplateData FetchingTanStack Query (React Query)Caching, Refetching, Loading StatesStylingTailwind CSS 4Utility-first CSSAnimationenFramer MotionPage Transitions, Micro-InteractionsIconsLucide ReactKonsistente Icon-Library
Keine weiteren Frameworks oder Libraries hinzufügen, außer es ist absolut notwendig.

Kostenlose APIs (NUR DIESE VERWENDEN)
Primär: MusicBrainz API

URL: https://musicbrainz.org/ws/2/
Format: JSON (?fmt=json)
Rate Limit: 1 Request/Sekunde
Auth: Keine – aber User-Agent Header PFLICHT: SonicVault/1.0.0 (kontakt@example.com)
Liefert: Artists, Release Groups, Releases, Recordings, Labels, Genres, Tags
Doku: https://musicbrainz.org/doc/MusicBrainz_API

Cover Art Archive

URL: https://coverartarchive.org/
Rate Limit: Keine harten Limits
Auth: Keine
Liefert: Album-Cover in verschiedenen Auflösungen (250px, 500px, 1200px, original)
Endpunkt: https://coverartarchive.org/release/{mbid}/front-500 für 500px Cover

Fanart.tv

URL: https://webservice.fanart.tv/v3/music/
Auth: Kostenloser API-Key (registrieren auf fanart.tv)
Liefert: Artist Thumbnails, HD Artist Backgrounds, Logos, CD Art, Album Cover
Endpunkt: https://webservice.fanart.tv/v3/music/{mbid}?api_key={KEY}

LRCLib

URL: https://lrclib.net/api/
Auth: Keine
Liefert: Synced Lyrics (LRC-Format) und Plain Lyrics
Endpunkt: GET /api/get?artist_name={}&track_name={}&album_name={}&duration={}

AcoustID

URL: https://api.acoustid.org/v2/lookup
Auth: Kostenloser API-Key (registrieren auf acoustid.org)
Liefert: Audio-Fingerprint → MusicBrainz Recording ID Matching
Hinweis: Braucht fpcalc Binary (Chromaprint) als externe Dependency

Wikipedia/Wikidata

URL: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
Auth: Keine
Liefert: Artist-Biografien, Bandgeschichte
Verknüpfung: MusicBrainz liefert Wikidata-IDs in den Relations


Datenbank-Schema (SQLite via Drizzle)
typescript// schema.ts – Drizzle ORM Schema

artists
├── id              TEXT PRIMARY KEY (UUID)
├── mbid            TEXT UNIQUE          // MusicBrainz ID
├── name            TEXT NOT NULL
├── sort_name       TEXT
├── type            TEXT                 // Person, Group, Orchestra, etc.
├── country         TEXT
├── begin_date      TEXT
├── end_date        TEXT
├── biography       TEXT                 // von Wikipedia
├── image_url       TEXT                 // von Fanart.tv
├── background_url  TEXT                 // HD Background von Fanart.tv
├── genres          TEXT                 // JSON Array als String
├── tags            TEXT                 // JSON Array als String
├── metadata_status TEXT DEFAULT 'pending' // pending, partial, complete
├── created_at      INTEGER
└── updated_at      INTEGER

albums
├── id              TEXT PRIMARY KEY (UUID)
├── mbid            TEXT UNIQUE          // MusicBrainz Release Group ID
├── release_mbid    TEXT                 // Spezifischer Release
├── artist_id       TEXT REFERENCES artists(id)
├── title           TEXT NOT NULL
├── release_date    TEXT
├── type            TEXT                 // Album, Single, EP, Compilation
├── label           TEXT
├── catalog_number  TEXT
├── country         TEXT
├── track_count     INTEGER
├── cover_url       TEXT                 // von Cover Art Archive
├── cover_small     TEXT                 // 250px Thumbnail
├── genres          TEXT                 // JSON Array
├── metadata_status TEXT DEFAULT 'pending'
├── created_at      INTEGER
└── updated_at      INTEGER

tracks
├── id              TEXT PRIMARY KEY (UUID)
├── mbid            TEXT                 // MusicBrainz Recording ID
├── album_id        TEXT REFERENCES albums(id)
├── artist_id       TEXT REFERENCES artists(id)
├── title           TEXT NOT NULL
├── track_number    INTEGER
├── disc_number     INTEGER DEFAULT 1
├── duration_ms     INTEGER
├── file_path       TEXT                 // Lokaler Dateipfad
├── file_format     TEXT                 // mp3, flac, ogg, etc.
├── bitrate         INTEGER
├── sample_rate     INTEGER
├── lyrics_plain    TEXT
├── lyrics_synced   TEXT                 // LRC Format
├── acoustid        TEXT                 // Fingerprint ID
├── metadata_status TEXT DEFAULT 'pending'
├── created_at      INTEGER
└── updated_at      INTEGER

// Source Folders – Quellordner die überwacht/gescannt werden
source_folders
├── id              TEXT PRIMARY KEY (UUID)
├── path            TEXT NOT NULL UNIQUE  // z.B. /downloads/music
├── label           TEXT                  // Benutzerfreundlicher Name
├── auto_scan       INTEGER DEFAULT 0     // 1 = automatisch scannen bei Änderungen
├── auto_organize   INTEGER DEFAULT 0     // 1 = automatisch organisieren nach Scan
├── created_at      INTEGER
└── updated_at      INTEGER

// File Operations Log – Protokoll aller Datei-Operationen (Undo-fähig)
file_operations
├── id              TEXT PRIMARY KEY (UUID)
├── track_id        TEXT REFERENCES tracks(id)
├── operation       TEXT NOT NULL          // move, rename, tag_write, copy, delete
├── source_path     TEXT NOT NULL          // Original-Pfad
├── target_path     TEXT                   // Neuer Pfad (null bei tag_write)
├── details         TEXT                   // JSON mit Details (z.B. alte/neue Tags)
├── status          TEXT DEFAULT 'completed' // completed, failed, undone
├── created_at      INTEGER
└── updated_at      INTEGER

// Zusätzlich: settings Tabelle für App-Konfiguration
settings
├── key             TEXT PRIMARY KEY
└── value           TEXT

// Wichtige Settings-Keys für den Organizer:
// library_path           → Zielordner für organisierte Musik (z.B. /music/library)
// naming_pattern_artist  → Ordner-Template für Artists (default: "{artist}")
// naming_pattern_album   → Ordner-Template für Alben (default: "{year} - {album}")
// naming_pattern_track   → Datei-Template für Tracks (default: "{track_number} - {title}")
// organize_mode          → "copy" oder "move" (Standard: "copy" – sicherer)
// auto_tag_write         → true/false – Metadaten automatisch in Dateien schreiben
// handle_duplicates      → "skip", "overwrite", "keep_both"
// cover_embed            → true/false – Cover in Audio-Dateien einbetten

API-Routen (Next.js App Router)
Alle API-Routen unter /app/api/:
POST   /api/library/scan          → Scannt einen Ordner nach Musikdateien
GET    /api/library/stats          → Dashboard-Statistiken

GET    /api/folders                 → Alle Source Folders auflisten
POST   /api/folders                 → Neuen Source Folder hinzufügen
DELETE /api/folders/[id]            → Source Folder entfernen
POST   /api/folders/[id]/scan       → Einzelnen Folder scannen

GET    /api/artists                → Alle Artists (paginiert, filterbar)
GET    /api/artists/[id]           → Artist Detail + Alben
POST   /api/artists/[id]/refresh   → Metadaten neu laden

GET    /api/albums                 → Alle Alben (paginiert, filterbar)
GET    /api/albums/[id]            → Album Detail + Tracks
POST   /api/albums/[id]/refresh    → Metadaten neu laden

GET    /api/tracks/[id]            → Track Detail
GET    /api/tracks/[id]/lyrics     → Lyrics laden/abrufen

POST   /api/metadata/search        → MusicBrainz Suche
POST   /api/metadata/identify      → AcoustID Fingerprint Matching
POST   /api/metadata/enrich        → Batch-Enrichment für pending Items

POST   /api/organizer/preview       → Dry-Run: Zeigt an was passieren würde (Moves, Renames, etc.)
POST   /api/organizer/execute        → Führt die Organisation aus (Move/Copy, Rename, Tag-Write)
POST   /api/organizer/undo          → Letzte Operation(en) rückgängig machen
GET    /api/organizer/history        → File Operations Log (paginiert)
POST   /api/organizer/tag-write      → Metadaten in Dateien schreiben (Batch)
POST   /api/organizer/embed-covers   → Cover-Art in Audio-Dateien einbetten (Batch)

GET    /api/settings               → App-Einstellungen
PUT    /api/settings               → Einstellungen speichern

UI/UX Design – Ästhetische Richtung
Design-Philosophie: „Obsidian Audio"
Eine dunkle, immersive, cinematic UI – inspiriert von High-End Audio-Equipment, Vinyl-Plattenläden bei Nacht und professionellen Mixing Consoles. Die App soll sich anfühlen wie ein Premium-Instrument, nicht wie eine generische Web-App.
Farbpalette (CSS Custom Properties)
css:root {
  /* Basis – Tiefes, warmes Schwarz mit Charakter */
  --bg-primary: #0A0A0C;          /* Fast-Schwarz mit bläulichem Unterton */
  --bg-secondary: #111115;         /* Leicht erhöht */
  --bg-tertiary: #1A1A21;          /* Cards, Panels */
  --bg-elevated: #222230;          /* Hover-States, aktive Elemente */

  /* Akzent – Warmes Bernstein/Gold (wie Röhrenverstärker-Glühen) */
  --accent-primary: #E8A849;       /* Primär-Akzent */
  --accent-secondary: #D4872A;     /* Dunklerer Akzent */
  --accent-glow: rgba(232, 168, 73, 0.15); /* Subtiler Glow-Effekt */

  /* Text */
  --text-primary: #F0EDE6;         /* Warmes Off-White */
  --text-secondary: #8A8694;        /* Gedämpftes Grau-Lila */
  --text-tertiary: #5A5666;         /* Subtle Labels */

  /* Semantisch */
  --success: #4ADE80;
  --warning: #FBBF24;
  --error: #F87171;

  /* Effekte */
  --glass: rgba(255, 255, 255, 0.03);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --shadow-deep: 0 24px 48px rgba(0, 0, 0, 0.4);
}
Typografie
Verwende Google Fonts – lade sie über next/font/google:

Headlines/Display: DM Serif Display – Elegant, editorial, warm
Body/UI: DM Sans – Clean, geometric, gut lesbar
Monospace (Metadaten, Zahlen): JetBrains Mono – Technisch, präzise

Design-Regeln (STRIKT EINHALTEN)

Glassmorphism sparsam einsetzen – Nur für Overlays und den Player-Bar. Backdrop-blur maximal auf 1-2 Ebenen.
Album-Cover sind King – Cover-Art soll groß, prominent und mit Schatten dargestellt werden. Auf der Artist-Seite: großes Cover des neuesten Albums als blurred Background-Element.
Micro-Interactions überall:

Hover auf Album-Cards: Cover hebt sich leicht an (translateY + scale), Schatten wird tiefer
Page Transitions: Framer Motion layoutId für nahtlose Cover-Übergänge zwischen Grid und Detail
Skeleton Loading States: Schimmernde Placeholders statt Spinner
Zahlen (Track-Count, Duration) zählen hoch bei Erscheinen


Der goldene Glow-Effekt:

Aktive/selektierte Elemente bekommen einen subtilen --accent-glow Box-Shadow
Die Scrollbar soll custom-styled sein (dünn, Akzentfarbe)
Bei Hover über Artist-Cards: Ein sehr subtiler radialer Gradient folgt dem Cursor


Layout-Prinzipien:

Sidebar-Navigation (links, 260px, collapsible)
Main Content Area mit max-width für Readability
Sticky Player-Bar am unteren Rand (wenn Audio-Playback implementiert)
Großzügiges Padding (24px–32px), keine engen Layouts


Keine generischen UI-Patterns:

KEINE Standard-Tables für Track-Listen → Stattdessen: Elegante nummerierte Listen mit Hover-Highlight
KEINE langweiligen Card-Grids → Stattdessen: Asymmetrische Masonry-Layouts oder elegante Grid-Variationen
KEINE Standard-Modals → Stattdessen: Slide-In Panels von rechts oder expandierende Inline-Details


Animationen (Framer Motion):

tsx   // Page-Entry Animation Pattern
   const stagger = {
     hidden: { opacity: 0 },
     show: {
       opacity: 1,
       transition: { staggerChildren: 0.06 }
     }
   };
   
   const fadeUp = {
     hidden: { opacity: 0, y: 20 },
     show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }
   };

Seitenstruktur & Komponenten
Pages
/                          → Dashboard (Übersicht, letzte Imports, Stats)
/artists                   → Artist Grid mit Suche & Filter
/artists/[id]              → Artist Detail (Bio, Alben, Top Tracks)
/albums                    → Album Grid mit Suche & Filter
/albums/[id]               → Album Detail (Tracklist, Cover groß, Metadaten)
/scan                      → Library Scanner (Ordner wählen, Fortschritt)
/organize                  → File Organizer (Preview, Execute, History, Undo)
/settings                  → Einstellungen (Source Folders, Library-Pfad, Naming, API-Keys)
Kernkomponenten
Layout
├── Sidebar               → Navigation, Library Stats, Quick Actions
├── TopBar                → Breadcrumbs, Search (Global), Scan-Button
├── MainContent           → Page Content
└── PlayerBar             → (Sticky Bottom, zeigt aktuellen Track - Placeholder für MVP)

Dashboard
├── StatsCards            → Animierte Zahlen (Artists, Alben, Tracks, Pending)
├── RecentlyAdded         → Horizontale Scroll-Reihe mit Album-Covers
├── MetadataProgress      → Fortschrittsanzeige für Enrichment-Queue
└── QuickActions          → Scan starten, Refresh All, etc.

ArtistGrid
├── SearchBar             → Instant-Filter
├── ArtistCard            → Bild, Name, Album-Count, Genre-Tags
└── EmptyState            → Schöner leerer Zustand mit CTA

ArtistDetail
├── ArtistHero            → Großes Artist-Bild, blurred BG, Name, Bio-Excerpt
├── ArtistBio             → Expandierbare Biografie
├── AlbumTimeline         → Chronologische Album-Liste mit Covers
└── GenreTags             → Farbige Tags

AlbumDetail
├── AlbumHeader           → Großes Cover, Titel, Artist, Release-Info
├── TrackList             → Nummerierte Track-Liste mit Duration
├── LyricsPanel           → Slide-In Panel für Lyrics eines Tracks
└── MetadataPanel         → Technische Infos (Label, Catalog#, Formate)

Scanner
├── FolderPicker          → Drag & Drop Zone oder Pfad-Eingabe
├── ScanProgress          → Animierter Fortschrittsbalken mit File-Counter
├── ScanResults           → Gefundene Dateien, Matches, Fehler
└── EnrichmentQueue       → Live-Updates während Metadaten geladen werden

Organizer
├── OrganizerDashboard    → Übersicht: Unorganisierte Files, Quick-Actions
├── NamingPatternEditor   → Live-Preview des Naming-Patterns mit Beispiel-Dateien
├── OrganizePreview       → Dry-Run Ergebnis: Tabelle mit "Vorher → Nachher" Pfaden
│                           Farbcodiert: Grün=Move, Blau=Rename, Orange=Merge, Rot=Conflict
├── OrganizeProgress      → Fortschrittsanzeige während Dateien verschoben werden
├── OperationHistory      → Timeline aller vergangenen Operationen mit Undo-Button
├── DuplicateResolver     → UI zum Auflösen von Duplikaten (Side-by-Side Vergleich)
└── TagWritePreview       → Zeigt an welche Tags in welche Dateien geschrieben werden

SourceFolders
├── FolderList            → Liste aller eingebundenen Quellordner mit Status
├── AddFolderDialog       → Pfad eingeben + Label + Auto-Optionen konfigurieren
└── FolderStats           → Pro Folder: Anzahl Files, letzter Scan, Status

Core Business Logic
1. Library Scanner
Ablauf:
1. User gibt Ordnerpfad ein (oder wählt via Electron-Dialog)
2. Rekursiv alle Audio-Dateien finden (.mp3, .flac, .ogg, .m4a, .wav, .aac, .wma, .opus)
3. Für jede Datei: Audio-Tags mit `music-metadata` lesen
4. Gruppierung nach Artist → Album → Track (basierend auf Tags)
5. DB-Einträge erstellen mit status='pending'
6. Enrichment-Queue starten (Background-Job)
2. Metadata Enrichment Pipeline
Für jeden Artist mit status='pending':
1. MusicBrainz: Suche nach Artist-Name → Artist MBID holen
2. MusicBrainz: Artist Details laden (Type, Country, Begin/End Date, Genres)
3. Wikipedia: Bio laden (über Wikidata-Relation aus MusicBrainz)
4. Fanart.tv: Artist-Bilder laden (Thumbnail, Background)
5. Status → 'complete'

Für jedes Album mit status='pending':
1. MusicBrainz: Release Group suchen (Artist MBID + Album Name)
2. MusicBrainz: Release Details (Label, Catalog#, Track Listing)
3. Cover Art Archive: Cover laden (front-500, front-1200)
4. Cover lokal speichern (z.B. /data/covers/{album-id}.jpg)
5. Status → 'complete'

Für jeden Track mit status='pending':
1. MusicBrainz: Recording matchen (über Album-Tracklist oder Suche)
2. LRCLib: Lyrics suchen (Artist + Track + Album + Duration)
3. Status → 'complete'

WICHTIG: Rate Limiting beachten!
- MusicBrainz: Max 1 Request/Sekunde → Queue mit Delays
- Alle anderen: Reasonable Delays (500ms zwischen Requests)
- Implementiere eine zentrale RequestQueue-Klasse mit Rate Limiting
3. Rate-Limited Request Queue
typescript// Zentrale Queue die ALLE API-Requests managed
class RequestQueue {
  // Separate Queues pro API mit eigenem Rate Limit
  // MusicBrainz: 1 req/sec
  // CoverArtArchive: 5 req/sec
  // Fanart.tv: 5 req/sec
  // LRCLib: 5 req/sec
  // Wikipedia: 10 req/sec
  
  // Methoden:
  // enqueue(api: string, request: () => Promise<T>): Promise<T>
  // getQueueStatus(): { pending: number, active: number, completed: number }
}
4. File Organizer – Automatisches Verschieben, Umbenennen & Tag-Writing
Dies ist eine KERNFUNKTION des MVP. Der User bindet Quellordner ein (z.B. /downloads/music), und SonicVault organisiert die Dateien automatisch in eine saubere Bibliotheksstruktur.
Konzept: Source Folders → Library Folder
QUELLORDNER (Source Folders)              BIBLIOTHEK (Library Folder)
┌──────────────────────────┐              ┌──────────────────────────────────────┐
│ /downloads/music/        │              │ /music/library/                      │
│   ├── song (1).mp3       │              │   ├── Rammstein/                     │
│   ├── album.zip extract/ │   ──────►    │   │   ├── 1995 - Herzeleid/          │
│   │   ├── 01.flac        │   Organize   │   │   │   ├── 01 - Wollt Ihr Das...  │
│   │   └── 02.flac        │              │   │   │   ├── 02 - Der Meister.flac  │
│   └── random_files/      │              │   │   │   └── cover.jpg              │
│       └── track.mp3      │              │   │   └── 2001 - Mutter/             │
└──────────────────────────┘              │   │       ├── 01 - Mein Herz...flac  │
                                          │   │       └── cover.jpg              │
┌──────────────────────────┐              │   └── Metallica/                     │
│ /nas/unsorted-music/     │   ──────►    │       └── 1991 - Metallica/          │
│   └── ...                │   Organize   │           ├── 01 - Enter Sandman.mp3 │
└──────────────────────────┘              │           └── cover.jpg              │
                                          └──────────────────────────────────────┘
Naming Pattern System
Der User konfiguriert Templates mit Platzhaltern:
Verfügbare Platzhalter:
{artist}          → Artist-Name (bereinigt für Dateisystem)
{album}           → Album-Titel
{year}            → Release-Jahr (oder "Unknown" als Fallback)
{track_number}    → Track-Nummer, zero-padded (01, 02, ...)
{disc_number}     → Disc-Nummer
{title}           → Track-Titel
{genre}           → Erstes Genre
{format}          → Dateiendung (mp3, flac, etc.)

Standard-Pattern:
  Artist-Ordner:  {artist}
  Album-Ordner:   {year} - {album}
  Track-Datei:    {track_number} - {title}

Ergebnis: /library/Rammstein/2001 - Mutter/01 - Mein Herz Brennt.flac
Organize-Ablauf (WICHTIG – immer Preview-First!)
Ablauf:
1. PREVIEW (Dry-Run) – IMMER ZUERST, NIE direkt ausführen!
   a. Alle Tracks mit status='pending' oder aus ausgewähltem Source Folder laden
   b. Für jeden Track: Ziel-Pfad berechnen basierend auf Naming-Pattern + Metadaten
   c. Konflikte erkennen:
      - Datei existiert bereits am Ziel → Duplicate
      - Mehrere Tracks mit gleichem Ziel-Pfad → Collision
      - Fehlende Metadaten (kein Artist/Album) → Unresolvable
   d. Preview-Liste zurückgeben mit:
      - source_path → target_path
      - operation: move | copy | skip | conflict
      - reason bei Konflikten

2. USER REVIEW
   - User sieht die komplette Preview-Tabelle in der UI
   - Kann einzelne Operationen deaktivieren/überspringen
   - Kann Konflikte manuell auflösen
   - Kann zwischen "Move" und "Copy" wählen

3. EXECUTE
   a. Für jede bestätigte Operation:
      - Zielordner erstellen (recursive mkdir)
      - Datei kopieren/verschieben
      - Operation in file_operations Log schreiben (für Undo!)
      - Track.file_path in DB updaten
   b. TAG WRITING (wenn aktiviert):
      - Metadaten aus DB in Audio-Datei schreiben (Artist, Album, Title, Track#, Year, Genre)
      - Cover-Art in Datei einbetten (wenn cover_embed=true)
      - Verwendet `music-metadata`-kompatible Library zum Schreiben → `node-taglib-sharp` oder `music-metadata-browser` mit write support
   c. COVER SPEICHERN
      - cover.jpg in jeden Album-Ordner kopieren
   d. AUFRÄUMEN
      - Leere Ordner in Source Folders nach Move löschen (optional, konfigurierbar)

4. UNDO
   - Jede Operation ist reversibel über das file_operations Log
   - Move rückgängig = Datei zurück verschieben
   - Tag-Write rückgängig = alte Tags aus details-JSON wiederherstellen
   - Copy rückgängig = Kopie am Ziel löschen
Tag-Writing Details
Welche Tags werden geschrieben (aus der DB):
- TITLE        → track.title
- ARTIST       → artist.name
- ALBUM        → album.title  
- ALBUMARTIST  → artist.name
- TRACKNUMBER  → track.track_number
- DISCNUMBER   → track.disc_number
- DATE/YEAR    → album.release_date (Jahr extrahieren)
- GENRE        → artist.genres[0] oder album.genres[0]
- LYRICS       → track.lyrics_plain (wenn vorhanden)
- PICTURE      → Cover-Art als embedded image (wenn cover_embed=true)

Library zum Tag-Schreiben: `node-taglib-sharp`
- Unterstützt: MP3 (ID3v2.4), FLAC (Vorbis Comments), OGG, M4A (MP4), WMA, WAV
- npm: @aspect-build/aspect-tagged oder node-taglib-sharp
- WICHTIG: music-metadata kann nur LESEN, nicht schreiben!
Duplikat-Erkennung & Merge
Wenn eine Datei am Ziel bereits existiert:
1. Vergleiche: Duration, Bitrate, Sample Rate, File Size
2. Wenn identisch → Skip (ist die gleiche Datei)
3. Wenn unterschiedlich → Conflict anzeigen:
   - Side-by-Side Vergleich in der UI
   - User wählt: Bestehende behalten | Neue verwenden | Beide behalten
   - "Beide behalten" → Suffix anhängen: "01 - Title (2).flac"

Merge-Logik für fragmentierte Alben:
- Album-Ordner existiert schon mit einigen Tracks → Fehlende Tracks ergänzen
- Tracks aus verschiedenen Source Folders zum selben Album → Zusammenführen
- Verschiedene Qualitäten (MP3 + FLAC) → User fragen oder Konfiguration folgen

Ordnerstruktur
sonicvault/
├── main/                          # Electron Main Process
│   ├── background.ts
│   └── preload.ts
├── renderer/                      # Next.js App (= das Web-Frontend)
│   ├── app/
│   │   ├── layout.tsx             # Root Layout mit Sidebar + TopBar
│   │   ├── page.tsx               # Dashboard
│   │   ├── artists/
│   │   │   ├── page.tsx           # Artist Grid
│   │   │   └── [id]/page.tsx      # Artist Detail
│   │   ├── albums/
│   │   │   ├── page.tsx           # Album Grid
│   │   │   └── [id]/page.tsx      # Album Detail
│   │   ├── scan/page.tsx          # Library Scanner
│   │   ├── organize/page.tsx      # File Organizer
│   │   ├── settings/page.tsx      # Einstellungen
│   │   └── api/                   # API Routes (Backend)
│   │       ├── library/
│   │       │   ├── scan/route.ts
│   │       │   └── stats/route.ts
│   │       ├── artists/
│   │       │   └── [...]/route.ts
│   │       ├── albums/
│   │       │   └── [...]/route.ts
│   │       ├── tracks/
│   │       │   └── [...]/route.ts
│   │       ├── metadata/
│   │       │   ├── search/route.ts
│   │       │   ├── identify/route.ts
│   │       │   └── enrich/route.ts
│   │       ├── folders/
│   │       │   └── [...]/route.ts
│   │       ├── organizer/
│   │       │   ├── preview/route.ts
│   │       │   ├── execute/route.ts
│   │       │   ├── undo/route.ts
│   │       │   ├── history/route.ts
│   │       │   ├── tag-write/route.ts
│   │       │   └── embed-covers/route.ts
│   │       └── settings/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── PlayerBar.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RecentlyAdded.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── artists/
│   │   │   ├── ArtistCard.tsx
│   │   │   ├── ArtistGrid.tsx
│   │   │   ├── ArtistHero.tsx
│   │   │   └── ArtistBio.tsx
│   │   ├── albums/
│   │   │   ├── AlbumCard.tsx
│   │   │   ├── AlbumGrid.tsx
│   │   │   ├── AlbumHeader.tsx
│   │   │   └── TrackList.tsx
│   │   ├── scanner/
│   │   │   ├── FolderPicker.tsx
│   │   │   ├── ScanProgress.tsx
│   │   │   └── ScanResults.tsx
│   │   ├── organizer/
│   │   │   ├── OrganizerDashboard.tsx
│   │   │   ├── NamingPatternEditor.tsx
│   │   │   ├── OrganizePreview.tsx
│   │   │   ├── OrganizeProgress.tsx
│   │   │   ├── OperationHistory.tsx
│   │   │   ├── DuplicateResolver.tsx
│   │   │   └── TagWritePreview.tsx
│   │   ├── folders/
│   │   │   ├── FolderList.tsx
│   │   │   ├── AddFolderDialog.tsx
│   │   │   └── FolderStats.tsx
│   │   └── ui/
│   │       ├── SearchInput.tsx
│   │       ├── GenreTag.tsx
│   │       ├── Skeleton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── AnimatedNumber.tsx
│   │       └── CursorGlow.tsx    # Cursor-following Glow Effekt
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          # DB Connection (better-sqlite3)
│   │   │   ├── schema.ts         # Drizzle Schema
│   │   │   └── migrations/       # Auto-generated
│   │   ├── api/
│   │   │   ├── musicbrainz.ts    # MusicBrainz API Client
│   │   │   ├── coverart.ts       # Cover Art Archive Client
│   │   │   ├── fanart.ts         # Fanart.tv Client
│   │   │   ├── lrclib.ts         # LRCLib Client
│   │   │   ├── wikipedia.ts      # Wikipedia API Client
│   │   │   └── acoustid.ts       # AcoustID Client
│   │   ├── services/
│   │   │   ├── scanner.ts        # Datei-Scanner Logic
│   │   │   ├── enrichment.ts     # Metadata Enrichment Pipeline
│   │   │   ├── organizer.ts      # File Organizer (Move, Copy, Rename, Merge)
│   │   │   ├── tag-writer.ts     # Audio-Tag Writing (node-taglib-sharp)
│   │   │   ├── naming.ts         # Naming Pattern Parser & Path Builder
│   │   │   └── request-queue.ts  # Rate-Limited Request Queue
│   │   ├── store/
│   │   │   ├── useLibrary.ts     # Zustand Store
│   │   │   └── usePlayer.ts      # Player State (Placeholder)
│   │   └── utils/
│   │       ├── format.ts         # Duration, Date Formatting
│   │       └── audio.ts          # Audio-File Helpers
│   ├── styles/
│   │   └── globals.css           # Tailwind + CSS Custom Properties
│   └── public/
│       └── fonts/                # Falls Fonts lokal geladen werden
├── data/                          # Persistente Daten
│   ├── sonicvault.db             # SQLite Datenbank
│   └── covers/                   # Gespeicherte Cover-Bilder
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── drizzle.config.ts
├── next.config.js
├── electron-builder.yml
└── README.md

MVP Feature Scope (Phase 1)
MUSS ENTHALTEN:

 Source Folder Management: Mehrere Quellordner einbinden, Label vergeben, entfernen
 Library Scanner: Quellordner scannen, Audio-Dateien erkennen und Tags lesen
 Artist-Verwaltung: Automatisches Anlegen, MusicBrainz-Enrichment, Bilder, Bio
 Album-Verwaltung: Automatisches Anlegen, Cover Art, Release-Infos
 Track-Verwaltung: Tracklist pro Album, Duration, File-Info
 Lyrics: Automatisches Laden von LRCLib (plain + synced)
 File Organizer – Preview: Dry-Run der Organisation mit Vorher→Nachher Ansicht
 File Organizer – Execute: Dateien in Bibliotheksstruktur verschieben/kopieren
 File Organizer – Naming Patterns: Konfigurierbare Ordner-/Dateinamen-Templates mit Live-Preview
 File Organizer – Tag Writing: Metadaten aus DB in Audio-Dateien schreiben (Artist, Album, Title, Track#, Year, Genre)
 File Organizer – Cover Embed: Cover-Art in Audio-Dateien einbetten + cover.jpg in Album-Ordner
 File Organizer – Duplikaterkennung: Konflikte anzeigen, Side-by-Side Vergleich, User-Entscheidung
 File Organizer – Undo: Alle Operationen rückgängig machbar via Operations-Log
 File Organizer – Album Merge: Fragmentierte Alben aus verschiedenen Quellen zusammenführen
 Dashboard: Stats, Recently Added, Enrichment Status, Unorganisierte Files Counter
 Globale Suche: Artists + Alben durchsuchbar
 Settings: Source Folders, Library-Pfad, Naming Patterns, Organize Mode (Copy/Move), API-Keys
 Responsive UI mit allen Design-Vorgaben umgesetzt
 Docker-fähig (Dockerfile + docker-compose.yml mit Volume-Mounts für Source + Library)

NICHT IM MVP (spätere Phasen):

Audio-Playback
AcoustID Fingerprinting
Automatischer Folder-Watch (inotify/fsevents – Files werden nur bei manuellem Scan erkannt)
Multi-User Support
Mobile-optimiertes Layout
Automatisches Scheduling (z.B. "jeden Tag um 3 Uhr scannen und organisieren")


Docker-Konfiguration
dockerfile# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
VOLUME ["/data", "/music"]
EXPOSE 3000
CMD ["node", "server.js"]
yaml# docker-compose.yml
version: '3.8'
services:
  sonicvault:
    build: .
    container_name: sonicvault
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data                        # DB + Covers + Cache
      - /path/to/library:/music/library     # Ziel-Bibliothek (read-write)
      - /path/to/downloads:/music/source1   # Quellordner 1 (read-write für Move)
      - /path/to/nas/music:/music/source2   # Quellordner 2 (optional)
    environment:
      - LIBRARY_PATH=/music/library
      - DATA_PATH=/data
      - FANART_API_KEY=
      - ACOUSTID_API_KEY=
    restart: unless-stopped

Implementierungsreihenfolge
Baue das Projekt in dieser Reihenfolge auf:
Schritt 1: Projekt-Setup

Next.js App mit TypeScript initialisieren (App Router)
Tailwind CSS konfigurieren mit Custom Properties aus dem Design-System
Drizzle ORM + better-sqlite3 einrichten
DB-Schema erstellen und migrieren
Google Fonts laden (DM Serif Display, DM Sans, JetBrains Mono)

Schritt 2: Layout & Navigation

Root Layout mit Sidebar, TopBar, MainContent Area
Sidebar mit Navigation-Items und Library-Stats
Globale Suche im TopBar
Framer Motion Page Transitions einrichten

Schritt 3: API Clients

Rate-Limited Request Queue implementieren
MusicBrainz API Client
Cover Art Archive Client
Fanart.tv Client
LRCLib Client
Wikipedia Client

Schritt 4: Library Scanner

Scan-Page mit Folder-Eingabe
Backend: Rekursives Datei-Scanning
Backend: Audio-Tag Parsing mit music-metadata
Frontend: Scan-Fortschritt mit Live-Updates
Ergebnisse in DB speichern

Schritt 5: Metadata Enrichment

Enrichment Pipeline (Background-Prozess)
Artist-Enrichment (MusicBrainz → Wikipedia → Fanart.tv)
Album-Enrichment (MusicBrainz → Cover Art Archive)
Track-Enrichment (MusicBrainz → LRCLib)
Status-Tracking und Fehlerbehandlung

Schritt 6: File Organizer – Core

Naming Pattern Parser implementieren (Template → Pfad-Resolver)
Organize Preview Endpoint (Dry-Run: berechne alle Ziel-Pfade)
Organize Execute Endpoint (Copy/Move mit Logging)
File Operations Log in DB (für Undo)
Undo-Funktion implementieren

Schritt 7: File Organizer – Tag Writing & Covers

node-taglib-sharp integrieren
Tag-Write Service: DB-Metadaten → Audio-Datei-Tags
Cover-Embed: Cover-Art in Audio-Dateien einbetten
cover.jpg in Album-Ordner speichern
Batch-Processing mit Fortschrittsanzeige

Schritt 8: File Organizer – UI

Organize-Page mit Naming Pattern Editor (Live-Preview)
Preview-Tabelle: Vorher → Nachher mit Farbcodierung
Duplikat-Resolver UI (Side-by-Side)
Execute mit Progress-Bar und Live-Updates
Operation History Timeline mit Undo-Buttons

Schritt 9: Dashboard

Stats Cards mit animierten Zahlen
Recently Added Album-Row
Enrichment-Fortschritt
Unorganisierte Files Counter + Quick-Organize Button
Quick Actions

Schritt 10: Artist Pages

Artist Grid mit Suche/Filter
Artist Detail mit Hero, Bio, Album-Timeline
Artist-Karten mit Cursor-Glow-Effekt

Schritt 11: Album Pages

Album Grid mit Suche/Filter
Album Detail mit großem Cover, Tracklist
Lyrics-Panel (Slide-In)

Schritt 12: Settings

Settings-Page mit Tabs/Sections
Source Folder Management (Hinzufügen, Entfernen, Labels, Auto-Optionen)
Library-Pfad Konfiguration
Naming Pattern Konfiguration mit Live-Preview
Organize Mode (Copy vs. Move)
Tag-Writing Optionen (Auto-Write, Cover-Embed)
Duplikat-Handling Strategie (Skip, Overwrite, Keep Both)
API-Key Eingabe (Fanart.tv, AcoustID)
Manual Rescan/Refresh Trigger

Schritt 13: Docker & Polish

Dockerfile + docker-compose.yml mit Multi-Volume Setup
Environment-Variable Handling
Error Boundaries & Fallback UI
Loading States & Skeleton Screens überall
Finale Animation & Transition Polish


Wichtige Hinweise für die Implementierung

Rate Limiting ist kritisch – MusicBrainz WIRD dich blocken bei >1 req/sec. Die RequestQueue MUSS zuverlässig funktionieren.
User-Agent Header – MusicBrainz erfordert einen beschreibenden User-Agent. Ohne wird deine IP geblockt.
Cover lokal cachen – Lade Cover einmal herunter und speichere sie unter /data/covers/. Nie bei jedem Request neu laden.
Graceful Degradation – Wenn eine API nicht erreichbar ist, soll die App trotzdem funktionieren. Fehlende Daten = leere Felder, keine Crashes.
Die UI muss FERTIG aussehen – Keine Placeholder-Texte, keine "Lorem Ipsum", keine fehlenden Hover-States. Jedes Element soll polished sein.
Keine hardcodierten Pfade – Alles über Environment Variables oder Settings konfigurierbar.
TypeScript strict mode – Keine any Types, keine // @ts-ignore.
DATEI-SICHERHEIT IST OBERSTE PRIORITÄT:

Standard-Modus ist COPY, nicht MOVE. Move nur wenn User explizit umschaltet.
JEDE Datei-Operation wird in file_operations geloggt BEVOR sie ausgeführt wird.
Organize NIEMALS ohne Preview-Schritt ausführen – die UI muss den User zwingen, die Preview zu bestätigen.
Vor jedem Move/Copy: Prüfen ob genug Speicherplatz am Ziel vorhanden ist.
Bei Fehler während Batch-Operation: Abbrechen und bereits verschobene Dateien NICHT zurückrollen (stattdessen Status "partial" setzen und User informieren).
Dateinamen sanitizen: Sonderzeichen entfernen, max. 255 Zeichen, OS-kompatibel (kein :, ?, *, <, >, |, " auf Windows).


Tag-Writing Sicherheit:

Immer eine Backup-Kopie der Original-Tags im file_operations.details JSON speichern.
Encoding: UTF-8 für ID3v2.4, Latin1-Fallback nur für ID3v1.
Nicht auf Dateien schreiben die gerade von einem anderen Prozess gelesen werden (File Lock Check).


