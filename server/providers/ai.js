import {
  searchAniList,
  getTrendingAniList,
  getAniListInfo,
} from './anilist.js';
import axios from 'axios';

const ANILIST = 'https://graphql.anilist.co';

async function gql(query, variables = {}) {
  const { data } = await axios.post(ANILIST, { query, variables }, {
    timeout: 12000,
    headers: { 'Content-Type': 'application/json' },
  });
  if (data.errors) throw new Error(data.errors[0]?.message);
  return data.data;
}

export async function getSimilarTitles(id, limit = 8) {
  const data = await gql(
    `query($id: Int) {
      Media(id: $id) {
        title { english romaji }
        recommendations(perPage: ${limit}, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              title { english romaji }
              coverImage { large }
              averageScore
              genres
              type
            }
          }
        }
      }
    }`,
    { id: parseInt(id) }
  );

  return (data.Media?.recommendations?.nodes || [])
    .map((n) => n.mediaRecommendation)
    .filter(Boolean)
    .map((m) => ({
      id: String(m.id),
      title: m.title.english || m.title.romaji,
      image: m.coverImage?.large,
      source: 'anilist',
      sourceName: 'AniList',
      score: m.averageScore ? m.averageScore / 10 : null,
      genres: m.genres,
      mode: m.type === 'MANGA' ? 'manga' : 'anime',
    }));
}

export async function getAIRecommendations(watchHistory = [], mode = 'anime') {
  const genres = new Set();
  const titles = watchHistory.slice(0, 5).map((h) => h.title).filter(Boolean);

  for (const title of titles) {
    try {
      const results = await searchAniList(title, 1, mode === 'manga' ? 'MANGA' : 'ANIME');
      results[0]?.genres?.forEach((g) => genres.add(g));
    } catch {
      // skip
    }
  }

  const genreList = [...genres].slice(0, 3);
  if (!genreList.length) {
    return getTrendingAniList(12, mode === 'manga' ? 'MANGA' : 'ANIME');
  }

  const data = await gql(
    `query($genre: String, $type: MediaType) {
      Page(page: 1, perPage: 12) {
        media(genre: $genre, type: $type, sort: SCORE_DESC, status: RELEASING) {
          id
          title { english romaji }
          coverImage { large }
          averageScore
          genres
          description
        }
      }
    }`,
    { genre: genreList[0], type: mode === 'manga' ? 'MANGA' : 'ANIME' }
  );

  const watched = new Set(titles.map((t) => t.toLowerCase()));
  return data.Page.media
    .filter((m) => !watched.has((m.title.english || m.title.romaji || '').toLowerCase()))
    .map((m) => ({
      id: String(m.id),
      title: m.title.english || m.title.romaji,
      image: m.coverImage?.large,
      source: 'anilist',
      sourceName: 'AI Pick',
      score: m.averageScore ? m.averageScore / 10 : null,
      genres: m.genres,
      aiReason: `Because you like ${genreList.join(', ')}`,
    }));
}

export async function aiChat(message, context = {}) {
  const msg = message.toLowerCase().trim();
  const mode = context.mode || 'anime';

  if (/recommend|suggest|what should|pick|best/.test(msg)) {
    const picks = await getAIRecommendations(context.history || [], mode);
    return {
      type: 'recommendations',
      text: picks.length
        ? `Based on your taste, here are my top picks for you:`
        : `Here's what's trending right now:`,
      items: picks.slice(0, 8),
    };
  }

  if (/trending|popular|hot|new/.test(msg)) {
    const items = await getTrendingAniList(8, mode === 'manga' ? 'MANGA' : 'ANIME');
    return {
      type: 'recommendations',
      text: `Here's what's trending in ${mode} right now:`,
      items,
    };
  }

  if (/similar|like/.test(msg)) {
    const match = msg.match(/(?:similar to|like)\s+(.+)/i);
    const query = match?.[1] || context.lastTitle || 'Naruto';
    const results = await searchAniList(query, 1, mode === 'manga' ? 'MANGA' : 'ANIME');
    if (results[0]) {
      const similar = await getSimilarTitles(results[0].id);
      return {
        type: 'recommendations',
        text: `Titles similar to **${results[0].title}**:`,
        items: similar,
      };
    }
  }

  const searchMatch = msg.match(/(?:search|find|show|watch|read)\s+(.+)/i);
  const query = searchMatch?.[1] || message;
  const results = await searchAniList(
    query,
    8,
    mode === 'manga' ? 'MANGA' : mode === 'series' ? 'ANIME' : 'ANIME'
  );

  if (results.length) {
    return {
      type: 'recommendations',
      text: `Found ${results.length} results for "${query}":`,
      items: results,
    };
  }

  return {
    type: 'message',
    text: `I'm Nebula AI! I can help you:\n• "Recommend something" — personalized picks\n• "Trending anime" — what's hot\n• "Similar to Demon Slayer" — find alike titles\n• "Search One Piece" — find any title\n\nWhat would you like to watch or read?`,
    items: [],
  };
}

export async function getAISummary(title, mode = 'anime') {
  const results = await searchAniList(title, 1, mode === 'manga' ? 'MANGA' : 'ANIME');
  if (!results[0]) return { summary: 'No information found.' };

  const info = await getAniListInfo(results[0].id, mode === 'manga' ? 'MANGA' : 'ANIME');
  const desc = info.description || '';
  const short = desc.length > 300 ? desc.slice(0, 300) + '...' : desc;

  const genres = info.genres?.join(', ') || 'Unknown';
  const score = info.score ? `Rated ${info.score}/10` : '';
  const status = info.status || '';

  return {
    summary: `**${info.title}** ${score}\n\n${short}\n\nGenres: ${genres}\nStatus: ${status}`,
    title: info.title,
    score: info.score,
    genres: info.genres,
  };
}
