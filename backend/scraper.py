import httpx
import pandas as pd, re
import io
from bs4 import BeautifulSoup
scorers_url = "https://vmslsoccer.com/webapps/spappz_live/division_player_stats"
shutouts_url = "https://vmslsoccer.com/webapps/spappz_live/division_goalie_stats"
mvps_url = "https://vmslsoccer.com/webapps/spappz_live/division_player_mvps"
div_stats_url = "https://vmslsoccer.com/webapps/spappz_live/div_stats"

def get_html(url, parameters = None):
    with httpx.Client(follow_redirects = True, timeout = httpx.Timeout(30)) as client:
        if parameters:
            response = client.get(url, params = parameters)
        else:
            response = client.get(url)
        return response.text
        
def vmsl_params(year, division):

    return {
        "reg_year": year,
        "division": division,
        "sched_type":  "reg",
        "combined": "",
        "firsttime": 0,
    }

# handle the cases in which a given column is not a string
# # e.g. is a tuple or an integer
def column_to_string(column):
    #if isinstance(column, tuple):
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

    select = soup.find("select", attrs = {"name": "division"})

    blacklist = ["choose", "qual", "pro", "rel", "prov", "cup", "ccc", "imperial", "masters", "youth"]
    division_categories = {"open": [], "u21": [], "o35": [], "o45": [], "o55": []}

    def is_league(name, code):

        if any(b_league.lower() in code.lower() for b_league in blacklist): return False
        if any(b_league.lower() in name.lower() for b_league in blacklist): return False
        return True

    for option in select.find_all("option"):

        code = option.get("value").strip()
        name = option.get_text(strip = True)

        if is_league(name, code): 

            league = {"code": code, "name": name}

            if "u21" in code or "u21" in name: division_categories["u21"].append(league)
            elif code.startswith("m") or "o35" in name: division_categories["o35"].append(league)
            elif "o45" in code or "o45" in name: division_categories["o45"].append(league)
            elif "o55" in code or "o55" in name: division_categories["o55"].append(league)
            else: division_categories["open"].append(league)
            
    return division_categories

def find_reg_year():

    html = get_html(div_stats_url)
    soup = BeautifulSoup(html, "html.parser")

    reg_years = []

    select = soup.find("select", attrs = {"name": "reg_year"})
    for option in select.find_all("option"):

        text = option.get_text(strip = True)
        pattern = re.search(r"(\d{4})-(\d{4})", text)
        if pattern:
            _, end = pattern.groups()
            reg_years.append(int(end))
    
    return max(reg_years)

def parse_standings(year, division):

    html = get_html(div_stats_url, vmsl_params(year, division))

    # read the given url (first row is the header)
    tables = pd.read_html(io.StringIO(html), header = 0)

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

        return dataframe.rename(columns = rename_map)
    
    pools = []

    for t in tables:
        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"team", "pts", "position"}.issubset(columns):
            keep = ["position","team","gp","w","d","l","gf","ga","gd","pts"]
            t = t[keep].copy()

            t["team"] = t["team"].astype(str).str.strip()
            for column in keep:
                if column != "team":
                    t[column] = pd.to_numeric(t[column], errors = "coerce").fillna(0).astype(int)

            pools.append(t.to_dict(orient = "records"))
    
    return pools



    standings_html = get_html(standings_url, vmsl_params(2026, 1))
    standings_rows = parse_standings(standings_html)

    return [r["team"] for r in standings_rows]

def parse_scorers(year, division):

    html = get_html(scorers_url, vmsl_params(year, division))

    soup = BeautifulSoup(html, "html.parser") # object representing HTML
    candidates = []

    # Find all tables linebox listtable tables
    # Add table to candidates if it contains a header row (row of class colhead)
    for table in soup.find_all("table", class_ = "linebox listtable"):
        if table.find("tr", class_ = "colhead"):
            candidates.append(table)

    if not candidates:
        return []
    
    table_html = candidates[0] # Take the first candidate table

    pools = []

    for table in candidates:
        
        table_html = table

        # Locate header row inside the table, and collects cells inside header
        # Create a clean list of text labels from header cells
        header_cells = table_html.find("tr", class_ = "colhead").find_all("td")
        header_labels = [td.get_text(strip = True) for td in header_cells]

        dataframe = pd.read_html(io.StringIO(str(table_html)), header = None)[0] # dataframe is the first table found

        # Concatenate text from first row
        # If first row is the banner (contains text), remove it

        def is_banner(row):
            row_text = " ".join(str(text) for text in row if pd.notna(text))
            row_text = row_text.lower()
            return "leader" in row_text
        
        banner_mask = dataframe.apply(is_banner, axis = 1)
        dataframe = dataframe.loc[~banner_mask].reset_index(drop = True)

        def is_header(row):

            row_values = [str(text).strip().lower() for text in row[:len(header_labels)]]
            header_values = [h.strip().lower() for h in header_labels]
            return row_values == header_values

        header_mask = dataframe.apply(is_header, axis = 1)
        dataframe = dataframe.loc[~header_mask].reset_index(drop = True)

        dataframe.columns = header_labels

        rename_map = {}
        for column in dataframe.columns:
            raw = str(column).strip().lower()
            raw = re.sub(r"\s+", "", raw)
            if "player" in raw:
                rename_map[column] = "player"
            elif "team" in raw:
                rename_map[column] = "team"
            elif "goal" in raw:
                rename_map[column] = "goals"
        
        dataframe = dataframe.rename(columns = rename_map)

        dataframe["player"] = (dataframe["player"].astype(str).str.replace(r"\s+", " ", regex=True)
                            .str.strip())
        dataframe["player"] = dataframe["player"].str.replace(r"\(\d+\)$", "", regex=True).str.strip()
        
        dataframe["team"] = (dataframe["team"].astype(str).str.replace(r"\s+", " ", regex=True)
                            .str.strip())
        
        dataframe["goals"] = pd.to_numeric(dataframe["goals"], errors = "coerce").fillna(0).astype(int)
        
        pools.append(dataframe.to_dict(orient = "records"))
    
    return pools
    
def parse_mvps(year, division):

    html = get_html(mvps_url, vmsl_params(year, division))

    tables = pd.read_html(io.StringIO(html), header = 0)

    def normalize_columns(dataframe):

        rename_map = {}
        for column in dataframe.columns:
            raw = column_to_string(column)
            cleaned = raw.strip().lower()
            cleaned = re.sub(r"\s+", "", cleaned)

            if "player" in cleaned:
                rename_map[column] = "player"
            elif "team" in cleaned:
                rename_map[column] = "team"
            elif "mvp" in cleaned:
                rename_map[column] = "mvps"
        
        return dataframe.rename(columns = rename_map)
    
    pools = []
    
    for t in tables:
        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"player", "team", "mvps"}.issubset(columns):
            t = t[["player", "team", "mvps"]].copy()

            t["player"] = t["player"].astype(str).str.strip()
            t["team"] = t["team"].astype(str).str.strip()
            t["mvps"] = pd.to_numeric(t["mvps"], errors = "coerce").fillna(0).astype(int)

            pools.append(t.to_dict(orient = "records"))

    return pools

def parse_shutouts(year, division):

    html = get_html(shutouts_url, vmsl_params(year, division))

    tables = pd.read_html(io.StringIO(html), header = 0)

    def normalize_columns(dataframe):

        rename_map = {}
        for column in dataframe.columns:
            raw = column_to_string(column)
            cleaned = raw.strip().lower()
            cleaned = re.sub(r"\s+", "", cleaned)

            if "player" in cleaned:
                rename_map[column] = "player"
            elif "team" in cleaned:
                rename_map[column] = "team"
            elif "shut" in cleaned:
                rename_map[column] = "shutouts"
        
        return dataframe.rename(columns = rename_map)

    pools = []
    
    for t in tables:
        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"player", "team", "shutouts"}.issubset(columns):
            t = t[["player", "team", "shutouts"]].copy()

            t["player"] = t["player"].astype(str).str.strip()
            t["team"] = t["team"].astype(str).str.strip()
            t["shutouts"] = pd.to_numeric(t["shutouts"], errors = "coerce").fillna(0).astype(int)

            pools.append(t.to_dict(orient = "records"))
    
    return pools

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
          
        return dataframe.rename(columns = rename_map)

    tables = pd.read_html(io.StringIO(html), header = 0)

    for t in tables:

        t = normalize_columns(t)
        columns = {str(c).lower() for c in t.columns}

        if {"schedule", "date"}.issubset(columns):

            keep = ["schedule","type","date","division","hometeam","result","awayteam","field"]
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
            t["date"] = pd.to_datetime(t["date"], format = "%a %m/%d/%Y %I:%M%p", errors = "coerce").dt.date

            t = t.drop(columns = ["result", "schedule", "type"])

            t = t.dropna(subset = ["date", "hometeam", "awayteam"], how = "any")

            import math
            def clean_nan_values(schedule):
                for row in schedule:
                    for key, value in row.items():
                        if isinstance(value,float) and math.isnan(value): row[key] = None
                return schedule

            return clean_nan_values(t.to_dict(orient = "records"))
        
    return []

def slugify_name(name):
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug

# To Do Next:
# Plan the Purpose and Final Implementation
# Design an Interface and Think about System Architecture
