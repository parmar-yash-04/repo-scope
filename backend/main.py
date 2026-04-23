import base64
import json
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import (
    get_allowed_origins,
    get_backend_user_agent,
    get_frontend_url,
    get_github_api_base_url,
    get_github_oauth_client_id,
    get_github_oauth_client_secret,
    get_github_oauth_redirect_uri,
    get_github_token,
    get_cache_key_prefix,
    get_cache_ttl_seconds,
    get_http_timeout_seconds,
    get_redis_url,
)

LANG_COLORS = {
    "TypeScript": "#3178c6",
    "JavaScript": "#f1e05a",
    "Python": "#3572A5",
    "Rust": "#dea584",
    "Go": "#00ADD8",
    "CSS": "#563d7c",
    "HTML": "#e34c26",
    "Shell": "#89e051",
    "Java": "#b07219",
    "Ruby": "#701516",
    "C": "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    "Kotlin": "#A97BFF",
    "Swift": "#F05138",
    "PHP": "#4F5D95",
}

app = FastAPI(title="RepoScope Backend", version="0.1.0")

origins = get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else "*",
    allow_credentials=True if origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client: redis.Redis | None = None


@app.on_event("startup")
async def startup_event() -> None:
    global redis_client
    redis_url = get_redis_url()
    if not redis_url:
        redis_client = None
        return

    try:
        client = redis.from_url(redis_url, decode_responses=True)
        await client.ping()
        redis_client = client
    except Exception:
        redis_client = None


@app.on_event("shutdown")
async def shutdown_event() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None


def _cache_key(*parts: str) -> str:
    prefix = get_cache_key_prefix()
    cleaned = [p.replace(" ", "_") for p in parts]
    return f"{prefix}:{':'.join(cleaned)}"


async def _cache_get_json(key: str):
    if redis_client is None:
        return None
    try:
        raw = await redis_client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def _cache_set_json(key: str, value) -> None:
    if redis_client is None:
        return
    try:
        await redis_client.setex(key, get_cache_ttl_seconds(), json.dumps(value))
    except Exception:
        return


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/auth/github/login")
async def github_login() -> RedirectResponse:
    client_id = get_github_oauth_client_id()
    redirect_uri = get_github_oauth_redirect_uri()
    if not client_id:
        raise HTTPException(status_code=500, detail="Missing GITHUB_OAUTH_CLIENT_ID in backend .env")

    state = secrets.token_urlsafe(24)
    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
    )
    auth_url = f"https://github.com/login/oauth/authorize?{query}"

    response = RedirectResponse(url=auth_url, status_code=302)
    response.set_cookie(
        key="gh_oauth_state",
        value=state,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=600,
        path="/",
    )
    return response


@app.get("/api/auth/github/callback")
async def github_callback(code: str, state: str, request: Request) -> RedirectResponse:
    expected_state = request.cookies.get("gh_oauth_state")
    if not expected_state or state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    client_id = get_github_oauth_client_id()
    client_secret = get_github_oauth_client_secret()
    redirect_uri = get_github_oauth_redirect_uri()
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Missing GitHub OAuth credentials in backend .env")

    timeout = httpx.Timeout(get_http_timeout_seconds())
    async with httpx.AsyncClient(timeout=timeout) as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
                "state": state,
            },
        )
        if token_resp.status_code >= 400:
            raise HTTPException(status_code=token_resp.status_code, detail="Failed to exchange OAuth code")

        token_json = token_resp.json()
        access_token = token_json.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub OAuth token not returned")

        gh_headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {access_token}",
            "User-Agent": get_backend_user_agent(),
        }

        user_resp = await client.get(f"{get_github_api_base_url()}/user", headers=gh_headers)
        if user_resp.status_code >= 400:
            raise HTTPException(status_code=user_resp.status_code, detail="Failed to fetch GitHub profile")
        user = user_resp.json()

        emails_resp = await client.get(f"{get_github_api_base_url()}/user/emails", headers=gh_headers)
        email = ""
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            if isinstance(emails, list):
                primary = next((e for e in emails if e.get("primary")), None)
                verified = next((e for e in emails if e.get("verified")), None)
                picked = primary or verified or (emails[0] if emails else None)
                email = str((picked or {}).get("email", ""))

    auth_payload = {
        "id": user.get("id"),
        "login": user.get("login"),
        "name": user.get("name"),
        "avatar_url": user.get("avatar_url"),
        "email": email,
        "html_url": user.get("html_url"),
    }

    frontend_url = get_frontend_url()
    response = RedirectResponse(url=f"{frontend_url}/?auth=github-success", status_code=302)
    response.delete_cookie("gh_oauth_state", path="/")
    response.set_cookie(
        key="gh_user",
        value=base64.urlsafe_b64encode(json.dumps(auth_payload).encode("utf-8")).decode("ascii"),
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    response.set_cookie(
        key="gh_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return response


@app.get("/api/auth/me")
async def auth_me(request: Request) -> JSONResponse:
    raw = request.cookies.get("gh_user")
    if not raw:
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    try:
        decoded = base64.urlsafe_b64decode(raw.encode("ascii")).decode("utf-8")
        user = json.loads(decoded)
    except Exception:
        return JSONResponse(status_code=401, content={"detail": "Invalid auth session"})

    return JSONResponse(content={"provider": "github", "user": user})


@app.post("/api/auth/logout")
async def auth_logout() -> JSONResponse:
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("gh_user", path="/")
    response.delete_cookie("gh_token", path="/")
    response.delete_cookie("gh_oauth_state", path="/")
    return response


@app.get("/api/repo/{owner}/{name}")
async def get_repo(owner: str, name: str) -> dict:
    cache_key = _cache_key("repo", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_repo_url = f"{github_api_base_url}/repos/{owner}/{name}"
    readme_url = f"{base_repo_url}/readme"
    languages_url = f"{base_repo_url}/languages"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_repo_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(
                status_code=repo_resp.status_code, detail="Failed to fetch repository"
            )

        repo = repo_resp.json()

        readme_text = "README not available."
        readme_resp = await client.get(readme_url)
        if readme_resp.status_code == 200:
            readme_json = readme_resp.json()
            content = readme_json.get("content")
            encoding = readme_json.get("encoding")
            if content and encoding == "base64":
                try:
                    readme_text = base64.b64decode(content).decode(
                        "utf-8", errors="replace"
                    )
                except Exception:
                    readme_text = "README could not be decoded."

        languages: list[dict] = []
        languages_resp = await client.get(languages_url)
        if languages_resp.status_code == 200:
            raw_languages = languages_resp.json()
            total = sum(int(v) for v in raw_languages.values())
            if total > 0:
                languages = [
                    {
                        "name": lang,
                        "bytes": int(bytes_count),
                        "percent": round((int(bytes_count) / total) * 100, 1),
                        "color": LANG_COLORS.get(lang, "#888888"),
                    }
                    for lang, bytes_count in raw_languages.items()
                    if (percent := round((int(bytes_count) / total) * 100, 1)) >= 1
                ]
                languages.sort(key=lambda item: item["bytes"], reverse=True)

    license_info = repo.get("license")
    now_iso = datetime.now(timezone.utc).isoformat()

    result = {
        "owner": owner,
        "name": name,
        "full_name": repo.get("full_name", f"{owner}/{name}"),
        "description": repo.get("description") or "No description provided.",
        "avatar_url": (repo.get("owner") or {}).get("avatar_url", ""),
        "html_url": repo.get("html_url", f"https://github.com/{owner}/{name}"),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "watchers": repo.get("subscribers_count", repo.get("watchers_count", 0)),
        "open_issues": repo.get("open_issues_count", 0),
        "updated_at": repo.get("updated_at", now_iso),
        "created_at": repo.get("created_at", now_iso),
        "pushed_at": repo.get("pushed_at", now_iso),
        "topics": repo.get("topics", []),
        "license": license_info.get("spdx_id") if license_info else None,
        "visibility": repo.get("visibility", "public"),
        "default_branch": repo.get("default_branch", "main"),
        "homepage": repo.get("homepage") or None,
        "readme": readme_text,
        "languages": languages,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/contributors/{owner}/{name}")
async def get_contributors(owner: str, name: str) -> list[dict]:
    cache_key = _cache_key("contributors", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    url = f"{github_api_base_url}/repos/{owner}/{name}/contributors?per_page=100"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        resp = await client.get(url)
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=resp.status_code, detail="Failed to fetch contributors"
            )
        raw = resp.json()

    contributors = [
        {
            "login": item.get("login", "unknown"),
            "avatar_url": item.get("avatar_url", ""),
            "html_url": item.get("html_url", ""),
            "contributions": int(item.get("contributions", 0)),
        }
        for item in raw
    ]
    contributors.sort(key=lambda item: item["contributions"], reverse=True)
    await _cache_set_json(cache_key, contributors)
    return contributors


@app.get("/api/commits/{owner}/{name}")
async def get_commits(owner: str, name: str) -> dict:
    cache_key = _cache_key("commits", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_url = f"{github_api_base_url}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    start_day = datetime.now(timezone.utc).date() - timedelta(days=363)
    since = datetime.combine(
        start_day, datetime.min.time(), tzinfo=timezone.utc
    ).isoformat()

    commits: list[dict] = []
    max_pages = 10

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(
                status_code=repo_resp.status_code, detail="Failed to fetch repository"
            )

        for page in range(1, max_pages + 1):
            commits_url = f"{base_url}/commits?since={since}&per_page=100&page={page}"
            resp = await client.get(commits_url)
            if resp.status_code >= 400:
                raise HTTPException(
                    status_code=resp.status_code, detail="Failed to fetch commits"
                )

            page_items = resp.json()
            if not page_items:
                break
            commits.extend(page_items)

            if len(page_items) < 100:
                break

    daily_count_map = {
        (start_day + timedelta(days=offset)).isoformat(): 0 for offset in range(364)
    }

    recent: list[dict] = []
    for item in commits:
        commit_data = item.get("commit") or {}
        author_data = commit_data.get("author") or {}
        date_value = author_data.get("date")
        if not date_value:
            continue

        day_key = date_value[:10]
        if day_key in daily_count_map:
            daily_count_map[day_key] += 1

        if len(recent) < 10:
            user_data = item.get("author") or {}
            recent.append(
                {
                    "sha": item.get("sha", "")[:10],
                    "message": (
                        commit_data.get("message") or "No commit message"
                    ).split("\n", 1)[0],
                    "author": user_data.get("login")
                    or author_data.get("name")
                    or "unknown",
                    "avatar_url": user_data.get("avatar_url")
                    or "https://github.com/github.png",
                    "date": date_value,
                    "html_url": item.get("html_url")
                    or f"https://github.com/{owner}/{name}/commits",
                }
            )

    daily = [
        {"date": date_key, "count": daily_count_map[date_key]}
        for date_key in sorted(daily_count_map.keys())
    ]

    weekly = []
    for i in range(52):
        week_days = daily[i * 7 : (i + 1) * 7]
        week_total = sum(day["count"] for day in week_days)
        weekly.append({"week": week_days[0]["date"], "commits": week_total})

    total_commits = sum(item["commits"] for item in weekly)
    avg_per_week = round(total_commits / 52)
    peak_week = max(
        weekly,
        key=lambda item: item["commits"],
        default={"week": start_day.isoformat(), "commits": 0},
    )

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_buckets = {name: 0 for name in day_names}
    for date_key, count in daily_count_map.items():
        day_index = datetime.fromisoformat(date_key).weekday()
        day_buckets[day_names[day_index]] += count
    most_active_day = max(day_buckets, key=lambda k: day_buckets.get(k, 0))

    result = {
        "weekly": weekly,
        "daily": daily,
        "total_commits": total_commits,
        "avg_per_week": avg_per_week,
        "most_active_day": most_active_day,
        "peak_week": peak_week,
        "recent": recent,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/issues/{owner}/{name}")
async def get_issues(owner: str, name: str) -> dict:
    cache_key = _cache_key("issues", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_repo_url = f"{github_api_base_url}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_repo_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(
                status_code=repo_resp.status_code, detail="Failed to fetch repository"
            )

        search_base = f"{github_api_base_url}/search/issues?q=repo:{owner}/{name}"

        open_issues_resp = await client.get(f"{search_base}+type:issue+state:open")
        closed_issues_resp = await client.get(f"{search_base}+type:issue+state:closed")
        open_prs_resp = await client.get(f"{search_base}+type:pr+state:open")
        merged_prs_resp = await client.get(f"{search_base}+type:pr+is:merged")
        closed_prs_resp = await client.get(f"{search_base}+type:pr+state:closed")

        responses = [
            open_issues_resp,
            closed_issues_resp,
            open_prs_resp,
            merged_prs_resp,
            closed_prs_resp,
        ]
        for resp in responses:
            if resp.status_code >= 400:
                raise HTTPException(
                    status_code=resp.status_code,
                    detail="Failed to fetch issue statistics",
                )

        open_issues = int(open_issues_resp.json().get("total_count", 0))
        closed_issues = int(closed_issues_resp.json().get("total_count", 0))
        open_prs = int(open_prs_resp.json().get("total_count", 0))
        merged_prs = int(merged_prs_resp.json().get("total_count", 0))
        closed_prs_total = int(closed_prs_resp.json().get("total_count", 0))
        closed_prs = max(0, closed_prs_total - merged_prs)

        recent_issues_resp = await client.get(
            f"{base_repo_url}/issues?state=all&sort=created&direction=desc&per_page=30"
        )
        if recent_issues_resp.status_code >= 400:
            raise HTTPException(
                status_code=recent_issues_resp.status_code,
                detail="Failed to fetch recent issues",
            )

        recent_issues_raw = recent_issues_resp.json()
        recent_issues = [
            {
                "number": int(item.get("number", 0)),
                "title": item.get("title", "Untitled issue"),
                "state": "open" if item.get("state") == "open" else "closed",
                "labels": [
                    {
                        "name": label.get("name", "label"),
                        "color": label.get("color", "999999"),
                    }
                    for label in item.get("labels", [])
                    if isinstance(label, dict)
                ],
                "user": (item.get("user") or {}).get("login", "unknown"),
                "created_at": item.get(
                    "created_at", datetime.now(timezone.utc).isoformat()
                ),
            }
            for item in recent_issues_raw
            if "pull_request" not in item
        ][:8]

        recent_prs_resp = await client.get(
            f"{base_repo_url}/pulls?state=all&sort=created&direction=desc&per_page=20"
        )
        if recent_prs_resp.status_code >= 400:
            raise HTTPException(
                status_code=recent_prs_resp.status_code,
                detail="Failed to fetch recent pull requests",
            )

        recent_prs_raw = recent_prs_resp.json()
        recent_prs = [
            {
                "number": int(item.get("number", 0)),
                "title": item.get("title", "Untitled pull request"),
                "state": "merged"
                if item.get("merged_at")
                else ("open" if item.get("state") == "open" else "closed"),
                "user": (item.get("user") or {}).get("login", "unknown"),
                "created_at": item.get(
                    "created_at", datetime.now(timezone.utc).isoformat()
                ),
            }
            for item in recent_prs_raw
        ][:8]

        closed_for_avg_resp = await client.get(
            f"{base_repo_url}/issues?state=closed&sort=updated&direction=desc&per_page=50"
        )
        avg_close_days = 0.0
        if closed_for_avg_resp.status_code == 200:
            closed_items = [
                item
                for item in closed_for_avg_resp.json()
                if "pull_request" not in item
                and item.get("created_at")
                and item.get("closed_at")
            ]
            durations: list[float] = []
            for item in closed_items:
                try:
                    created = datetime.fromisoformat(
                        item["created_at"].replace("Z", "+00:00")
                    )
                    closed = datetime.fromisoformat(
                        item["closed_at"].replace("Z", "+00:00")
                    )
                    durations.append((closed - created).total_seconds() / 86400)
                except Exception:
                    continue
            if durations:
                avg_close_days = round(sum(durations) / len(durations), 1)

    result = {
        "open_issues": open_issues,
        "closed_issues": closed_issues,
        "open_prs": open_prs,
        "merged_prs": merged_prs,
        "closed_prs": closed_prs,
        "avg_close_days": avg_close_days,
        "recent_issues": recent_issues,
        "recent_prs": recent_prs,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/health-score/{owner}/{name}")
async def get_health_score(owner: str, name: str) -> dict:
    cache_key = _cache_key("health-score", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_repo_url = f"{github_api_base_url}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_repo_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(
                status_code=repo_resp.status_code, detail="Failed to fetch repository"
            )
        repo = repo_resp.json()

        readme_resp = await client.get(f"{base_repo_url}/readme")
        has_readme = readme_resp.status_code == 200
        readme_size = (
            int((readme_resp.json() or {}).get("size", 0)) if has_readme else 0
        )

        contributors_resp = await client.get(
            f"{base_repo_url}/contributors?per_page=100"
        )
        contributors_count = 0
        if contributors_resp.status_code == 200:
            contributors_count = len(contributors_resp.json() or [])

        languages_resp = await client.get(f"{base_repo_url}/languages")
        language_count = 0
        if languages_resp.status_code == 200:
            language_count = len((languages_resp.json() or {}).keys())

    now = datetime.now(timezone.utc)
    pushed_at_raw = repo.get("pushed_at")
    pushed_at = now
    if isinstance(pushed_at_raw, str):
        try:
            pushed_at = datetime.fromisoformat(pushed_at_raw.replace("Z", "+00:00"))
        except Exception:
            pushed_at = now

    days_since_push = max(0, (now - pushed_at).days)
    open_issues = int(repo.get("open_issues_count", 0) or 0)
    stars = int(repo.get("stargazers_count", 0) or 0)
    has_license = bool(repo.get("license"))
    has_homepage = bool(repo.get("homepage"))
    topics_count = len(repo.get("topics") or [])

    documentation = 45
    documentation += 25 if has_readme else 0
    documentation += 10 if readme_size > 2000 else 4 if readme_size > 0 else 0
    documentation += 10 if has_license else 0
    documentation += 10 if has_homepage else 0
    documentation = max(0, min(100, documentation))

    activity = 35
    if days_since_push <= 3:
        activity += 35
    elif days_since_push <= 14:
        activity += 25
    elif days_since_push <= 45:
        activity += 15
    else:
        activity += 5
    activity += 20 if open_issues < 200 else 12 if open_issues < 1000 else 5
    activity += 10 if stars > 1000 else 5 if stars > 100 else 0
    activity = max(0, min(100, activity))

    community = 30
    community += (
        25
        if contributors_count >= 20
        else 18
        if contributors_count >= 8
        else 10
        if contributors_count >= 3
        else 2
    )
    community += 20 if stars > 5000 else 12 if stars > 500 else 5 if stars > 100 else 0
    community += 15 if topics_count >= 5 else 8 if topics_count >= 2 else 0
    community += 10 if has_homepage else 0
    community = max(0, min(100, community))

    code_quality = 40
    code_quality += 20 if has_license else 0
    code_quality += 15 if language_count >= 3 else 8 if language_count >= 1 else 0
    code_quality += 15 if topics_count >= 4 else 8 if topics_count >= 1 else 0
    default_branch = str(repo.get("default_branch", "")).lower()
    code_quality += 10 if default_branch in ("main", "master") else 4
    code_quality = max(0, min(100, code_quality))

    overall = round((documentation + activity + community + code_quality) / 4)

    tips: list[dict] = []
    if documentation < 80:
        tips.append(
            {
                "area": "Documentation",
                "tip": "Improve README depth and add setup, usage, and contribution guides.",
            }
        )
    if activity < 80:
        tips.append(
            {
                "area": "Activity",
                "tip": "Increase release and commit cadence, and reduce stale open issues.",
            }
        )
    if community < 80:
        tips.append(
            {
                "area": "Community",
                "tip": "Grow contributor base and improve issue/PR engagement.",
            }
        )
    if code_quality < 80:
        tips.append(
            {
                "area": "Code Quality",
                "tip": "Strengthen repo standards with clear labels, license, and stable conventions.",
            }
        )

    result = {
        "overall": overall,
        "documentation": documentation,
        "activity": activity,
        "community": community,
        "code_quality": code_quality,
        "tips": tips,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/ai-summary/{owner}/{name}")
async def get_ai_summary(owner: str, name: str) -> dict:
    cache_key = _cache_key("ai-summary", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_repo_url = f"{github_api_base_url}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_repo_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(
                status_code=repo_resp.status_code, detail="Failed to fetch repository"
            )
        repo = repo_resp.json()

        langs_resp = await client.get(f"{base_repo_url}/languages")
        langs_json = langs_resp.json() if langs_resp.status_code == 200 else {}

        contrib_resp = await client.get(f"{base_repo_url}/contributors?per_page=20")
        contributors = contrib_resp.json() if contrib_resp.status_code == 200 else []

    stars = int(repo.get("stargazers_count", 0) or 0)
    forks = int(repo.get("forks_count", 0) or 0)
    open_issues = int(repo.get("open_issues_count", 0) or 0)
    description = repo.get("description") or "No description provided."
    homepage = repo.get("homepage") or None
    topics = repo.get("topics") or []
    default_branch = repo.get("default_branch", "main")

    total_bytes = (
        sum(int(v) for v in langs_json.values()) if isinstance(langs_json, dict) else 0
    )
    language_rows: list[tuple[str, float]] = []
    if total_bytes > 0:
        for lang, bytes_count in langs_json.items():
            percent = (int(bytes_count) / total_bytes) * 100
            language_rows.append((str(lang), percent))
        language_rows.sort(key=lambda x: x[1], reverse=True)

    top_langs = (
        ", ".join([f"{lang} ({percent:.1f}%)" for lang, percent in language_rows[:4]])
        or "Not detected"
    )

    active_contributors = len(contributors) if isinstance(contributors, list) else 0
    audience = (
        "Teams building production systems with scalability and reliability needs."
        if stars > 1000
        else "Developers evaluating or building practical open-source solutions."
    )

    quality_score = 0
    quality_score += (
        1 if description and description != "No description provided." else 0
    )
    quality_score += 1 if bool(homepage) else 0
    quality_score += 1 if len(topics) >= 3 else 0
    quality_score += 1 if stars >= 500 else 0
    quality_score += 1 if active_contributors >= 5 else 0

    if quality_score >= 4:
        quality = "The repository shows strong maintenance signals, clear positioning, and healthy adoption."
        verdict = "Strong project health with good production confidence."
    elif quality_score >= 2:
        quality = "The repository appears reasonably maintained with moderate community and documentation signals."
        verdict = (
            "Promising project with a few areas to monitor before critical adoption."
        )
    else:
        quality = "The repository currently has limited trust signals and may need deeper manual review."
        verdict = (
            "Use with caution until maintenance and documentation signals improve."
        )

    what = (
        f"{name} is a GitHub repository by @{owner}. {description}"
        f" It currently has {stars} stars, {forks} forks, and {open_issues} open issues."
    )
    tech = f"Primary technology profile: {top_langs}. Default branch: {default_branch}."

    topics_text = ", ".join(topics[:6]) if topics else "No topics listed"
    homepage_text = homepage if homepage else "No homepage configured"

    raw_markdown = (
        f"## What this repo does\n"
        f"{what}\n\n"
        f"## Tech used\n"
        f"{tech}\n\n"
        f"## Code quality\n"
        f"{quality}\n\n"
        f"## Who it's for\n"
        f"{audience}\n\n"
        f"## Verdict\n"
        f"{verdict}\n\n"
        f"---\n"
        f"- Topics: {topics_text}\n"
        f"- Homepage: {homepage_text}\n"
        f"- Contributors sampled: {active_contributors}"
    )

    result = {
        "what": what,
        "tech": tech,
        "quality": quality,
        "audience": audience,
        "verdict": verdict,
        "raw_markdown": raw_markdown,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/dependencies/{owner}/{name}")
async def get_dependencies(owner: str, name: str) -> dict:
    cache_key = _cache_key("dependencies", owner, name)
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    base_repo_url = f"{github_api_base_url}/repos/{owner}/{name}"

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        repo_resp = await client.get(base_repo_url)
        if repo_resp.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository not found")
        if repo_resp.status_code >= 400:
            raise HTTPException(status_code=repo_resp.status_code, detail="Failed to fetch repository")

        root_contents_resp = await client.get(f"{base_repo_url}/contents")
        if root_contents_resp.status_code >= 400:
            raise HTTPException(status_code=root_contents_resp.status_code, detail="Failed to fetch repository files")
        root_contents = root_contents_resp.json()

        root_names = {str(item.get("name", "")).lower() for item in root_contents if isinstance(item, dict)}

        if "bun.lockb" in root_names:
            package_manager = "bun"
        elif "pnpm-lock.yaml" in root_names:
            package_manager = "pnpm"
        elif "yarn.lock" in root_names:
            package_manager = "yarn"
        elif "package-lock.json" in root_names or "package.json" in root_names:
            package_manager = "npm"
        elif "pyproject.toml" in root_names or "requirements.txt" in root_names:
            package_manager = "pip"
        elif "pom.xml" in root_names:
            package_manager = "maven"
        elif "go.mod" in root_names:
            package_manager = "go"
        elif "cargo.toml" in root_names:
            package_manager = "cargo"
        else:
            package_manager = "unknown"

        ci_cd: list[str] = []
        gh_workflows_resp = await client.get(f"{base_repo_url}/contents/.github/workflows")
        if gh_workflows_resp.status_code == 200:
            ci_cd.append("GitHub Actions")

        has_docker = "dockerfile" in root_names or "docker-compose.yml" in root_names or "docker-compose.yaml" in root_names
        has_linting = any(
            name in root_names
            for name in (".eslintrc", ".eslintrc.js", "eslint.config.js", ".prettierrc", "ruff.toml", "pyproject.toml")
        )
        has_tests = any(name in root_names for name in ("pytest.ini", "jest.config.js", "vitest.config.ts", "tox.ini")) or any(
            name.startswith("test") for name in root_names
        )

        dependencies: list[dict] = []
        if "package.json" in root_names:
            pkg_resp = await client.get(f"{base_repo_url}/contents/package.json")
            if pkg_resp.status_code == 200:
                pkg_json = pkg_resp.json()
                content = pkg_json.get("content")
                encoding = pkg_json.get("encoding")
                if content and encoding == "base64":
                    try:
                        decoded = base64.b64decode(content).decode("utf-8", errors="replace")
                        parsed = json.loads(decoded)
                        merged = {}
                        merged.update(parsed.get("dependencies") or {})
                        merged.update(parsed.get("devDependencies") or {})
                        dependencies = [
                            {"name": dep_name, "version": str(dep_version)}
                            for dep_name, dep_version in list(merged.items())[:20]
                        ]
                    except Exception:
                        dependencies = []

    result = {
        "package_manager": package_manager,
        "ci_cd": ci_cd,
        "has_tests": has_tests,
        "has_linting": has_linting,
        "has_docker": has_docker,
        "dependencies": dependencies,
    }
    await _cache_set_json(cache_key, result)
    return result


@app.get("/api/trending")
async def get_trending_repos() -> list[dict]:
    cache_key = _cache_key("trending")
    cached = await _cache_get_json(cache_key)
    if cached is not None:
        return cached

    github_api_base_url = get_github_api_base_url()
    query_date = (datetime.now(timezone.utc) - timedelta(days=14)).date().isoformat()
    url = (
        f"{github_api_base_url}/search/repositories"
        f"?q=created:>{query_date}&sort=stars&order=desc&per_page=4"
    )

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": get_backend_user_agent(),
    }
    token = get_github_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    timeout = httpx.Timeout(get_http_timeout_seconds())

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        resp = await client.get(url)
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch trending repositories")
        items = (resp.json() or {}).get("items", [])

    trending = []
    for item in items:
        owner_data = item.get("owner") or {}
        language = item.get("language") or "Unknown"
        trending.append(
            {
                "owner": owner_data.get("login", "unknown"),
                "name": item.get("name", "repo"),
                "description": item.get("description") or "No description provided.",
                "stars": int(item.get("stargazers_count", 0) or 0),
                "forks": int(item.get("forks_count", 0) or 0),
                "language": language,
                "languageColor": LANG_COLORS.get(language, "#888888"),
            }
        )

    await _cache_set_json(cache_key, trending)
    return trending
