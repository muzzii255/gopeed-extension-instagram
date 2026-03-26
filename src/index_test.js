import * as parser from './parser/parse.js';

const url = 'https://www.instagram.com/reels/C3E3pmkOjjh/';
const settings = {
  proxyType: 'none',
  proxyHost: '',
  proxyPort: '',
  proxyUsername: '',
  proxyPassword: '',
};

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
        url: bestVideo.url,
      });
    }
  }
  
}

console.log(files);
