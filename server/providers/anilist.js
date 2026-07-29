import { axiosRetry } from './http.js';
import { anilistLimiter } from './ratelimit.js';
import { cached, cacheKey } from './cache.js';

const ANILIST = 'https://graphql.anilist.co';

async function gql(query, variables = {}) {
  const key = cacheKey('gql', query.slice(0, 40), JSON.stringify(variables));
  return cached(key, 90000, () =>
    anilistLimiter.schedule(async () => {
      const { data } = await axiosRetry(
        {
          method: 'post',
          url: ANILIST,
          data: { query, variables },
          headers: { 'Content-Type': 'application/json' },
        },
        { retries: 2, timeout: 10000, baseDelayMs: 1500 }
      );
      if (data.errors) throw new Error(data.errors[0]?.message || 'AniList error');
      return data.data;
    })
  );
}

export async function searchAniList(query, limit = 20, type = 'ANIME') {
  const data = await gql(
    `query($search: String, $perPage: Int, $type: MediaType) {
      Page(page: 1, perPage: $perPage) {
        media(search: $search, type: $type, sort: SEARCH_MATCH) {
          id
          title { romaji english native }
          coverImage { large extraLarge }
          description
          status
          episodes
          averageScore
          genres
          format
          siteUrl
        }
      }
    }`,
    { search: query, perPage: limit, type }
  );

  return data.Page.media.map((m) => ({
    id: String(m.id),
    title: m.title.english || m.title.romaji || m.title.native,
    image: m.coverImage?.extraLarge || m.coverImage?.large,
    source: 'anilist',
    sourceName: 'AniList',
    description: m.description?.replace(/<[^>]*>/g, '') || '',
    score: m.averageScore ? m.averageScore / 10 : null,
    episodes: m.episodes,
    status: m.status,
    genres: m.genres || [],
    type: 'metadata',
    siteUrl: m.siteUrl,
  }));
}

export async function getTrendingAniList(limit = 20, type = 'ANIME') {
  return cached(cacheKey('trending', type, limit), 120000, async () => {
    const data = await gql(
      `query($perPage: Int, $type: MediaType) {
        Page(page: 1, perPage: $perPage) {
          media(sort: TRENDING_DESC, type: $type) {
            id
            title { romaji english native }
            coverImage { large extraLarge }
            averageScore
            episodes
          }
        }
      }`,
      { perPage: limit, type }
    );

    return data.Page.media.map((m) => ({
      id: String(m.id),
      title: m.title.english || m.title.romaji || m.title.native,
      image: m.coverImage?.extraLarge || m.coverImage?.large,
      source: 'anilist',
      sourceName: 'AniList',
      score: m.averageScore ? m.averageScore / 10 : null,
      episodes: m.episodes,
    }));
  });
}

export async function getAniListInfo(id, type = 'ANIME') {
  return cached(cacheKey('info', type, id), 180000, async () => {
    const data = await gql(
      `query($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          id
          title { romaji english native }
          coverImage { large extraLarge }
          bannerImage
          description
          status
          episodes
          averageScore
          genres
          format
          siteUrl
          streamingEpisodes { title url thumbnail site }
          externalLinks { site url type }
        }
      }`,
      { id: parseInt(id), type }
    );

    const m = data.Media;
    const streams = m.streamingEpisodes || [];
    const links = m.externalLinks?.filter((l) => l.type === 'STREAMING') || [];

    return {
      id: String(m.id),
      title: m.title.english || m.title.romaji || m.title.native,
      image: m.coverImage?.extraLarge || m.coverImage?.large,
      banner: m.bannerImage,
      source: 'anilist',
      sourceName: 'AniList',
      description: m.description?.replace(/<[^>]*>/g, '') || '',
      score: m.averageScore ? m.averageScore / 10 : null,
      episodes: streams.length
        ? streams.map((ep, i) => ({
            id: String(i + 1),
            number: i + 1,
            title: ep.title || `Episode ${i + 1}`,
            url: ep.url,
            thumbnail: ep.thumbnail,
            site: ep.site,
          }))
        : Array.from({ length: m.episodes || 0 }, (_, i) => ({
            id: String(i + 1),
            number: i + 1,
            title: `Episode ${i + 1}`,
          })),
      status: m.status,
      genres: m.genres || [],
      streamable: streams.length > 0,
      streamingLinks: links,
      siteUrl: m.siteUrl,
    };
  });
}

export { gql };
