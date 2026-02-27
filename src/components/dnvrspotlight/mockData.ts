// ─────────────────────────────────────────────
// Denver Spotlight Awards × Concierto
// Mock Data — Front-end demo only
// ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface NomineeLink {
  platform: string;
  label: string;
  url: string;
  icon: string;
}

export interface Nominee {
  id: string;
  name: string;
  subtitle: string;
  image?: string;
  bio?: string;
  mediaTags?: string[];
  links?: NomineeLink[];
}

export interface Winner {
  name: string;
  award: string;
  categoryId: string;
  description: string;
  image: string;
  link: string;
  year: number;
}

export interface ContactRow {
  'First Name': string;
  'Last Name': string;
  Email: string;
  Phone: string;
  City: string;
  'Category Voted': string;
  'Nominee Selected': string;
  Timestamp: string;
  'Vote Source': string;
}

// ─── Award Categories ───────────────────────
export const CATEGORIES: Category[] = [
  { id: 'aoty', name: 'Artist of the Year', icon: '◈' },
  { id: 'blp', name: 'Best Live Performance', icon: '◈' },
  { id: 'ba', name: 'Breakout Act', icon: '◈' },
  { id: 'djoty', name: 'DJ of the Year', icon: '◈' },
  { id: 'voty', name: 'Venue of the Year', icon: '◈' },
];

// ─── 2026 Nominees ──────────────────────────
export const NOMINEES: Record<string, Nominee[]> = {
  aoty: [
    {
      id: 'aoty-1',
      name: 'Marcus Delray',
      subtitle: 'Soul / R&B · Denver',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=300&fit=crop&q=80',
      bio: "Denver's most decorated soul voice. Marcus has been performing at Five Points venues since 2019, blending gospel roots with contemporary R&B storytelling. His 2025 Ogden run sold out in under 12 minutes.",
      mediaTags: ['#Soul', '#R&B', '#FivePoints', '#Gospel', '#LiveFirst', '#Authentic', '#Denver'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'YouTube', label: 'Watch on YouTube', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@marcusdelray', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'aoty-2',
      name: 'Sofia Vega',
      subtitle: 'Latin Indie · Aurora',
      image: 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=600&h=300&fit=crop&q=80',
      bio: "Aurora-born, Aurora-raised. Sofia fuses Spanish-language storytelling with indie rock instrumentation. Her bilingual EP 'Dos Mundos' hit #3 on Colorado charts in 2025.",
      mediaTags: ['#LatinIndie', '#Bilingual', '#Aurora', '#Singer-Songwriter', '#Indie', '#Cultural', '#Colorado'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@sofiavega.music', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'aoty-3',
      name: 'North Table Collective',
      subtitle: 'Folk / Americana · Golden',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=300&fit=crop&q=80',
      bio: "Five-piece folk collective from Golden. Formed in 2021, they've become synonymous with Colorado's roots revival — equal parts campfire warmth and mountain grit.",
      mediaTags: ['#Folk', '#Americana', '#RootsMusic', '#Golden', '#Ensemble', '#Colorado', '#Mountain'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Bandcamp', label: 'Buy on Bandcamp', url: '#', icon: '◈' },
        { platform: 'YouTube', label: 'Live Sessions', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@northtablecollective', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'aoty-4',
      name: 'Amara Jones',
      subtitle: 'Neo-Soul · Five Points',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=300&fit=crop&q=80',
      bio: "Five Points born and bred. Amara's voice carries the weight of Denver's Black music legacy and the fire of a new generation. Her 'Indigo Sessions' release was the city's most talked-about debut of 2025.",
      mediaTags: ['#NeoSoul', '#FivePoints', '#BlackMusic', '#Heritage', '#Vocalist', '#Soulful', '#Rising'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'YouTube', label: 'Watch on YouTube', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@amarajonesofficial', url: '#', icon: '◎' },
      ],
    },
  ],
  blp: [
    {
      id: 'blp-1',
      name: "River Crane · Cervantes'",
      subtitle: "Feb 14 · Valentine's Sellout",
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=300&fit=crop&q=80',
      bio: "Valentine's Day 2026 at Cervantes' Masterpiece. River Crane turned a sold-out crowd into a congregation — two hours of uninterrupted musical devotion. The setlist hasn't been repeated since.",
      mediaTags: ['#LiveMusic', "#Cervantes'", '#Sellout', '#ValentinesDay', '#Intimate', '#Denver', '#Legendary'],
      links: [
        { platform: 'Spotify', label: 'River Crane on Spotify', url: '#', icon: '♫' },
        { platform: 'Instagram', label: '@rivercrane', url: '#', icon: '◎' },
        { platform: 'Website', label: 'rivercrane.com', url: '#', icon: '◇' },
      ],
    },
    {
      id: 'blp-2',
      name: 'Neon Pueblo · Globe Hall',
      subtitle: 'Jan 20 · Standing Room Only',
      image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=300&fit=crop&q=80',
      bio: "Globe Hall couldn't hold them all. Neon Pueblo's January 20th set broke standing records for the Globeville venue and spawned three live recording bootlegs in one night.",
      mediaTags: ['#LiveEnergy', '#GlobeHall', '#StandingRoom', '#Globeville', '#Indie', '#HighEnergy', '#Historic'],
      links: [
        { platform: 'Spotify', label: 'Neon Pueblo on Spotify', url: '#', icon: '♫' },
        { platform: 'YouTube', label: 'Live Recording', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@neonpueblo', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'blp-3',
      name: 'The Westwood Sessions',
      subtitle: "Dec 31 · New Year's Eve",
      image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&h=300&fit=crop&q=80',
      bio: "New Year's Eve 2025. The Westwood Sessions brought together six Denver artists for a 4-hour collaborative set that felt like the city saying goodbye and hello at the same time.",
      mediaTags: ['#Collaborative', '#NewYearsEve', '#MultiArtist', '#Denver', '#Milestone', '#LateNight', '#Iconic'],
      links: [
        { platform: 'YouTube', label: 'Full Set Recording', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@westwoodsessions', url: '#', icon: '◎' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
      ],
    },
    {
      id: 'blp-4',
      name: 'Echo Cartel · Gothic Theatre',
      subtitle: 'Nov 8 · Special Event',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=300&fit=crop&q=80',
      bio: "November at the Gothic. Echo Cartel delivered their most ambitious production yet — a visual and sonic experience that fused Denver's underground with arena-level production values.",
      mediaTags: ['#GothicTheatre', '#Production', '#Underground', '#ElectronicLive', '#Immersive', '#Englewood', '#Dark'],
      links: [
        { platform: 'Spotify', label: 'Echo Cartel on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'Instagram', label: '@echocartel', url: '#', icon: '◎' },
      ],
    },
  ],
  ba: [
    {
      id: 'ba-1',
      name: 'Lila Frost',
      subtitle: 'Dream Pop · Denver',
      image: 'https://images.unsplash.com/photo-1535712579925-55f0e53a5d1d?w=600&h=300&fit=crop&q=80',
      bio: "Lila emerged from Denver's open mic circuit in early 2025 and by summer was headlining Larimer Lounge. Her dream-pop sound — all reverb, delay, and aching melodies — is unlike anything the Denver scene has produced.",
      mediaTags: ['#DreamPop', '#Ethereal', '#ReverbHeavy', '#NewVoice', '#Denver', '#OpenMic', '#Emerging'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@lilafrost', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'ba-2',
      name: 'Juno Vale',
      subtitle: 'Alt-R&B · Lakewood',
      image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=600&h=300&fit=crop&q=80',
      bio: "From Lakewood basements to Denver stages in under 18 months. Juno Vale's alt-R&B sound blends trap production with live instrumentation in a way that's genuinely hard to categorize.",
      mediaTags: ['#AltRnB', '#Lakewood', '#TrapSoul', '#LiveInstruments', '#Hybrid', '#Underground', '#Rising'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@junovale', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'ba-3',
      name: 'Desert Meridian',
      subtitle: 'Psychedelic Rock · Boulder',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=300&fit=crop&q=80',
      bio: "Boulder's psychedelic rock export. Desert Meridian spent two years in the Colorado wilderness recording their debut, and the result is an album that sounds like red rock cliffs talking back.",
      mediaTags: ['#PsychedelicRock', '#Boulder', '#AnalogRecording', '#Colorado', '#Cosmic', '#Independent', '#Trippy'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Bandcamp', label: 'Buy on Bandcamp', url: '#', icon: '◈' },
        { platform: 'YouTube', label: 'Watch on YouTube', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@desertmeridian', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'ba-4',
      name: 'Kai Solano',
      subtitle: 'Hip-Hop · Aurora',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=300&fit=crop&crop=right&q=80',
      bio: "Aurora's voice. Kai Solano dropped a debut mixtape that went viral locally and caught national blog attention within three days. His bars carry the weight of a city that rarely gets told its story right.",
      mediaTags: ['#HipHop', '#Aurora', '#Lyricism', '#StreetPoetry', '#Colorado', '#Raw', '#Independent'],
      links: [
        { platform: 'Spotify', label: 'Listen on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@kaisolano', url: '#', icon: '◎' },
      ],
    },
  ],
  djoty: [
    {
      id: 'djoty-1',
      name: 'DJ Plateau',
      subtitle: 'House / Techno · RiNo',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=300&fit=crop&q=80',
      bio: "RiNo's underground architect. DJ Plateau has been building the Denver house and techno scene from the ground up — running warehouse parties, venue residencies, and sets that run 4–6 hours without a break.",
      mediaTags: ['#House', '#Techno', '#RiNo', '#Warehouse', '#Underground', '#Residency', '#DeepSets'],
      links: [
        { platform: 'Spotify', label: 'DJ Plateau on Spotify', url: '#', icon: '♫' },
        { platform: 'SoundCloud', label: 'SoundCloud Mixes', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@djplateau', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'djoty-2',
      name: 'Yara Sounds',
      subtitle: 'Afrobeats / Global · Denver',
      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&h=300&fit=crop&q=80',
      bio: "Denver's most traveled DJ. Yara Sounds brings Afrobeats, Amapiano, and global dance music to Colorado crowds with an infectious energy that turns any room into a celebration.",
      mediaTags: ['#Afrobeats', '#Amapiano', '#GlobalMusic', '#Denver', '#Dancing', '#Inclusive', '#HighEnergy'],
      links: [
        { platform: 'Spotify', label: 'Yara Sounds on Spotify', url: '#', icon: '♫' },
        { platform: 'Apple Music', label: 'Apple Music', url: '#', icon: '♪' },
        { platform: 'YouTube', label: 'Mix Series', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@yarasounds', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'djoty-3',
      name: 'Blkout Cru',
      subtitle: 'Hip-Hop / Bass · Five Points',
      image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&h=300&fit=crop&q=80',
      bio: "Five Points collective running since 2022. Blkout Cru's rotating crew has made them Denver's most versatile hip-hop sound system — switching from golden age boom-bap to current trap to bass music mid-set.",
      mediaTags: ['#HipHop', '#Bass', '#FivePoints', '#Collective', '#BoomBap', '#Trap', '#Versatile'],
      links: [
        { platform: 'SoundCloud', label: 'SoundCloud Mixes', url: '#', icon: '◉' },
        { platform: 'YouTube', label: 'Watch on YouTube', url: '#', icon: '▶' },
        { platform: 'Instagram', label: '@blkoutcru', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'djoty-4',
      name: 'DJ Meridian',
      subtitle: 'Electronic / Trap · LoDo',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=300&fit=crop&q=80',
      bio: "LoDo's late-night specialist. DJ Meridian holds residencies at three of Denver's busiest clubs and has developed a signature sound that blends electronic production with trap sensibility.",
      mediaTags: ['#Electronic', '#Trap', '#LoDo', '#ClubScene', '#Residency', '#Nightlife', '#HighEnergy'],
      links: [
        { platform: 'Spotify', label: 'DJ Meridian on Spotify', url: '#', icon: '♫' },
        { platform: 'SoundCloud', label: 'SoundCloud', url: '#', icon: '◉' },
        { platform: 'Instagram', label: '@djmeridian', url: '#', icon: '◎' },
      ],
    },
  ],
  voty: [
    {
      id: 'voty-1',
      name: 'The Ogden Theatre',
      subtitle: '1621 E Colfax Ave · Cap Hill',
      image: 'https://images.unsplash.com/photo-1468817814611-b7edf94b5d60?w=600&h=300&fit=crop&q=80',
      bio: "Denver's crown jewel on Colfax Avenue. Since 1917, the Ogden has hosted everyone from Jimi Hendrix to emerging local talent. Cap Hill's 1600-capacity theatre is synonymous with Denver's musical identity.",
      mediaTags: ['#Historic', '#Colfax', '#CapHill', '#1600Cap', '#Heritage', '#AllGenres', '#Denver'],
      links: [
        { platform: 'Website', label: 'ogdentheatre.com', url: '#', icon: '◇' },
        { platform: 'Instagram', label: '@ogdentheatre', url: '#', icon: '◎' },
        { platform: 'Website', label: 'Upcoming Shows', url: '#', icon: '◇' },
      ],
    },
    {
      id: 'voty-2',
      name: 'Globe Hall',
      subtitle: '4483 Logan St · Globeville',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=300&fit=crop&q=80',
      bio: "Globeville's beloved 300-cap venue. Globe Hall is where Denver's indie community comes to breathe — no frills, no pretense, just great sound and a crowd that actually listens.",
      mediaTags: ['#Indie', '#Globeville', '#300Cap', '#Intimate', '#Community', '#NoFrills', '#LocalScene'],
      links: [
        { platform: 'Website', label: 'globehall.com', url: '#', icon: '◇' },
        { platform: 'Instagram', label: '@globehalldenver', url: '#', icon: '◎' },
      ],
    },
    {
      id: 'voty-3',
      name: "Cervantes' Masterpiece",
      subtitle: '2637 Welton St · Five Points',
      image: 'https://images.unsplash.com/photo-1425342605703-3af7aea2b6c8?w=600&h=300&fit=crop&q=80',
      bio: "Five Points institution since 1969. Cervantes' Masterpiece ballroom is as important to Denver culture as any building in the city — a venue where jazz, reggae, funk, and electronic music have all found a home.",
      mediaTags: ['#FivePoints', '#Historic', '#Ballroom', '#Jazz', '#Reggae', '#Legacy', '#Culture'],
      links: [
        { platform: 'Website', label: 'cervantesmasterpiece.com', url: '#', icon: '◇' },
        { platform: 'Instagram', label: "@cervantes'mv", url: '#', icon: '◎' },
        { platform: 'Website', label: 'Upcoming Events', url: '#', icon: '◇' },
      ],
    },
    {
      id: 'voty-4',
      name: 'The Gothic Theatre',
      subtitle: '3263 S Broadway · Englewood',
      image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=300&fit=crop&crop=top&q=80',
      bio: "Englewood's dark gem. The Gothic Theatre's 1000-cap room delivers a listening experience matched by few venues in the state. Its tiered floor and intimate balcony make every show feel like a special event.",
      mediaTags: ['#Gothic', '#Englewood', '#1000Cap', '#SBroadway', '#Atmosphere', '#Architecture', '#Legendary'],
      links: [
        { platform: 'Website', label: 'gothictheatre.com', url: '#', icon: '◇' },
        { platform: 'Instagram', label: '@gothictheatre', url: '#', icon: '◎' },
        { platform: 'Website', label: 'Upcoming Shows', url: '#', icon: '◇' },
      ],
    },
  ],
};

// ─── Past Winners by Year ───────────────────
export const PAST_WINNERS: Record<number, Winner[]> = {
  2025: [
    {
      name: 'Marcus Delray',
      award: 'Artist of the Year',
      categoryId: 'aoty',
      description: 'Defined Denver\'s soul scene with raw authenticity and a sold-out Ogden run that the city won\'t forget.',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2025,
    },
    {
      name: 'River Crane',
      award: 'Best Live Performance',
      categoryId: 'blp',
      description: 'Cervantes\' Valentine\'s show became the most talked-about night in Denver music — a 90-minute masterclass.',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2025,
    },
    {
      name: 'Lila Frost',
      award: 'Breakout Act',
      categoryId: 'ba',
      description: 'From open mics to headlining — Lila\'s dream-pop broke through in 2025 with unstoppable momentum.',
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2025,
    },
    {
      name: 'DJ Plateau',
      award: 'DJ of the Year',
      categoryId: 'djoty',
      description: 'RiNo\'s underground scene found its architect. DJ Plateau redefined the booth and built a movement.',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2025,
    },
    {
      name: 'The Ogden Theatre',
      award: 'Venue of the Year',
      categoryId: 'voty',
      description: 'Colfax\'s crown jewel. 2025 proved the Ogden is still Denver\'s cultural heartbeat — night after night.',
      image: 'https://images.unsplash.com/photo-1468817814611-b7edf94b5d60?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2025,
    },
  ],
  2024: [
    {
      name: 'Sofia Vega',
      award: 'Artist of the Year',
      categoryId: 'aoty',
      description: 'Aurora\'s rising voice. Sofia Vega fused Latin indie with Denver grit, earning a city-wide following.',
      image: 'https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2024,
    },
    {
      name: 'Echo Cartel',
      award: 'Best Live Performance',
      categoryId: 'blp',
      description: 'The Gothic Theatre show in November redefined what a Denver headline set could be. Legendary night.',
      image: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2024,
    },
    {
      name: 'Kai Solano',
      award: 'Breakout Act',
      categoryId: 'ba',
      description: 'Aurora-born, Denver-raised. Kai\'s hip-hop debut dropped like a signal flare — impossible to ignore.',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2024,
    },
    {
      name: 'Yara Sounds',
      award: 'DJ of the Year',
      categoryId: 'djoty',
      description: 'Afrobeats met Denver altitude when Yara Sounds took over every room she entered in 2024.',
      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2024,
    },
    {
      name: 'Globe Hall',
      award: 'Venue of the Year',
      categoryId: 'voty',
      description: 'Globeville\'s beloved Globe Hall became the city\'s indie heartbeat — intimate, loud, and unforgettable.',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2024,
    },
  ],
  2023: [
    {
      name: 'North Table Collective',
      award: 'Artist of the Year',
      categoryId: 'aoty',
      description: 'Golden\'s folk collective brought roots music back to Denver stages with conviction and harmony.',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2023,
    },
    {
      name: 'Neon Pueblo',
      award: 'Best Live Performance',
      categoryId: 'blp',
      description: 'Globe Hall, January. The walls shook. Neon Pueblo delivered the kind of show that becomes local legend.',
      image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2023,
    },
    {
      name: 'Desert Meridian',
      award: 'Breakout Act',
      categoryId: 'ba',
      description: 'Boulder psychedelic rock found its city voice in Denver. Desert Meridian emerged fully-formed in 2023.',
      image: 'https://images.unsplash.com/photo-1535712579925-55f0e53a5d1d?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2023,
    },
    {
      name: 'Blkout Cru',
      award: 'DJ of the Year',
      categoryId: 'djoty',
      description: 'Five Points collective. Blkout Cru made hip-hop history in Denver with a run that defined a summer.',
      image: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2023,
    },
    {
      name: 'Cervantes\' Masterpiece',
      award: 'Venue of the Year',
      categoryId: 'voty',
      description: 'Five Points institution. Cervantes\' earned its crown in 2023 — the most important room in Denver.',
      image: 'https://images.unsplash.com/photo-1425342605703-3af7aea2b6c8?w=600&h=600&fit=crop&q=80',
      link: '#',
      year: 2023,
    },
  ],
};

// ─── Sponsor tiers ($5000 gold and down) ───────────────────────────────────────
export const SPONSOR_TIERS = {
  gold: { min: 5000, label: 'Gold', color: '#D4AF37' },
  silver: { min: 2500, max: 4999, label: 'Silver', color: '#C0C0C0' },
  bronze: { min: 500, max: 2499, label: 'Bronze', color: '#CD7F32' },
} as const;

export type SponsorTier = keyof typeof SPONSOR_TIERS;

export function getSponsorTier(amount: number): SponsorTier {
  if (amount >= SPONSOR_TIERS.gold.min) return 'gold';
  if (amount >= SPONSOR_TIERS.silver.min && amount <= (SPONSOR_TIERS.silver.max ?? 999999)) return 'silver';
  return 'bronze';
}

export const SPONSOR_GOAL = 25000;

// ─── Dashboard Mock Stats ────────────────────
export const DASHBOARD_STATS = {
  totalVotes: 1247,
  categoriesActive: 5,
  categoriesComplete: 4,
  topCategory: 'Artist of the Year',
  topCategoryVotes: 398,
  votesLastHour: 23,
  avgCompletionRate: 78,
  sponsors: [
    { name: 'Mountain West Records', amount: 6000 },
    { name: 'Denver Arts Council', amount: 5000 },
    { name: 'Colfax Creative', amount: 3500 },
    { name: 'RiNo District', amount: 1500 },
    { name: 'Coors Brewing Co.', amount: 2500 },
    { name: 'Concierto', amount: 5000 },
    { name: "Stranahan's Whiskey", amount: 1200 },
    { name: 'Great Divide Brewing', amount: 800 },
  ],
  teamMembers: [
    { name: 'Jordan Reeves', role: 'Event Director' },
    { name: 'Priya Okafor', role: 'Operations Lead' },
    { name: 'Marcus Fields', role: 'Tech Coordinator' },
  ],
  categoryCompletion: [
    { name: 'Artist of the Year', pct: 89 },
    { name: 'Best Live Performance', pct: 82 },
    { name: 'Breakout Act', pct: 76 },
    { name: 'DJ of the Year', pct: 71 },
    { name: 'Venue of the Year', pct: 68 },
  ],
};

// ─── Mock Contacts (Excel Export) ───────────
export const MOCK_CONTACTS: ContactRow[] = [
  { 'First Name': 'Ariana', 'Last Name': 'Lewis', Email: 'ariana.l@example.com', Phone: '720-555-0182', City: 'Denver', 'Category Voted': 'Artist of the Year', 'Nominee Selected': 'Marcus Delray', Timestamp: '2026-02-22 14:03', 'Vote Source': 'Web' },
  { 'First Name': 'Marcus', 'Last Name': 'Chen', Email: 'mchen@example.com', Phone: '303-555-9931', City: 'Aurora', 'Category Voted': 'Best Live Performance', 'Nominee Selected': "River Crane · Cervantes'", Timestamp: '2026-02-22 14:05', 'Vote Source': 'QR' },
  { 'First Name': 'Sofia', 'Last Name': 'Martinez', Email: 'sofia.m@example.com', Phone: '970-555-1288', City: 'Lakewood', 'Category Voted': 'Breakout Act', 'Nominee Selected': 'Lila Frost', Timestamp: '2026-02-22 14:07', 'Vote Source': 'Web' },
  { 'First Name': 'Dylan', 'Last Name': 'Reed', Email: 'dylan.r@example.com', Phone: '720-555-1189', City: 'Denver', 'Category Voted': 'Venue of the Year', 'Nominee Selected': 'The Ogden Theatre', Timestamp: '2026-02-22 14:11', 'Vote Source': 'SMS' },
  { 'First Name': 'Imani', 'Last Name': 'Brooks', Email: 'ibrooks@example.com', Phone: '303-555-7712', City: 'Boulder', 'Category Voted': 'DJ of the Year', 'Nominee Selected': 'DJ Plateau', Timestamp: '2026-02-22 14:14', 'Vote Source': 'Web' },
  { 'First Name': 'Zoe', 'Last Name': 'Nakamura', Email: 'zoe.n@example.com', Phone: '720-555-3341', City: 'Denver', 'Category Voted': 'Artist of the Year', 'Nominee Selected': 'Sofia Vega', Timestamp: '2026-02-22 14:18', 'Vote Source': 'Web' },
  { 'First Name': 'Jordan', 'Last Name': 'Okafor', Email: 'jokafor@example.com', Phone: '303-555-4450', City: 'Englewood', 'Category Voted': 'Best Live Performance', 'Nominee Selected': 'Echo Cartel · Gothic Theatre', Timestamp: '2026-02-22 14:22', 'Vote Source': 'QR' },
  { 'First Name': 'Priya', 'Last Name': 'Shah', Email: 'priya.s@example.com', Phone: '720-555-8821', City: 'Arvada', 'Category Voted': 'Breakout Act', 'Nominee Selected': 'Kai Solano', Timestamp: '2026-02-22 14:25', 'Vote Source': 'Web' },
  { 'First Name': 'Tyler', 'Last Name': 'Washington', Email: 't.wash@example.com', Phone: '303-555-6693', City: 'Denver', 'Category Voted': 'Venue of the Year', 'Nominee Selected': 'Globe Hall', Timestamp: '2026-02-22 14:29', 'Vote Source': 'SMS' },
  { 'First Name': 'Camille', 'Last Name': 'Dupont', Email: 'cdupont@example.com', Phone: '720-555-0044', City: 'LoDo', 'Category Voted': 'DJ of the Year', 'Nominee Selected': 'Yara Sounds', Timestamp: '2026-02-22 14:33', 'Vote Source': 'Web' },
  { 'First Name': 'Andre', 'Last Name': 'Coleman', Email: 'a.coleman@example.com', Phone: '303-555-2277', City: 'Five Points', 'Category Voted': 'Artist of the Year', 'Nominee Selected': 'Amara Jones', Timestamp: '2026-02-22 14:38', 'Vote Source': 'QR' },
  { 'First Name': 'Luna', 'Last Name': 'Vasquez', Email: 'luna.v@example.com', Phone: '720-555-5501', City: 'Globeville', 'Category Voted': 'Best Live Performance', 'Nominee Selected': 'Neon Pueblo · Globe Hall', Timestamp: '2026-02-22 14:41', 'Vote Source': 'Web' },
  { 'First Name': 'Noah', 'Last Name': 'Kim', Email: 'nkim@example.com', Phone: '303-555-3388', City: 'Capitol Hill', 'Category Voted': 'Breakout Act', 'Nominee Selected': 'Desert Meridian', Timestamp: '2026-02-22 14:45', 'Vote Source': 'Web' },
  { 'First Name': 'Destiny', 'Last Name': 'Jackson', Email: 'd.jackson@example.com', Phone: '720-555-7714', City: 'Denver', 'Category Voted': 'DJ of the Year', 'Nominee Selected': 'Blkout Cru', Timestamp: '2026-02-22 14:49', 'Vote Source': 'SMS' },
  { 'First Name': 'Rafa', 'Last Name': 'Morales', Email: 'rmorales@example.com', Phone: '303-555-9920', City: 'RiNo', 'Category Voted': 'Venue of the Year', 'Nominee Selected': "Cervantes' Masterpiece", Timestamp: '2026-02-22 14:52', 'Vote Source': 'Web' },
  { 'First Name': 'Kezia', 'Last Name': 'Thompson', Email: 'kezia.t@example.com', Phone: '720-555-1163', City: 'Denver', 'Category Voted': 'Artist of the Year', 'Nominee Selected': 'North Table Collective', Timestamp: '2026-02-22 14:57', 'Vote Source': 'QR' },
  { 'First Name': 'Miles', 'Last Name': 'Patterson', Email: 'm.patt@example.com', Phone: '303-555-8836', City: 'Wheat Ridge', 'Category Voted': 'Best Live Performance', 'Nominee Selected': 'The Westwood Sessions', Timestamp: '2026-02-22 15:01', 'Vote Source': 'Web' },
  { 'First Name': 'Isla', 'Last Name': 'Rodriguez', Email: 'isla.r@example.com', Phone: '720-555-4492', City: 'Aurora', 'Category Voted': 'Breakout Act', 'Nominee Selected': 'Juno Vale', Timestamp: '2026-02-22 15:06', 'Vote Source': 'Web' },
  { 'First Name': 'Damon', 'Last Name': 'Pierce', Email: 'dpierce@example.com', Phone: '303-555-6617', City: 'Denver', 'Category Voted': 'DJ of the Year', 'Nominee Selected': 'DJ Meridian', Timestamp: '2026-02-22 15:09', 'Vote Source': 'SMS' },
  { 'First Name': 'Nia', 'Last Name': 'Foster', Email: 'nia.f@example.com', Phone: '720-555-3398', City: 'Lakewood', 'Category Voted': 'Venue of the Year', 'Nominee Selected': 'The Gothic Theatre', Timestamp: '2026-02-22 15:14', 'Vote Source': 'Web' },
];

// ─── Vote Storage Utils ──────────────────────
const VOTES_KEY = 'dnvr_spotlight_votes_2026';
const DASHBOARD_KEY = 'dnvr_dashboard_unlocked';

export const getVotes = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}'); }
  catch { return {}; }
};

export const castVote = (categoryId: string, nomineeId: string): void => {
  const votes = getVotes();
  votes[categoryId] = nomineeId;
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
};

export const getVoteProgress = (): { voted: number; total: number } => ({
  voted: Object.keys(getVotes()).length,
  total: CATEGORIES.length,
});

export const isDashboardUnlocked = (): boolean =>
  localStorage.getItem(DASHBOARD_KEY) === 'true';

export const unlockDashboard = (): void =>
  localStorage.setItem(DASHBOARD_KEY, 'true');
