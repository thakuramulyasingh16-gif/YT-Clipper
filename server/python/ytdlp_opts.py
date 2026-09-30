"""
Shared yt-dlp helper for YT-Clipper.

1. Cookies: injects YouTube cookies so YouTube's "Sign in to confirm you're
   not a bot" check passes on cloud servers. Read from (first match wins):
     - Render Secret File  /etc/secrets/cookies.txt  (or path in YT_COOKIES_FILE)
     - Env var YT_COOKIES  (full Netscape cookies.txt content)

2. JavaScript runtime: YouTube needs a JS runtime (+ yt-dlp-ejs) to solve its
   challenges. We enable every runtime found on the machine (Deno preferred).

3. Player clients: with logged-in cookies the default 'tv_downgraded' client
   can fail with "The page needs to be reloaded", so we also allow
   'web_embedded'. Override with env var YT_PLAYER_CLIENTS="default,web_embedded".
"""
import os
import shutil
import subprocess

_TARGET = os.path.join('/tmp', 'yt_cookies.txt')
_STATUS = 'cookies not checked yet'
_AUTH_NAMES = ('SID', '__Secure-1PSID', '__Secure-3PSID', 'LOGIN_INFO', 'SAPISID')


def _env_status() -> str:
    """Short description of yt-dlp / ejs / JS runtimes (shown in error messages)."""
    parts = []
    try:
        import yt_dlp
        parts.append('yt-dlp ' + yt_dlp.version.__version__)
    except Exception as e:
        parts.append(f'yt-dlp import failed ({e})')
    try:
        from importlib.metadata import version
        parts.append('ejs ' + version('yt-dlp-ejs'))
    except Exception:
        parts.append('ejs MISSING')
    for rt in ('deno', 'node'):
        path = shutil.which(rt)
        if not path:
            parts.append(f'{rt} none')
            continue
        try:
            out = subprocess.run([path, '--version'], capture_output=True,
                                 text=True, timeout=5).stdout.strip().splitlines()
            parts.append(f'{rt} {out[0] if out else "?"}')
        except Exception:
            parts.append(f'{rt} ?')
    return '; '.join(parts)


def cookie_status() -> str:
    return f'{_STATUS} || [env] {_env_status()}'


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
    """Adds cookies + JS runtimes + player-client settings to yt-dlp options."""
    cf = get_cookie_file()
    if cf:
        opts['cookiefile'] = cf

    # Enable every JS runtime that exists on this machine (Deno first)
    runtimes = {rt: {} for rt in ('deno', 'node') if shutil.which(rt)}
    if runtimes:
        opts.setdefault('js_runtimes', runtimes)

    # Player clients (works around tv_downgraded "page needs to be reloaded")
    clients = os.environ.get('YT_PLAYER_CLIENTS', 'default,web_embedded')
    clients = [c.strip() for c in clients.split(',') if c.strip()]
    if clients:
        yt_args = opts.setdefault('extractor_args', {}).setdefault('youtube', {})
        yt_args.setdefault('player_client', clients)
    return opts
