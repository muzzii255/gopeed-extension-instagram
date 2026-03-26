const INSTAGRAM_HEADERS = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.8',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  priority: 'u=0, i',
  'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Brave";v="146"',
  'sec-ch-ua-full-version-list': '"Chromium";v="146.0.0.0", "Not-A.Brand";v="24.0.0.0", "Brave";v="146.0.0.0"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-model': '"iPhone"',
  'sec-ch-ua-platform': '"iOS"',
  'sec-ch-ua-platform-version': '"18.5"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'sec-gpc': '1',
  'upgrade-insecure-requests': '1',
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  'x-ig-app-id': '936619743392459',
  'x-requested-with': 'XMLHttpRequest',
  'x-asbd-id': '129477',
  referer: 'https://www.instagram.com/',
  origin: 'https://www.instagram.com',
};

export function buildProxyUrl(settings) {
  const { proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword } = settings;

  if (!proxyType || proxyType === 'none' || !proxyHost || !proxyPort) {
    return null;
  }

  const scheme = proxyType === 'socks5' ? 'socks5' : 'http';
  let proxyUrl = `${scheme}://`;

  if (proxyUsername && proxyPassword) {
    proxyUrl += `${encodeURIComponent(proxyUsername)}:${encodeURIComponent(proxyPassword)}@`;
  }

  proxyUrl += `${proxyHost}:${proxyPort}`;
  return proxyUrl;
}

export function getFetchOptions(settings) {
  const options = {
    headers: INSTAGRAM_HEADERS,
  };

  const proxyUrl = buildProxyUrl(settings);
  if (proxyUrl) {
    options.proxy = proxyUrl;
  }

  return options;
}

export async function fetchPostData(url, settings) {
  const fetchOptions = getFetchOptions(settings);
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const html = await response.text();

  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptContent = null;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('ScheduledServerJS') && content.includes('RelayPrefetchedStreamCache')) {
      scriptContent = content;
      break;
    }
  }

  if (!scriptContent) {
    throw new Error(
      'Could not find ScheduledServerJS script. The page structure may have changed or login is required.'
    );
  }

  const jsonStart = scriptContent.indexOf('{');
  const jsonEnd = scriptContent.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not find JSON in script content');
  }

  const jsonStr = scriptContent.substring(jsonStart, jsonEnd + 1);
  const data = JSON.parse(jsonStr);

  const mediaItems = [];
  const searchForMedia = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    if (obj.video_versions && Array.isArray(obj.video_versions)) {
      const item = {
        id: obj.pk || obj.id || '',
        code: obj.code || '',
        username: obj.user?.username || '',
        videos: obj.video_versions.map((v) => ({
          url: v.url,
          width: v.width,
          height: v.height,
          type: v.type,
        })),
        images: [],
        caption: obj.caption?.text || '',
      };

      if (obj.image_versions2?.candidates) {
        item.images = obj.image_versions2.candidates.map((c) => ({
          url: c.url,
          width: c.width,
          height: c.height,
        }));
      }

      mediaItems.push(item);
      return;
    }

    if (obj.image_versions2?.candidates && !obj.video_versions) {
      mediaItems.push({
        id: obj.pk || obj.id || '',
        code: obj.code || '',
        username: obj.user?.username || '',
        videos: [],
        images: obj.image_versions2.candidates.map((c) => ({
          url: c.url,
          width: c.width,
          height: c.height,
        })),
        caption: obj.caption?.text || '',
      });
      return;
    }

    if (obj.carousel_media && Array.isArray(obj.carousel_media)) {
      for (const item of obj.carousel_media) {
        searchForMedia(item);
      }
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        searchForMedia(item);
      }
    } else {
      for (const key of Object.keys(obj)) {
        searchForMedia(obj[key]);
      }
    }
  };

  searchForMedia(data);

  if (mediaItems.length === 0) {
    throw new Error('No media found in response');
  }

  return mediaItems;
}

export function extractShortcode(url) {
  const patterns = [
    /instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function getBestVideo(videos) {
  if (!videos || videos.length === 0) return null;
  return videos.reduce((best, current) => {
    const bestPixels = (best.width || 0) * (best.height || 0);
    const currentPixels = (current.width || 0) * (current.height || 0);
    return currentPixels > bestPixels ? current : best;
  });
}

export function getBestImage(images) {
  if (!images || images.length === 0) return null;
  return images.reduce((best, current) => {
    const bestPixels = (best.width || 0) * (best.height || 0);
    const currentPixels = (current.width || 0) * (current.height || 0);
    return currentPixels > bestPixels ? current : best;
  });
}
