# gopeed-extension-instagram

a gopeed extension for downloading instagram reels.

## supported urls

this extension only works with `/reels/` endpoints:

```
https://www.instagram.com/reels/ABC123xyz/
https://www.instagram.com/reels/ABC123xyz/
https://instagram.com/reel/ABC123xyz/
https://instagram.com/reel/ABC123xyz/
```

other endpoints like `/p/` (posts) or `/tv/` (igtv) are not supported yet, stupid instagram failing on my browser.

## installation

1. download the latest release or build from source
2. open gopeed settings > extensions
3. install from local file or drag and drop the extension

### building from source

```bash
npm install
npm run build
```

the built extension will be in `dist/index.js`.

## proxy configuration

if you're getting `403 forbidden` errors, instagram is likely rate limiting or blocking your ip. configure a proxy in the extension settings:

| setting        | description                         |
| -------------- | ----------------------------------- |
| proxy type     | `none`, `http`, or `socks5`         |
| proxy host     | server hostname or ip               |
| proxy port     | server port number                  |
| proxy username | auth username (optional if ip auth) |
| proxy password | auth password (optional if ip auth) |

### dealing with 403 errors

instagram aggressively rate limits and blocks ips. if you're getting 403s:

1. use rotating residential proxies
2. avoid downloading too many reels in quick succession
3. try a different proxy provider if the issue persists

the extension doesn't handle proxy rotation automatically - you'll need to update the proxy settings manually or use a proxy service that rotates ips on their end.

## feature requests

want support for posts, stories, or other features? open an issue at [github.com/muzzii255/gopeed-extension-instagram/issues](https://github.com/muzzii255/gopeed-extension-instagram/issues).
