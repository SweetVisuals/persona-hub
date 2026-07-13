// Editor mock data — will be replaced with Supabase queries later

export const MOCK_FILE_TREE = [
  {
    id: 'folder-1',
    name: 'Project Assets',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: 'folder-1-1',
        name: 'Videos',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'file-1', name: 'hero-intro.mp4', type: 'video', size: '24.5 MB', duration: '0:32' },
          { id: 'file-2', name: 'product-demo.mp4', type: 'video', size: '18.2 MB', duration: '1:15' },
          { id: 'file-3', name: 'testimonial-raw.mov', type: 'video', size: '156 MB', duration: '3:42' },
        ]
      },
      {
        id: 'folder-1-2',
        name: 'Audio',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'file-4', name: 'voiceover-final.mp3', type: 'audio', size: '4.2 MB', duration: '1:30' },
          { id: 'file-5', name: 'background-music.wav', type: 'audio', size: '12.8 MB', duration: '3:00' },
          { id: 'file-6', name: 'podcast-episode.mp3', type: 'audio', size: '45.6 MB', duration: '22:15' },
        ]
      },
      {
        id: 'folder-1-3',
        name: 'Images',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'file-7', name: 'thumbnail-v2.png', type: 'image', size: '2.1 MB' },
          { id: 'file-8', name: 'logo-white.svg', type: 'image', size: '12 KB' },
          { id: 'file-9', name: 'background-gradient.jpg', type: 'image', size: '890 KB' },
        ]
      },
      {
        id: 'folder-1-4',
        name: 'Graphics',
        type: 'folder',
        expanded: false,
        children: [
          { id: 'file-10', name: 'lower-third.png', type: 'image', size: '340 KB' },
          { id: 'file-11', name: 'end-card.psd', type: 'other', size: '8.5 MB' },
        ]
      }
    ]
  },
  {
    id: 'folder-2',
    name: 'Exports',
    type: 'folder',
    expanded: false,
    children: [
      { id: 'file-12', name: 'reel-final-v3.mp4', type: 'video', size: '8.9 MB', duration: '0:30' },
    ]
  },
  { id: 'file-13', name: 'script-notes.txt', type: 'text', size: '2.4 KB' },
  { id: 'file-14', name: 'storyboard.pdf', type: 'other', size: '1.2 MB' },
];

export const MOCK_TEMPLATES = [
  { id: 't1', name: 'Minimal Story', category: 'Stories', thumbnail: null, aspectRatio: '9:16', description: 'Clean, text-focused story layout' },
  { id: 't2', name: 'Product Showcase', category: 'Reels', thumbnail: null, aspectRatio: '9:16', description: 'Dynamic product reveal with zoom transitions' },
  { id: 't3', name: 'Carousel Slides', category: 'Carousels', thumbnail: null, aspectRatio: '1:1', description: 'Multi-slide carousel with swipe animations' },
  { id: 't4', name: 'Talking Head', category: 'Reels', thumbnail: null, aspectRatio: '9:16', description: 'Speaker-focused with caption overlay' },
  { id: 't5', name: 'Quote Card', category: 'Posts', thumbnail: null, aspectRatio: '1:1', description: 'Bold typography quote with gradient background' },
  { id: 't6', name: 'Before / After', category: 'Reels', thumbnail: null, aspectRatio: '9:16', description: 'Split-screen comparison with wipe transition' },
  { id: 't7', name: 'Ad Banner', category: 'Ads', thumbnail: null, aspectRatio: '16:9', description: 'Horizontal ad banner with CTA button' },
  { id: 't8', name: 'Podcast Clip', category: 'Reels', thumbnail: null, aspectRatio: '9:16', description: 'Audio waveform with caption overlay' },
  { id: 't9', name: 'Photo Grid', category: 'Posts', thumbnail: null, aspectRatio: '1:1', description: '4-panel photo collage layout' },
  { id: 't10', name: 'Countdown', category: 'Stories', thumbnail: null, aspectRatio: '9:16', description: 'Animated countdown timer story' },
];

export const TEMPLATE_CATEGORIES = ['All', 'Reels', 'Stories', 'Carousels', 'Posts', 'Ads'];

export const MOCK_TIMELINE_TRACKS = [
  {
    id: 'track-1',
    name: 'Video 1',
    type: 'video',
    color: '#6366f1',
    visible: true,
    locked: false,
    clips: [
      { id: 'clip-1', name: 'hero-intro.mp4', start: 0, duration: 32, color: '#6366f1' },
      { id: 'clip-2', name: 'product-demo.mp4', start: 35, duration: 75, color: '#818cf8' },
    ]
  },
  {
    id: 'track-2',
    name: 'Video 2',
    type: 'video',
    color: '#8b5cf6',
    visible: true,
    locked: false,
    clips: [
      { id: 'clip-3', name: 'testimonial-raw.mov', start: 10, duration: 45, color: '#8b5cf6' },
    ]
  },
  {
    id: 'track-3',
    name: 'Audio 1',
    type: 'audio',
    color: '#22c55e',
    visible: true,
    locked: false,
    clips: [
      { id: 'clip-4', name: 'voiceover-final.mp3', start: 0, duration: 90, color: '#22c55e' },
    ]
  },
  {
    id: 'track-4',
    name: 'Music',
    type: 'audio',
    color: '#14b8a6',
    visible: true,
    locked: true,
    clips: [
      { id: 'clip-5', name: 'background-music.wav', start: 0, duration: 120, color: '#14b8a6' },
    ]
  },
  {
    id: 'track-5',
    name: 'Text',
    type: 'text',
    color: '#f59e0b',
    visible: true,
    locked: false,
    clips: [
      { id: 'clip-6', name: 'Title Card', start: 0, duration: 5, color: '#f59e0b' },
      { id: 'clip-7', name: 'Subtitle', start: 32, duration: 8, color: '#eab308' },
      { id: 'clip-8', name: 'CTA Text', start: 100, duration: 10, color: '#fbbf24' },
    ]
  },
  {
    id: 'track-6',
    name: 'Graphics',
    type: 'graphics',
    color: '#ec4899',
    visible: true,
    locked: false,
    clips: [
      { id: 'clip-9', name: 'Lower Third', start: 5, duration: 25, color: '#ec4899' },
      { id: 'clip-10', name: 'End Card', start: 105, duration: 15, color: '#f472b6' },
    ]
  },
];

export const STYLE_PRESETS = [
  { id: 's1', name: 'Midnight', colors: ['#0f0f0f', '#1a1a2e', '#6366f1', '#ffffff'], font: 'Inter' },
  { id: 's2', name: 'Sunset', colors: ['#1a0a0a', '#2d1b1b', '#f97316', '#fef3c7'], font: 'Space Grotesk' },
  { id: 's3', name: 'Ocean', colors: ['#0a1a1a', '#0d2d3d', '#06b6d4', '#ecfeff'], font: 'Inter' },
  { id: 's4', name: 'Forest', colors: ['#0a1a0f', '#1a2e1a', '#22c55e', '#f0fdf4'], font: 'Space Grotesk' },
  { id: 's5', name: 'Monochrome', colors: ['#000000', '#191919', '#ffffff', '#a1a1aa'], font: 'Inter' },
  { id: 's6', name: 'Neon', colors: ['#0a0a0f', '#1a1a2e', '#e879f9', '#22d3ee'], font: 'Space Grotesk' },
];
