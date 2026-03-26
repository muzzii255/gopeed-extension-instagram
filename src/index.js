import * as parser from './parser/parse.js';

gopeed.events.onResolve(async (ctx) => {
  const url = ctx.req.url;
  const settings = gopeed.settings;

  const shortcode = parser.extractShortcode(url);
  if (!shortcode) {
    throw new Error('Invalid Instagram URL. Could not extract shortcode.');
  }

  const mediaItems = await parser.fetchPostData(url, settings);
  const files = [];

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i];
    const username = item.username || 'instagram';
    const suffix = mediaItems.length > 1 ? `_${i + 1}` : '';

    if (item.videos && item.videos.length > 0) {
      const bestVideo = parser.getBestVideo(item.videos);
      if (bestVideo) {
        files.push({
          name: `${username}_${shortcode}${suffix}.mp4`,
          req: {
            url: bestVideo.url,
          },
        });
      }
    }
  }

  if (files.length === 0) {
    throw new Error('No downloadable media found');
  }

  ctx.res = {
    name: `instagram_${shortcode}`,
    files: files,
  };
});
