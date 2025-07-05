import streamlit as st
import pandas as pd
import random
from streamlit import empty
import base64
from io import StringIO
import os
import io

# You can optionally load these from Streamlit secrets or env vars

st.set_page_config(page_title="Pump Playlist Builder", layout="wide")

import os
import shutil

# Copy Render's mounted secret file to where Streamlit expects it
if os.path.exists("/etc/secrets/secrets.toml"):
    os.makedirs(os.path.expanduser("~/.streamlit"), exist_ok=True)
    shutil.copy("/etc/secrets/secrets.toml", os.path.expanduser("~/.streamlit/secrets.toml"))

# Force light mode
st.markdown(
    """
    <style>
    html, body, [data-testid="stAppViewContainer"] {
        color-scheme: light !important;
        background-color: white !important;
        color: black !important;
    }

    .stMarkdown, .stText, .stDataFrame {
        color: black !important;
    }

    .css-1cpxqw2 {
        color: black !important;
    }
    </style>
    """,
    unsafe_allow_html=True
)
# Load and clean the data
@st.cache_data
def load_data():
    if "csv_data" in st.secrets:
        encoded = st.secrets["csv_data"]
        decoded = base64.b64decode(encoded)
        df = pd.read_csv(io.StringIO(decoded.decode("utf-8")))
    else:
        df = pd.read_csv("BPdata_89_Current.csv")  # fallback for local dev

    def sort_key(x):
        if x == "United":
            return 113.5
        try:
            return float(x)
        except:
            return 0

    df['SortKey'] = df['Release'].apply(sort_key)
    df = df[df['SortKey'] >= 89].sort_values("SortKey").reset_index(drop=True)

    def clean_tags(tag_str):
        if pd.isna(tag_str):
            return tag_str
        tags = [t.strip() for t in tag_str.split(',')]
        replacements = {
            "Break-up Songs": "Break-Up Songs",
            "🌈": "✨"
        }
        cleaned = []
        for tag in tags:
            for k, v in replacements.items():
                if tag == k:
                    tag = v
            cleaned.append(tag)
        return ', '.join(sorted(set(cleaned)))

    df['Tags'] = df['Tags'].apply(clean_tags)

    return df

df = load_data()

# Extract tag options
def extract_tags(df):
    tags = set()
    for entry in df['Tags'].dropna():
        for tag in str(entry).split(','):
            tag = tag.strip()
            if tag:
                tags.add(tag)
    return sorted(tags)

# Track list
track_types = [
    "1 - Warmup", "2 - Squats", "3 - Chest", "4 - Back", "5 - Triceps",
    "6 - Biceps", "7 - Lunges", "8 - Shoulders", "9 - Core", "10 - Cooldown"
]

# Emojis for tags - mapped to common BodyPump themes
tag_emojis = {
    "Halloween": "🎃",
    "Women of Pop": "👩‍🎤",
    "Break-Up Songs": "💔",
    "Beast Mode": "💪",
    "Positive Vibes": "✨",
    "Sing-Along": "🎤",
    "Emo": "🎸",
    "P!nk": "💗",
    "New Year's Eve": "🥳",
    "Valentine's Day": "💘",
    "Summer": "☀️",
    "Hard": "💀",
    "Easy to Learn": "😅"
}

# Harmonized color palette
primary_color = "#667eea"  # blue-violet
accent_color = "#ff6b6b"   # coral red
secondary_color = "#4ecdc4"  # teal
background_color = "#f8f9fa"  # very light gray
text_color = "#22223b"  # dark blue-gray

# Tag pill colors (alternate between two harmonious colors)
tag_colors = ["#ffeaa7", "#a5b4fc"]  # soft yellow, light blue-violet

# Special color mapping for specific tags (optional, but harmonized)
special_tag_colors = {
    "P!nk": "#ff69b4",  # hot pink for P!nk
    "Women of Pop": "#ffb6c1"  # light pink for Women of Pop
}

# UI: Header with tooltip styles
st.markdown(f"""
    <style>
    .tooltip {{
        position: relative;
        display: inline-block;
        cursor: help;
    }}
    .tooltip .tooltiptext {{
        visibility: hidden;
        width: 200px;
        background-color: {primary_color};
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 5px 8px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 12px;
    }}
    .tooltip .tooltiptext::after {{
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: {primary_color} transparent transparent transparent;
    }}
    .tooltip:hover .tooltiptext {{
        visibility: visible;
        opacity: 1;
    }}
    </style>
    <div style="text-align:center; padding:2rem; background:linear-gradient(135deg, {primary_color}, {secondary_color}); color:white; border-radius:1rem;">
        <h1>🎵 Pump Playlist Builder <span style='pointer-events:none; text-decoration:none;'>💪</span></h1>
        <p>Create your perfect Pump class lineup</p>
    </div>
""", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Settings section at the top
st.markdown(f"""
    <div style="background:linear-gradient(135deg, #ffecd2, {accent_color}); padding:2rem; border-radius:15px; margin-bottom:2rem; box-shadow:0 4px 15px rgba(255,107,107,0.15);">
        <h3 style="color:{primary_color}; margin-top:0; font-size:1.4rem;">Feeling uninspired? Let's get you pumped!</h3>
        <p style="color:{text_color}; margin-bottom:1rem; font-size:1.1rem;">Tell us about your back catalog so we can create the perfect mix. 🎶</p>
    </div>
""", unsafe_allow_html=True)

# Settings row: make selectbox and checkbox perfectly aligned in a single row
st.markdown("""
    <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem;">
        <label for="release-selectbox" style="font-size:1.2rem; font-weight:bold; margin-bottom:0;">What's the earliest release you have?</label>
        <div id="release-selectbox" style="flex:1;"></div>
        <div id="recent-checkbox" style="display:flex; align-items:center; gap:0.5rem;"></div>
    </div>
""", unsafe_allow_html=True)

release_placeholder = st.empty()
checkbox_placeholder = st.empty()

with release_placeholder:
    available_releases = df['Release'].unique().tolist()
    early_release = st.selectbox("", available_releases, key="global_release", help="Only releases from this point forward will be included in your playlists")
with checkbox_placeholder:
    use_recent = st.checkbox("10 most recent releases only", key="global_recent", help="Limit song selection to only the most recent 10 Pump releases")

# Add friendly scroll message
st.markdown('<div style="text-align:center; font-size:1.2rem; color:#667eea; margin-bottom:1.5rem;">⬇️ <strong>Scroll down to build your playlist!</strong> ⬇️</div>', unsafe_allow_html=True)

st.markdown("<hr>", unsafe_allow_html=True)

# Two main sections for playlist types
col_left, col_right = st.columns(2, gap="large")

with col_left:
    st.markdown(f"""
        <div style="background:linear-gradient(135deg, #e3eafe 10%, #e6fcfa 90%); padding:2rem; border-radius:16px; border-left:8px solid {accent_color}; margin-bottom:2rem; box-shadow:0 8px 32px rgba(102,126,234,0.12); color: #111;">
            <h3 style="color:#111; margin-top:0; font-size:2rem; font-weight:800; letter-spacing:1px;">🎲 Build a Random Playlist</h3>
            <p style="color:#111; margin-bottom:1rem; font-size:1.15rem;">Mix it up with tracks from the releases you own.</p>
        </div>
    """, unsafe_allow_html=True)
    
    generate_random = st.button("🎲 Build My Random Playlist", type="primary", use_container_width=True)
    # Add scroll message after button
    st.markdown('<div style="text-align:center; font-size:1.1rem; color:#667eea; margin-bottom:1rem;">⬇️ Scroll down to see your playlist ⬇️</div>', unsafe_allow_html=True)

with col_right:
    st.markdown(f"""
        <div style="background:linear-gradient(135deg, #e6fcfa 10%, #e3eafe 90%); padding:2rem; border-radius:16px; border-left:8px solid {accent_color}; margin-bottom:2rem; box-shadow:0 8px 32px rgba(78,205,196,0.12); color: #111;">
            <h3 style="color:#111; margin-top:0; font-size:2rem; font-weight:800; letter-spacing:1px;">👻 Build a Theme Playlist</h3>
            <p style="color:#111; margin-bottom:1rem; font-size:1.15rem;">From Halloween to heartbreak, find songs that fit your vibe.</p>
        </div>
    """, unsafe_allow_html=True)
    
    available_tags = extract_tags(df)
    # Build a mapping from tag name to emoji label
    tag_label_map = {tag: f"{tag_emojis.get(tag, '')} {tag}".strip() for tag in available_tags}
    label_to_tag = {v: k for k, v in tag_label_map.items()}
    tag_labels = [tag_label_map[tag] for tag in available_tags]

    selected_tag_labels = st.multiselect(
        "Choose a theme (optional)",
        options=tag_labels,
        help="Choose one or more tags to create a themed playlist (e.g., Halloween, Rock, Break-Up Songs)"
    )
    selected_tags = [label_to_tag[label] for label in selected_tag_labels]
    
    # Genre filtering - now independent
    available_genres = sorted(df['Genre'].dropna().unique().tolist())
    selected_genres = st.multiselect("Or choose one or more genres (optional)", options=available_genres, key="genre_filter", help="Filter by specific music genres - can be used alone or with tags")
    
    # Button is enabled if either tags OR genres are selected
    generate_tags = st.button("👻 Build My Themed Playlist", type="secondary", use_container_width=True, disabled=(len(selected_tags)==0 and len(selected_genres)==0))

st.markdown("<hr>", unsafe_allow_html=True)

# Determine which mode to use
playlist_mode = None
if generate_random:
    playlist_mode = "random"
    working_tags = []
    working_genres = []
elif generate_tags and (selected_tags or selected_genres):
    playlist_mode = "tags"
    working_tags = selected_tags
    working_genres = selected_genres
elif 'playlist_df' not in st.session_state:
    # Show instructions on first load
    st.markdown("""
        <div style="text-align:center; padding:2rem; background:#f8f9fa; border-radius:10px; margin:2rem 0;">
            <h4 style="color:#666;">Choose how you want to build your playlist above</h4>
            <p style="color:#888;">First, set your release preferences. Then, choose <strong>Random Playlist</strong> for a totally random mix, or <strong>Theme Playlist</strong> for playlists based on a specific vibe</p>
        </div>
    """, unsafe_allow_html=True)

# Generate playlist if a button was clicked
if playlist_mode:
    # Filter data based on global settings
    selected_sort = df[df['Release'] == early_release]['SortKey'].iloc[0]

    if use_recent:
        top_10 = df['SortKey'].drop_duplicates().nlargest(10)
        filtered_df = df[df['SortKey'].isin(top_10)]
    else:
        filtered_df = df.copy()

    eligible_df = filtered_df[filtered_df['SortKey'] >= selected_sort]

    # Apply tag filtering if tags are selected
    if working_tags:
        eligible_df = eligible_df[eligible_df['Tags'].apply(
            lambda x: any(tag in str(x) for tag in working_tags)
        )]
    
    # Apply genre filtering if genres are selected
    if working_genres:
        eligible_df = eligible_df[eligible_df['Genre'].isin(working_genres)]

    # Build playlist
    playlist = []

    for track in track_types:
        track_df = eligible_df[eligible_df['Track No#'] == track]
        # Additional filtering for the specific track (keeping existing logic)
        if working_tags:
            tag_filtered = track_df[track_df['Tags'].apply(
                lambda x: any(tag in str(x) for tag in working_tags)
            )]
            if not tag_filtered.empty:
                track_df = tag_filtered
        if not track_df.empty:
            playlist.append(track_df.sample(1))
        else:
            playlist.append(pd.DataFrame([{
                "Track No#": track,
                "Song Title": "⚠️ No match found",
                "Artist": "-",
                "Release": "-",
                "Duration": "-",
                "Genre": "-",
                "Tags": "-"
            }]))

    playlist_df = pd.concat(playlist, ignore_index=True)
    st.session_state.playlist_df = playlist_df
    st.session_state.eligible_df = eligible_df
    st.session_state.working_tags = working_tags
    st.session_state.working_genres = working_genres
    st.session_state.playlist_mode = playlist_mode

# Display playlist if it exists
if 'playlist_df' in st.session_state:
    playlist_df = st.session_state.playlist_df
    eligible_df = st.session_state.eligible_df
    working_tags = st.session_state.working_tags
    working_genres = st.session_state.get('working_genres', [])
    current_mode = st.session_state.get('playlist_mode', 'random')
    
    # Display playlist
    def duration_to_sec(dur):
        try:
            m, s = map(int, str(dur).split(":"))
            return m * 60 + s
        except:
            return 0

    total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
    min_, sec = divmod(total_sec, 60)
    
    # Mode indicator - updated to handle genre-only themes
    filter_parts = []
    if working_tags:
        filter_parts.append(f"Tags: {', '.join(working_tags)}")
    if working_genres:
        filter_parts.append(f"Genres: {', '.join(working_genres)}")
    
    if filter_parts:
        filter_text = " | ".join(filter_parts)
        mode_text = f"👻 Theme Playlist ({filter_text})"
    else:
        mode_text = "🎲 Random Playlist"
    
    st.markdown(f"### {mode_text}")
    st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")

    # Create a consistent color mapping for tags
    all_unique_tags = set()
    for _, row in playlist_df.iterrows():
        if not pd.isna(row.get("Tags")) and row['Tags'] != "-":
            tags = [t.strip() for t in row["Tags"].split(',') if t.strip()]
            all_unique_tags.update(tags)
    
    tag_color_map = {}
    for i, tag in enumerate(sorted(all_unique_tags)):
        # Check if tag has a special color assignment
        if tag in special_tag_colors:
            tag_color_map[tag] = special_tag_colors[tag]
        else:
            tag_color_map[tag] = tag_colors[i % len(tag_colors)]

    for i, row in playlist_df.iterrows():
        col1, col2 = st.columns([6, 1])  # Make col2 smaller for the button
        tag_html = ""
        tags = []
        if not pd.isna(row.get("Tags")) and row['Tags'] != "-":
            tags = [t.strip() for t in row["Tags"].split(',') if t.strip()]
        for j, tag in enumerate(tags):
            emoji = tag_emojis.get(tag, "")
            color = special_tag_colors.get(tag, tag_colors[j % len(tag_colors)])
            tag_html += f"<span style='background-color:{color}; color:{text_color}; padding:0.2rem 0.5rem; margin-right:5px; border-radius:10px; font-size:0.8rem'>{emoji} {tag}</span>"

        with col1:
            st.markdown(f"""
                <div style="background:#f9f9f9;padding:1rem;margin-bottom:0.5rem;border-left:5px solid #667eea;border-radius:8px">
                    <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                    <em><span title="Release number">Release: <strong style="color:#667eea">{row['Release']}</strong></span> | Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                    {tag_html}
                </div>
            """, unsafe_allow_html=True)

        # Add swap button for random playlist mode
        if current_mode == "random" and row['Release'] != "-":
            if col2.button("🎲 Swap Track", key=f"swap_{i}", help="Swap in a new random track for this slot"):
                # Find eligible tracks for this slot, excluding the current one
                eligible_tracks = eligible_df[
                    (eligible_df['Track No#'] == row['Track No#']) &
                    (eligible_df['Song Title'] != row['Song Title'])
                ]
                if not eligible_tracks.empty:
                    new_row = eligible_tracks.sample(1).iloc[0]
                    playlist_df.loc[i] = new_row
                    st.session_state.playlist_df = playlist_df
                    st.rerun()

        # Show dropdown for themed playlists (tags OR genres) if multiple alternatives exist
        if current_mode == "tags" and row['Release'] != "-":
            track_matches = eligible_df[eligible_df['Track No#'] == row['Track No#']]
            # Apply the same filtering that was used to create the eligible_df
            if working_tags:
                track_matches = track_matches[track_matches['Tags'].apply(
                    lambda x: any(tag in str(x) for tag in working_tags)
                )]
            if working_genres:
                track_matches = track_matches[track_matches['Genre'].isin(working_genres)]
            if len(track_matches) > 1:
                # Create options with release numbers and artist names
                options = []
                for _, match_row in track_matches.iterrows():
                    option_text = f"{match_row['Song Title']} by {match_row['Artist']} ({match_row['Release']})"
                    options.append(option_text)
                
                current_selection = f"{row['Song Title']} by {row['Artist']} (Release {row['Release']})"
                n_options = len(track_matches)
                option_label = "option" if n_options == 1 else "options"
                selected_option = col2.selectbox(
                    f"🔁 {n_options} {option_label} available for {row['Track No#']}",
                    options,
                    index=options.index(current_selection) if current_selection in options else 0,
                    key=f"alt_{i}"
                )
                
                # Find the corresponding row based on the selected option
                selected_song_title = selected_option.split(" by ")[0]
                chosen_row = track_matches[track_matches['Song Title'] == selected_song_title].iloc[0]
                
                # Check if the selection has changed
                if (row['Song Title'] != chosen_row['Song Title'] or 
                    row['Artist'] != chosen_row['Artist'] or 
                    row['Release'] != chosen_row['Release']):
                    playlist_df.loc[i] = chosen_row
                    st.session_state.playlist_df = playlist_df
                    st.rerun()  # Force a rerun to update the display immediately

    # Copy/paste version
    with st.expander("📋 Copy/Paste Version"):
        copy_text = f"Pump Playlist - Total Time: {min_}:{str(sec).zfill(2)}\n"
        for _, row in playlist_df.iterrows():
            copy_text += f"{row['Release']} - {row['Track No#']}: {row['Song Title']} — {row['Artist']} ({row['Duration']})\n"
        st.code(copy_text, language=None)

# Add footer disclaimer
st.markdown("<br><br>", unsafe_allow_html=True)
st.markdown("---")
st.markdown("""
    <div style="text-align:center; padding:1rem; color:#666; font-size:0.9rem; font-style:italic;">
        <strong>Disclaimer:</strong> This tool was created by a certified BodyPump instructor as a personal project. 
        It is <strong>not affiliated with, endorsed by, or associated with Les Mills or the BodyPump program</strong>. 
        All references to BodyPump are for informational and educational use only.
    </div>
""", unsafe_allow_html=True)