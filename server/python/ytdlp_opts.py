"""
Shared yt-dlp helper: injects YouTube cookies so YouTube's
"Sign in to confirm you're not a bot" check passes on cloud servers.

Cookies are read from (first match wins):
  1. Render Secret File  /etc/secrets/cookies.txt   (or path in YT_COOKIES_FILE)
  2. Env var YT_COOKIES  (full Netscape cookies.txt content)
"""
import os
import shutil

_TARGET = os.path.join('/tmp', 'yt_cookies.txt')
_STATUS = 'cookies not checked yet'
_AUTH_NAMES = ('SID', '__Secure-1PSID', '__Secure-3PSID', 'LOGIN_INFO', 'SAPISID')


def cookie_status() -> str:
    return _STATUS


def _describe(path: str) -> str:
    try:
        total, found = 0, set()
        with open(path, encoding='utf-8', errors='ignore') as f:
            for line in f:
                parts = line.rstrip('\n').split('\t')
                if len(parts) >= 7:
                    total += 1
                    if parts[5] in _AUTH_NAMES:
                        found.add(parts[5])
        missing = [n for n in _AUTH_NAMES if n not in found]
        return f'loaded {total} cookies; login cookies present={sorted(found)}; missing={missing}'
    except Exception as e:
        return f'could not read cookie file: {e}'


def get_cookie_file():
    global _STATUS
    path = os.environ.get('YT_COOKIES_FILE') or '/etc/secrets/cookies.txt'
    try:
        if os.path.isfile(path):
            shutil.copyfile(path, _TARGET)
            _STATUS = f'secret file {path} FOUND -> ' + _describe(_TARGET)
            return _TARGET
        text = os.environ.get('YT_COOKIES', '').strip()
        if text:
            if '\n' not in text and '\\n' in text:
                text = text.replace('\\n', '\n')
            with open(_TARGET, 'w', encoding='utf-8') as f:
                f.write(text + '\n')
            _STATUS = 'YT_COOKIES env var FOUND -> ' + _describe(_TARGET)
            return _TARGET
        _STATUS = f'NO cookies: {path} does not exist and YT_COOKIES is empty'
    except Exception as e:
        _STATUS = f'cookie setup error: {e}'
    print(f'[cookies] {_STATUS}', flush=True)
    return None


def apply_cookies(opts: dict) -> dict:
    """Adds cookies + JS runtime + player-client settings to yt-dlp options."""
    cf = get_cookie_file()
    if cf:
        opts['cookiefile'] = cf

    # JS runtime for YouTube challenge solving (Node exists in the image)
    if shutil.which('node'):
        opts.setdefault('js_runtimes', {'node': {}})

    # Player clients (works around tv_downgraded "page needs to be reloaded")
    clients = os.environ.get('YT_PLAYER_CLIENTS', 'default,web_embedded')
    clients = [c.strip() for c in clients.split(',') if c.strip()]
    if clients:
        yt_args = opts.setdefault('extractor_args', {}).setdefault('youtube', {})
        yt_args.setdefault('player_client', clients)
    return opts
