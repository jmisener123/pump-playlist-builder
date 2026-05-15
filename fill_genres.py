#!/usr/bin/env python3
"""
Fill in Genre column for tracks in releases 1-59 that currently have no genre.
"""

import csv
import re
from pathlib import Path

CSV_PATH = Path("/Users/jmisener/Downloads/pump-playlist-builder/public/data.csv")

# ─── Artist → Genre mappings ─────────────────────────────────────────────────

ROCK_ARTISTS = [
    "ac/dc", "acdc", "bon jovi", "creed", "guns n roses", "guns n' roses",
    "metallica", "van halen", "queen", "the doors", "midnight oil", "inxs",
    "lnxs",  # typo seen in CSV
    "loverboy", "aerosmith", "icehouse", "don henley", "eric clapton",
    "jimmy barnes", "bruce springsteen", "republica", "garbage", "bodyrockers",
    "korn", "linkin park", "rob zombie", "alice cooper", "duran duran",
    "fine young cannibals", "u2", "edwin collins", "ben harper", "evanescence",
    "b-52", "the b-52", "point blank", "big & rich",
]

EDM_ARTISTS = [
    "2 unlimited", "culture beat", "la bouche", "real mccoy", "dj bobo",
    "snap!", "snap,", "ab logic", "a.b. logic", "a b logic",
    "captain jack", "e-type", "e type", "sash", "darude", "paffendorf",
    "ian van dahl", "lasgo", "milk inc", "dj sammy", "dj otzi", "n-trance",
    "cascada", "infernal", "aquagen", "warp brothers", "delerium", "delirium",
    "bomfunk", "freestyler", "motiv8", "nycc", "n.y.c.c.", "techno boy",
    "voodoo", "benny benassi", "chemical brothers", "motorcycle",
    "shapeshifters", "tiesto", "xtm", "jason nevins", "public domain",
    "fkw", "r.a.f.", "dr alban", "dr. alban", "newton", "b-one",
    "crystal waters", "gina g", "gine g", "yello", "rednex", "black box",
    "technotronic", "harajuku", "k klass", "tin man", "tinman", "h block",
    "in-grid", "tof", "paradiso", "zico", "mendez", "funky green dogs",
    "dj aligator", "kate ryan", "danzel", "dj jurgen", "safri duo",
    "nu pagadi", "c.o.", "voodoo & serano", "novaspace", "slinkee minx",
    "jan wayne", "fatboy slim", "millennium", "sweetbox", "east 17",
    "east seventeen", "big pig", "t spoon", "fortuna", "alexia",
    "milk & sugar", "da buzz", "supermen lovers", "kim lucas", "double you",
    "lee mamu", "lee marrow", "inner circle",
]

HIP_HOP_ARTISTS = [
    "tag team", "public enemy", "will smith", "eminem", "nelly", "salt n pepa",
    "run dmc", "missy elliott", "dj jazzy jeff", "fresh prince",
    "big daddy kane", "warren g", "tone loc", "vanilla ice", "p diddy",
    "murphy lee", "ludacris", "lil jon", "usher", "pussycat dolls",
    "n.e.r.d", "nerd", "black eyed peas", "bomfunk mc's", "bo mfunk",
    "freestylers", "livin joy", "livin' joy",
]

LATIN_ARTISTS = [
    "ricky martin", "enrique iglesias", "marc anthony", "santana", "shakira",
    "eros ramazzotti", "chayanne", "gloria estefan", "jennifer lopez", "j-lo",
]

# ─── Pop tiebreaker artists (when matched above, override to Pop) ─────────────

POP_TIEBREAKERS = [
    "madonna", "michael jackson", "diana ross", "janet jackson",
    "mariah carey", "whitney houston", "lionel richie", "lionel ritchie",
    "bobby brown", "rupaul", "anastacia", "pink", "britney spears",
    "backstreet boys", "n sync", "nsync", "kylie minogue", "robbie williams",
    "donna summer", "pet shop boys",
]

# ─── Title-based specific rules ───────────────────────────────────────────────

TITLE_RULES = {
    # exact phrases / substrings (lowercased) → genre
    "thunderstruck": "Rock",
    "highway to hell": "Rock",
    "sweet child o' mine": "Rock",
    "sweet child": "Rock",
    "enter sandman": "Rock",
    "lose yourself": "Hip-Hop",
    "blood on the dance floor": "Pop",
    "scream": None,          # handled by artist check (Michael Jackson → Pop)
    "jam": None,             # handled by artist check (Michael Jackson → Pop)
    "the way you make me feel": None,  # handled by artist check (MJ → Pop)
    "somebody to love": "Pop",     # Queen & George Michael → Pop
    "girls on film": "Pop",
    "don't cha": "Pop",
    "pump it": None,  # needs artist disambiguation
    "rock star": None,  # needs artist disambiguation
    "work it": None,   # needs artist disambiguation (Nelly)
    "whenever, wherever": "Latin",
    "whenever wherever": "Latin",
}

# R1/R2 title rules (no artist info available)
R1_R2_RULES = {
    "what is love": "EDM",
    "zombie": "Rock",
    "whoomp": "Hip-Hop",
    "let me show you": "EDM",
    "tribal dance": "EDM",
    "be my lover": "EDM",
    "pump it": "EDM",
    "love and devotion": "EDM",
    "phantom": "EDM",
}


def normalize(s: str) -> str:
    return s.strip().lower()


def artist_genre(artist: str, title: str = ""):
    """Return genre based on artist name, or None if no match."""
    a = normalize(artist)

    # Pop tiebreakers take absolute priority
    for pop in POP_TIEBREAKERS:
        if pop in a:
            return "Pop"

    # Check artist-specific title overrides before general artist match
    t = normalize(title)

    # Jennifer Lopez special cases
    if "jennifer lopez" in a or "j-lo" in a or "j lo" in a:
        if "let's get loud" in t or "lets get loud" in t:
            return "Latin"
        return "Pop"

    # Gloria Estefan special cases
    if "gloria estefan" in a:
        if "oye" in t or "oya" in t:
            return "Latin"
        return "Pop"

    # Shakira: "Whenever Wherever" → Latin, others → Latin (she's a Latin artist)
    if "shakira" in a:
        return "Latin"

    # Check LATIN first (before EDM/HipHop) for remaining artists
    for lat in LATIN_ARTISTS:
        if lat in a:
            return "Latin"

    # Check Rock
    for rock in ROCK_ARTISTS:
        if rock in a:
            return "Rock"

    # Check EDM
    for edm in EDM_ARTISTS:
        if edm in a:
            return "EDM"

    # Check Hip-Hop
    for hh in HIP_HOP_ARTISTS:
        if hh in a:
            return "Hip-Hop"

    return None


def title_genre(title: str, artist: str = "", release: int = 0):
    """Return genre based on title rules."""
    t = normalize(title)
    a = normalize(artist)

    # R1/R2 specific rules
    if release in (1, 2):
        for keyword, genre in R1_R2_RULES.items():
            if keyword in t:
                return genre
        return "Pop"  # R1/R2 default

    # "Pump It" disambiguation
    if "pump it" in t:
        if "black eyed peas" in a:
            return "Hip-Hop"
        return "EDM"  # default for Pump It

    # "Rock Star" disambiguation
    if "rock star" in t:
        if "n.e.r.d" in a or "nerd" in a:
            return "Hip-Hop"

    # "Work It" – Nelly version
    if "work it" in t and "nelly" in a:
        return "Hip-Hop"

    # Michael Jackson titles that are Pop regardless of genre
    mj_titles = [
        "blood on the dance floor", "scream", "the way you make me feel"
    ]
    if any(mj in t for mj in mj_titles) and "michael jackson" in a:
        return "Pop"

    # Jam by Michael Jackson
    if t.strip() == "jam" and "michael jackson" in a:
        return "Pop"

    # Specific title rules
    for keyword, genre in TITLE_RULES.items():
        if genre is not None and keyword in t:
            return genre

    # Whenever Wherever
    if "whenever" in t and ("wherever" in t or "where" in t):
        return "Latin"

    return None


def determine_genre(release: int, title: str, artist: str) -> str:
    """Determine the genre for a track."""
    # R1/R2: no reliable artist data, use title rules
    if release in (1, 2):
        return title_genre(title, artist, release) or "Pop"

    # Step 1: Artist-based lookup (with title for disambiguation)
    if artist.strip():
        ag = artist_genre(artist, title)
        if ag:
            return ag

    # Step 2: Title-based keyword rules
    tg = title_genre(title, artist, release)
    if tg:
        return tg

    # Step 3: Default
    return "Pop"


def main():
    # Read
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    header = rows[0]
    data = rows[1:]

    # Identify column indices
    col = {name.strip(): idx for idx, name in enumerate(header)}
    release_idx = col.get("Release", 0)
    title_idx = col.get("Song Title", 2)
    artist_idx = col.get("Artist", 3)
    genre_idx = col.get("Genre", 6)

    updated = 0
    assignments = []

    for row in data:
        # Pad row if needed
        while len(row) <= genre_idx:
            row.append("")

        # Parse release number
        try:
            release_num = int(str(row[release_idx]).strip())
        except (ValueError, IndexError):
            continue

        # Only process releases 1-59
        if not (1 <= release_num <= 59):
            continue

        title = row[title_idx].strip() if len(row) > title_idx else ""
        artist = row[artist_idx].strip() if len(row) > artist_idx else ""
        current_genre = row[genre_idx].strip() if len(row) > genre_idx else ""

        # Skip if genre already set or title is empty
        if current_genre or not title:
            continue

        genre = determine_genre(release_num, title, artist)
        row[genre_idx] = genre
        updated += 1
        assignments.append((release_num, title, artist, genre))

    # Write back
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(data)

    # Summary
    print(f"\n{'='*60}")
    print(f"Genre fill complete: {updated} rows updated")
    print(f"{'='*60}")

    # Genre distribution
    from collections import Counter
    dist = Counter(g for _, _, _, g in assignments)
    print("\nGenre distribution:")
    for genre, count in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"  {genre:12s}: {count}")

    # Sample: show all assignments grouped by genre
    print(f"\nSample assignments (first 15 per genre):")
    by_genre: dict[str, list] = {}
    for rel, title, artist, genre in assignments:
        by_genre.setdefault(genre, []).append((rel, title, artist))

    for genre in ["Rock", "EDM", "Hip-Hop", "Latin", "Pop"]:
        entries = by_genre.get(genre, [])
        print(f"\n  [{genre}] ({len(entries)} tracks)")
        for rel, title, artist in entries[:15]:
            a_disp = f" [{artist}]" if artist else " [no artist]"
            print(f"    R{rel:02d}  {title[:40]:<40}{a_disp}")

    # Show all non-Pop assignments for review
    print(f"\n--- All non-Pop assignments (for verification) ---")
    for rel, title, artist, genre in sorted(assignments, key=lambda x: (x[3], x[0])):
        if genre != "Pop":
            a_disp = f" [{artist}]" if artist else " [no artist]"
            print(f"  {genre:8s}  R{rel:02d}  {title[:45]:<45}{a_disp}")


if __name__ == "__main__":
    main()
