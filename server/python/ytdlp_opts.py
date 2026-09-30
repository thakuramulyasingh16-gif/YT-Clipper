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


def get_cookie_file():
    path = os.environ.get('YT_COOKIES_FILE') or '/etc/secrets/cookies.txt'
    try:
        if os.path.isfile(path):
            # copy to a writable location (yt-dlp may try to update the file)
            shutil.copyfile(path, _TARGET)
            return _TARGET
        text = os.environ.get('YT_COOKIES', '').strip()
        if text:
            if '\n' not in text and '\\n' in text:
                text = text.replace('\\n', '\n')
            with open(_TARGET, 'w', encoding='utf-8') as f:
                f.write(text + '\n')
            return _TARGET
    except Exception as e:
        print(f'[cookies] could not prepare cookie file: {e}')
    return None


def apply_cookies(opts: dict) -> dict:
    cf = get_cookie_file()
    if cf:
        opts['cookiefile'] = cf
    return opts
