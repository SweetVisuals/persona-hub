export const personas = [
  {
    id: 1,
    name: "John Carter",
    handle: "@johncarter",
    avatar: "JC",
    color: "#6366f1",
    status: "active",
    niche: "UK Drill & Urban",
    postsToday: 4,
    totalPosts: 312,
    totalReach: 48200,
    accounts: [
      { platform: "tiktok", username: "@john.carter.uk", followers: 1240, status: "active" },
      { platform: "instagram", username: "@johncarter_uk", followers: 890, status: "active" },
      { platform: "youtube", username: "JohnCarterUK", followers: 340, status: "active" },
      { platform: "snapchat", username: "johncarter_snp", followers: 210, status: "paused" },
    ],
    queue: 6,
    lastPost: "2 hours ago",
  },
  {
    id: 2,
    name: "Mary Osei",
    handle: "@maryosei",
    avatar: "MO",
    color: "#ec4899",
    status: "active",
    niche: "Afrobeats & Lifestyle",
    postsToday: 3,
    totalPosts: 218,
    totalReach: 31500,
    accounts: [
      { platform: "tiktok", username: "@mary.osei", followers: 2100, status: "active" },
      { platform: "instagram", username: "@maryosei_", followers: 1450, status: "active" },
      { platform: "youtube", username: "MaryOsei", followers: 180, status: "paused" },
      { platform: "snapchat", username: "maryosei_snp", followers: 95, status: "active" },
    ],
    queue: 3,
    lastPost: "5 hours ago",
  },
  {
    id: 3,
    name: "Susan Blake",
    handle: "@susanblake",
    avatar: "SB",
    color: "#10b981",
    status: "paused",
    niche: "R&B & Soul",
    postsToday: 0,
    totalPosts: 94,
    totalReach: 12800,
    accounts: [
      { platform: "tiktok", username: "@susan.blake_", followers: 540, status: "paused" },
      { platform: "instagram", username: "@susanblake__", followers: 320, status: "paused" },
      { platform: "youtube", username: "SusanBlakeMusic", followers: 90, status: "paused" },
      { platform: "snapchat", username: "susanblake_snp", followers: 44, status: "paused" },
    ],
    queue: 0,
    lastPost: "3 days ago",
  },
];

export const recentActivity = [
  { id: 1, persona: "John Carter", color: "#6366f1", platform: "tiktok", action: "Posted", content: "Music video clip — verse 1", time: "2h ago", reach: 1240 },
  { id: 2, persona: "Mary Osei", color: "#ec4899", platform: "instagram", action: "Posted", content: "Pinterest image carousel", time: "5h ago", reach: 890 },
  { id: 3, persona: "John Carter", color: "#6366f1", platform: "youtube", action: "Posted", content: "Lyric video short", time: "8h ago", reach: 340 },
  { id: 4, persona: "Mary Osei", color: "#ec4899", platform: "tiktok", action: "Posted", content: "Behind the scenes clip", time: "12h ago", reach: 2100 },
  { id: 5, persona: "John Carter", color: "#6366f1", platform: "instagram", action: "Posted", content: "Studio photo slide", time: "14h ago", reach: 780 },
];

export const stats = {
  totalPersonas: 3,
  activePersonas: 2,
  totalAccounts: 12,
  activeAccounts: 9,
  postsToday: 7,
  totalReach: 92500,
  queuedPosts: 9,
};

export const platformColors = {
  tiktok: "#010101",
  instagram: "#E1306C",
  youtube: "#FF0000",
  snapchat: "#FFFC00",
  twitter: "#000000",
  pinterest: "#E60023",
};

export const platformIcons = {
  tiktok: "TK",
  instagram: "IG",
  youtube: "YT",
  snapchat: "SC",
  twitter: "X",
  pinterest: "PN",
};

export const queueData = [
  { id: 1, personaId: 1, platform: 'tiktok', content: 'Music video — chorus section', type: 'Video', scheduled: '12', time: '6:00 PM', status: 'scheduled' },
  { id: 2, personaId: 1, platform: 'instagram', content: 'Studio photo slide', type: 'Image', scheduled: '12', time: '7:30 PM', status: 'scheduled' },
  { id: 3, personaId: 2, platform: 'tiktok', content: 'Scraped Pinterest image set', type: 'Image', scheduled: '12', time: '8:00 PM', status: 'scheduled' },
  { id: 4, personaId: 1, platform: 'youtube', content: 'Lyric video short — verse 2', type: 'Video', scheduled: '13', time: '9:00 AM', status: 'scheduled' },
  { id: 5, personaId: 2, platform: 'instagram', content: 'Behind the scenes reel', type: 'Video', scheduled: '13', time: '11:00 AM', status: 'scheduled' },
  { id: 6, personaId: 2, platform: 'snapchat', content: 'Story image carousel', type: 'Image', scheduled: '13', time: '2:00 PM', status: 'scheduled' },
  { id: 7, personaId: 1, platform: 'tiktok', content: 'Music drop clip', type: 'Video', scheduled: '14', time: '5:00 PM', status: 'draft' },
  { id: 8, personaId: 2, platform: 'youtube', content: 'Fan repurpose short', type: 'Video', scheduled: '15', time: '10:00 AM', status: 'draft' },
  { id: 9, personaId: 1, platform: 'instagram', content: 'Aesthetic photo scrape', type: 'Image', scheduled: '16', time: '3:00 PM', status: 'draft' },
  { id: 10, personaId: 1, platform: 'tiktok', content: 'Trending audio lip sync', type: 'Video', scheduled: '18', time: '4:00 PM', status: 'scheduled' },
  { id: 11, personaId: 2, platform: 'instagram', content: 'Outfit of the day', type: 'Image', scheduled: '21', time: '1:00 PM', status: 'scheduled' },
];

