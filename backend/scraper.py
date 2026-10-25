from .transport import get_html, UpstreamError
import pandas as pd
import re
import io
from bs4 import BeautifulSoup

scorers_url = "https://vmslsoccer.com/webapps/spappz_live/division_player_stats"
shutouts_url = "https://vmslsoccer.com/webapps/spappz_live/division_goalie_stats"
mvps_url = "https://vmslsoccer.com/webapps/spappz_live/division_player_mvps"
div_stats_url = "https://vmslsoccer.com/webapps/spappz_live/div_stats"


def vmsl_params(year, division):

    return {
        "reg_year": year,
        "division": division,
        "sched_type": "reg",
        "combined": "",
        "firsttime": 0,
    }


# handle the cases in which a given column is not a string
# # e.g. is a tuple or an integer
def column_to_string(column):
    # if isinstance(column, tuple):
    #    column = " ".join( map(str, column) ) # join the elements if the column is a tuple (multi-level header)
    return str(column)


def find_leagues(year):

    params = {
        "reg_year": year,
        "sched_type": "reg",
        "combined": "",
        "firsttime": 1,
    }

    html = get_html(div_stats_url, params)

    soup = BeautifulSoup(html, "html.parser")

    select = soup.find("select", attrs={"name": "division"})

    blacklist = [
        "choose",
        "qual",
        "pro",
        "rel",
        "prov",
        "cup",
        "ccc",
        "imperial",
        "masters",
        "youth",
    ]
    division_categories = {"open": [], "u21": [], "o35": [], "o45": [], "o55": []}

    def is_league(name, code):

        if any(b_league.lower() in code.lower() for b_league in blacklist):
            return False
        if any(b_league.lower() in name.lower() for b_league in blacklist):
            return False
        return True

    if select is None:
        raise UpstreamError("Expected season/division selector is missing")
    for option in select.find_all("option"):
        code = (option.get("value") or "").strip()
        name = option.get_text(strip=True)

        if is_league(name, code):
            league = {"code": code, "name": name}

            if "u21" in code or "u21" in name:
                division_categories["u21"].append(league)
            elif code.startswith("m") or "o35" in name:
                division_categories["o35"].append(league)
            elif "o45" in code or "o45" in name:
                division_categories["o45"].append(league)
            elif "o55" in code or "o55" in name:
                division_categories["o55"].append(league)
            else:
                division_categories["open"].append(league)

    return division_categories


def find_reg_year():

    html = get_html(div_stats_url)
    soup = BeautifulSoup(html, "html.parser")

    reg_years = []

    select = soup.find("select", attrs={"name": "reg_year"})
    if select is None:
        raise UpstreamError("Expected season/division selector is missing")
    for option in select.find_all("option"):
        text = option.get_text(strip=True)
        pattern = re.search(r"(\d{4})-(\d{4})", text)
        if pattern:
            _, end = pattern.groups()
            reg_years.append(int(end))

    if not reg_years:
        raise UpstreamError("No season options found")
    return max(reg_years)


def parse_standings(year, division):

    html = get_html(div_stats_url, vmsl_params(year, division))

    # read the given url (first row is the header)
    tables = read_tables(html)

    def normalize_columns(dataframe):

        rename_map = {}

        for column in dataframe.columns:
            raw = column_to_string(column)
            cleaned = raw.strip().lower()
            cleaned = re.sub(r"\s+", "", cleaned)

            if "pos" in cleaned:
                rename_map[column] = "position"
            elif "team" in cleaned:
                rename_map[column] = "team"
            elif cleaned == "gp":
                rename_map[column] = "gp"
            elif cleaned == "w":
                rename_map[column] = "w"
            elif cleaned == "d":
                rename_map[column] = "d"
            elif cleaned == "l":
                rename_map[column] = "l"
            elif cleaned == "gf":
                rename_map[column] = "gf"
            elif cleaned == "ga":
                rename_map[column] = "ga"
            elif cleaned == "gd":
                rename_map[column] = "gd"
            elif "pts" in cleaned:
                rename_map[column] = "pts"

        return dataframe.rename(columns=rename_map)

    pools = []

    for t in tables:
        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"team", "pts", "position"}.issubset(columns):
            if not {"gp", "w", "d", "l", "gf", "ga", "gd"}.issubset(columns):
                raise UpstreamError("Standings columns changed")
            keep = ["position", "team", "gp", "w", "d", "l", "gf", "ga", "gd", "pts"]
            t = t[keep].copy()

            t["team"] = t["team"].astype(str).str.strip()
            for column in keep:
                if column != "team":
                    try:
                        t[column] = pd.to_numeric(t[column], errors="raise").astype(int)
                    except (ValueError, TypeError) as exc:
                        raise UpstreamError("Invalid standings number") from exc

            pools.append(t.to_dict(orient="records"))

    return pools


def parse_player_stats(year, division, url, metric):
    """Normalize the three leaderboard formats through one header-driven parser."""
    soup = BeautifulSoup(get_html(url, vmsl_params(year, division)), "html.parser")
    pools = []
    for table in soup.find_all("table"):
        if table.find("table") is not None:
            continue  # Layout tables contain the same nested leaderboard rows.
        rows = table.find_all("tr")
        indices = None
        players = []
        for row in rows:
            cells = [
                c.get_text(" ", strip=True)
                for c in row.find_all(["td", "th"], recursive=False)
            ]
            headers = [re.sub(r"\s+", "", c.lower()) for c in cells]
            found = {}
            for i, h in enumerate(headers):
                if "player" in h:
                    found["player"] = i
                elif "team" in h:
                    found["team"] = i
                elif (
                    "goal"
                    if metric == "goals"
                    else "mvp"
                    if metric == "mvps"
                    else "shut"
                ) in h:
                    found[metric] = i
            if len(found) == 3:
                indices = found
                continue
            if indices is None or len(cells) <= max(indices.values()):
                continue
            value = cells[indices[metric]]
            if not value.isdigit():
                continue
            players.append(
                {
                    "player": re.sub(r"\(\d+\)$", "", cells[indices["player"]]).strip(),
                    "team": cells[indices["team"]],
                    metric: int(value),
                }
            )
        if indices is not None:
            pools.append(players)
    return pools


def parse_scorers(year, division):
    return parse_player_stats(year, division, scorers_url, "goals")


def parse_mvps(year, division):
    return parse_player_stats(year, division, mvps_url, "mvps")


def parse_shutouts(year, division):
    return parse_player_stats(year, division, shutouts_url, "shutouts")


def parse_schedule(year, division):

    html = get_html(div_stats_url, vmsl_params(year, division))

    def normalize_columns(dataframe):

        rename_map = {}

        for column in dataframe.columns:
            raw = column_to_string(column)
            cleaned = raw.strip().lower()
            cleaned = re.sub(r"\s+", "", cleaned)

            if "schedule" in cleaned:
                rename_map[column] = "schedule"
            elif "type" in cleaned:
                rename_map[column] = "type"
            elif "date" in cleaned:
                rename_map[column] = "date"
            elif "division" in cleaned:
                rename_map[column] = "division"
            elif "home" in cleaned:
                rename_map[column] = "hometeam"
            elif "visiting" in cleaned:
                rename_map[column] = "awayteam"
            elif "result" in cleaned:
                rename_map[column] = "result"
            elif "field" in cleaned:
                rename_map[column] = "field"

        return dataframe.rename(columns=rename_map)

    tables = read_tables(html)

    for t in tables:
        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"schedule", "date"}.issubset(columns):
            if not {
                "type",
                "division",
                "hometeam",
                "result",
                "awayteam",
                "field",
            }.issubset(columns):
                raise UpstreamError("Schedule columns changed")

            keep = [
                "schedule",
                "type",
                "date",
                "division",
                "hometeam",
                "result",
                "awayteam",
                "field",
            ]
            t = t[keep].copy()

            for column in keep:
                t[column] = t[column].astype(str).str.strip()

            # processing the score string
            result_pattern = re.compile(r"(\d+)\s*[-–—]\s*(\d+)")

            home_results = []
            away_results = []

            for result in t["result"]:
                cleaned_result = str(result).strip()
                match = result_pattern.match(cleaned_result)
                if match:
                    home_results.append(int(match.group(1)))
                    away_results.append(int(match.group(2)))
                else:
                    home_results.append(None)
                    away_results.append(None)

            t["homeresult"] = home_results
            t["awayresult"] = away_results

            t["homeresult"] = t["homeresult"].where(pd.notna(t["homeresult"]), None)
            t["awayresult"] = t["awayresult"].where(pd.notna(t["homeresult"]), None)

            # processing the date string
            t["date"] = pd.to_datetime(
                t["date"], format="%a %m/%d/%Y %I:%M%p", errors="coerce"
            ).dt.date

            t = t.drop(columns=["result", "schedule", "type"])

            t = t.dropna(subset=["date", "hometeam", "awayteam"], how="any")

            import math

            def clean_nan_values(schedule):
                for row in schedule:
                    for key, value in row.items():
                        if isinstance(value, float) and math.isnan(value):
                            row[key] = None
                return schedule

            return clean_nan_values(t.to_dict(orient="records"))

    return []


def slugify_name(name):
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug


def read_tables(html):
    try:
        return pd.read_html(io.StringIO(html), header=0, flavor="lxml")
    except ValueError as exc:
        raise UpstreamError("Expected statistics tables are missing") from exc
