# pumpplaylist.py - Final merged version with design + tab functionality

import streamlit as st
import pandas as pd
import random
import base64
from io import StringIO
import os
import io
import shutil
import hashlib

def make_track_key(row):
    base = f"{row['Track No#']}_{row['Song Title']}_{row['Artist']}_{row['Release']}"
    return hashlib.md5(base.encode()).hexdigest()

# Page setup
st.set_page_config(page_title="Pump Playlist Builder", page_icon="favicon.png", layout="wide")

# Copy secrets for Render deployment
if os.path.exists("/etc/secrets/secrets.toml"):
    os.makedirs(os.path.expanduser("~/.streamlit"), exist_ok=True)
    shutil.copy("/etc/secrets/secrets.toml", os.path.expanduser("~/.streamlit/secrets.toml"))

# --- Light mode and styling ---
st.markdown("""
    <style>
    html, body, [data-testid="stAppViewContainer"] {{
        color-scheme: light !important;
        background-color: white !important;
        color: black !important;
    }}
    .stButton > button {{
        background-color: #f0f0f0 !important;
        color: black !important;
        border: 1px solid #ccc !important;
        border-radius: 6px !important;
        padding: 0.5rem 1rem !important;
        transition: all 0.2s ease-in-out;
    }}
    .stButton > button:hover {{
        background-color: #e0e0e0 !important;
        border-color: #aaa !important;
    }}
    /* Reduce top whitespace for mobile */
    @media (max-width: 600px) {{
        .header-gradient {{
            padding-top: 0.4rem !important;
            padding-bottom: 0.7rem !important;
        }}
        .step1-gradient {{
            padding-top: 0.5rem !important;
            padding-bottom: 0.7rem !important;
        }}
    }}
    /* --- DARK MODE FIXES --- */
    [data-theme="dark"] body, [data-theme="dark"] [data-testid="stAppViewContainer"] {{
        background-color: #18191a !important;
        color: #f5f6fa !important;
    }}
    [data-theme="dark"] .playlist-card {{
        background: #23272f !important;
        color: #f5f6fa !important;
    }}
    [data-theme="dark"] .playlist-card strong, [data-theme="dark"] .playlist-card em, [data-theme="dark"] .playlist-card span, [data-theme="dark"] .playlist-card div {{
        color: #f5f6fa !important;
    }}
    [data-theme="dark"] .playlist-card a {{
        color: #7eb8e6 !important;
    }}
    /* Light mode for playlist card */
    .playlist-card {{
        background: #f9f9f9 !important;
        color: #22223b !important;
    }}
    .playlist-card strong, .playlist-card em, .playlist-card span, .playlist-card div {{
        color: #22223b !important;
    }}
    .playlist-card a {{
        color: #2563eb !important;
    }}
    /* Place release number color rules at the end for highest specificity */
    .playlist-card span.release-number {
        color: #2563eb !important;
        font-weight: bold !important;
    }
    [data-theme="dark"] .playlist-card span.release-number {
        color: #4ecdc4 !important;
        font-weight: bold !important;
    }
    </style>
""", unsafe_allow_html=True)

# UI header
primary_color = "#667eea"
secondary_color = "#4ecdc4"
accent_color = "#ff6b6b"
text_color = "#22223b"

st.markdown(f"""
    <div class="header-gradient" style="text-align:center; padding:0.7rem 0.5rem 1.2rem 0.5rem; background:linear-gradient(135deg, {primary_color}, {secondary_color}); color:white; border-radius:1rem;">
        <h1 style='margin-bottom:0.5rem;'>🎵 Pump Playlist Builder <span style='pointer-events:none;'>💪</span></h1>
        <p style='margin-top:0;'>Create your perfect Pump class lineup</p>
    </div>
""", unsafe_allow_html=True)

# Load data
@st.cache_data
def load_data():
    try:
        encoded = st.secrets["csv_data"]
        decoded = base64.b64decode(encoded)
        df = pd.read_csv(io.StringIO(decoded.decode("utf-8")))
    except Exception:
        df = pd.read_csv("BPdata_89_Current.csv")

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
        replacements = {"Break-up Songs": "Break-Up Songs", "🌈": "✨"}
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

# Track/Tag data
track_types = [
    "1 - Warmup", "2 - Squats", "3 - Chest", "4 - Back", "5 - Triceps",
    "6 - Biceps", "7 - Lunges", "8 - Shoulders", "9 - Core", "10 - Cooldown"
]

tag_emojis = {
    "Halloween": "🎃", "Women of Pop": "👩‍🎤", "Break-Up Songs": "💔",
    "Beast Mode": "💪", "Positive Vibes": "✨", "Sing-Along": "🎤",
    "Emo": "🎸", "P!nk": "💗", "New Year's Eve": "🥳", "Valentine's Day": "💘",
    "Summer": "☀️", "Hard": "💀", "Easy to Learn": "😅"
}

# Extract tags
def extract_tags(df):
    tags = set()
    for entry in df['Tags'].dropna():
        for tag in str(entry).split(','):
            tag = tag.strip()
            if tag:
                tags.add(tag)
    return sorted(tags)

# Duration parser
def duration_to_sec(dur):
    try:
        m, s = map(int, str(dur).split(":"))
        return m * 60 + s
    except:
        return 0

# Playlist display
def display_playlist(playlist_df):
    total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
    min_, sec = divmod(total_sec, 60)
    st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")

    for _, row in playlist_df.iterrows():
        tag_html = ""
        tags = []
        if not pd.isna(row.get("Tags")) and row['Tags'] != "-":
            tags = [t.strip() for t in row["Tags"].split(',') if t.strip()]
        for j, tag in enumerate(tags):
            emoji = tag_emojis.get(tag, "")
            # Custom pill colors
            if tag == "Women of Pop":
                pill_color = "#ffd1e7"  # pale pink
            elif tag == "Valentine's Day":
                pill_color = "#ffb6c1"  # different pink
            elif tag == "Halloween":
                pill_color = "#ffe5b4"  # light orange
            elif tag == "Beast Mode":
                pill_color = "#b3e0ff"  # light blue
            elif tag == "Sing-Along":
                pill_color = "#e0c3fc"  # light purple
            elif tag == "New Year's Eve":
                pill_color = "#b9fbc0"  # light green
            elif tag == "Positive Vibes":
                pill_color = "#b9fbc0"  # light green
            elif tag == "Hard":
                pill_color = "#7eb8e6"  # slightly darker blue
            else:
                pill_color = "#ffeaa7"  # default
            tag_html += f"<span style='background-color:{pill_color}; color:#222; padding:0.2rem 0.5rem; margin-right:5px; border-radius:10px; font-size:0.8rem'>{emoji} {tag}</span>"

        st.markdown(f"""
            <div class="playlist-card" style="padding:1rem;margin-bottom:0.5rem;border-left:5px solid #667eea;border-radius:8px">
                <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                <em><span>Release: <span class='release-number' style='font-size:1.1em'>{row['Release']}</span></span> | Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                {tag_html}
            </div>
        """, unsafe_allow_html=True)

    with st.expander("📋 Ready to teach it? Click to get a copy/paste version of your playlist."):
        copy_text = f"Pump Playlist - Total Time: {min_}:{str(sec).zfill(2)}\n"
        for _, row in playlist_df.iterrows():
            copy_text += f"**{row['Release']}** - {row['Track No#']}: {row['Song Title']} — {row['Artist']} ({row['Duration']})\n"
        st.code(copy_text, language=None)

# 1. Add a helper function for copy/paste export

def playlist_copy_export(playlist_df):
    total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
    min_, sec = divmod(total_sec, 60)
    with st.expander("📋 Ready to teach it? Click to get a copy/paste version of your playlist."):
        copy_text = f"Pump Playlist - Total Time: {min_}:{str(sec).zfill(2)}\n"
        for _, row in playlist_df.iterrows():
            copy_text += f"{row['Release']} - {row['Track No#']}: {row['Song Title']} — {row['Artist']} ({row['Duration']})\n"
        st.code(copy_text, language=None)

# Step 1 UI
st.markdown(f"""
    <div class="step1-gradient" style="background:linear-gradient(135deg, #ffecd2, {accent_color}); padding:1.2rem 0.7rem 1.2rem 0.7rem; border-radius:15px; margin-top:1.2rem; margin-bottom:1.2rem; box-shadow:0 4px 15px rgba(255,107,107,0.15);">
        <h3 style="color:{primary_color}; margin-top:0; font-size:1.2rem;">Feeling uninspired? Let's get you pumped! 🎵</h3>
        <div style='color:#333; font-size:1.05rem; margin-top:0.3rem; margin-bottom:0.2rem;'>Tell us about your back catalog and we'll help you build the perfect mix.</div>
    </div>
""", unsafe_allow_html=True)
st.markdown("### Step 1: What's the earliest release you own?")

available_releases = df['Release'].unique().tolist()
early_release = st.selectbox("Select below, then move to Step 2", available_releases)
use_recent = st.checkbox("Use only the 10 most recent releases")

# Step 2 UI
st.markdown("### Step 2: Pick your method and build your playlist")
tab1, tab2, tab3 = st.tabs(["🎲 Random", "👻 Theme", "🛠️ Custom"])

playlist_df = None

# Tab 1: Random
with tab1:
    st.markdown("Generate a full playlist in one click, totally randomized from your library.")
    if 'random_playlist' not in st.session_state:
        st.session_state['random_playlist'] = None
    generate_random = st.button("🎲 Build My Random Playlist")
    if generate_random:
        selected_sort = df[df['Release'] == early_release]['SortKey'].iloc[0]
        filtered_df = df[df['SortKey'] >= selected_sort]
        if use_recent:
            top_10 = df['SortKey'].drop_duplicates().nlargest(10)
            filtered_df = filtered_df[filtered_df['SortKey'].isin(top_10)]

        playlist = []
        for track in track_types:
            track_df = filtered_df[filtered_df['Track No#'] == track]
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
        st.session_state['random_playlist'] = pd.concat(playlist, ignore_index=True)

    if st.session_state['random_playlist'] is not None:
        total_sec = st.session_state['random_playlist']['Duration'].apply(duration_to_sec).sum()
        min_, sec = divmod(total_sec, 60)
        st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")
        for idx, row in st.session_state['random_playlist'].iterrows():
            col1, col2 = st.columns([6,1])
            with col1:
                tag_html = ""
                tags = []
                if not pd.isna(row.get("Tags")) and row['Tags'] != "-":
                    tags = [t.strip() for t in row["Tags"].split(',') if t.strip()]
                for j, tag in enumerate(tags):
                    emoji = tag_emojis.get(tag, "")
                    # Custom pill colors
                    if tag == "Women of Pop":
                        pill_color = "#ffd1e7"  # pale pink
                    elif tag == "Valentine's Day":
                        pill_color = "#ffb6c1"  # different pink
                    elif tag == "Halloween":
                        pill_color = "#ffe5b4"  # light orange
                    elif tag == "Beast Mode":
                        pill_color = "#b3e0ff"  # light blue
                    elif tag == "Sing-Along":
                        pill_color = "#e0c3fc"  # light purple
                    elif tag == "New Year's Eve":
                        pill_color = "#b9fbc0"  # light green
                    elif tag == "Positive Vibes":
                        pill_color = "#b9fbc0"  # light green
                    elif tag == "Hard":
                        pill_color = "#7eb8e6"  # slightly darker blue
                    else:
                        pill_color = "#ffeaa7"  # default
                    tag_html += f"<span style='background-color:{pill_color}; color:#222; padding:0.2rem 0.5rem; margin-right:5px; border-radius:10px; font-size:0.8rem'>{emoji} {tag}</span>"
                st.markdown(f"""
                    <div class="playlist-card" style="padding:1rem;margin-bottom:0.5rem;border-left:5px solid #667eea;border-radius:8px">
                        <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                        <em><span>Release: <span class='release-number' style='font-size:1.1em'>{row['Release']}</span></span> | Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                        {tag_html}
                    </div>
                """, unsafe_allow_html=True)
            with col2:
                if st.button("Swap Track", key=f"swap_{idx}"):
                    selected_sort = df[df['Release'] == early_release]['SortKey'].iloc[0]
                    filtered_df = df[df['SortKey'] >= selected_sort]
                    if use_recent:
                        top_10 = df['SortKey'].drop_duplicates().nlargest(10)
                        filtered_df = filtered_df[filtered_df['SortKey'].isin(top_10)]
                    track_df = filtered_df[filtered_df['Track No#'] == row['Track No#']]
                    if not track_df.empty:
                        # Exclude current song
                        track_df = track_df[track_df['Song Title'] != row['Song Title']]
                        if not track_df.empty:
                            new_row = track_df.sample(1).iloc[0]
                            for col in st.session_state['random_playlist'].columns:
                                st.session_state['random_playlist'].at[idx, col] = new_row[col]
        playlist_copy_export(st.session_state['random_playlist'])

# Tab 2: Theme
with tab2:
    st.markdown("From Halloween to heartbreak, choose a theme or genre to fit your vibe.")
    available_tags = extract_tags(df)
    tag_label_map = {tag: f"{tag_emojis.get(tag, '')} {tag}".strip() for tag in available_tags}
    label_to_tag = {v: k for k, v in tag_label_map.items()}
    tag_labels = [tag_label_map[tag] for tag in available_tags]

    selected_tag_labels = st.multiselect("Choose theme tags (optional)", tag_labels)
    selected_tags = [label_to_tag[label] for label in selected_tag_labels]

    available_genres = sorted(df['Genre'].dropna().unique().tolist())
    selected_genres = st.multiselect("Or choose genres (optional)", options=available_genres)

    generate_tags = st.button("👻 Build My Themed Playlist", disabled=(len(selected_tags) == 0 and len(selected_genres) == 0))
    
    if 'theme_playlist' not in st.session_state:
        st.session_state['theme_playlist'] = None
    if 'theme_filtered_df' not in st.session_state:
        st.session_state['theme_filtered_df'] = None
    
    if generate_tags:
        selected_sort = df[df['Release'] == early_release]['SortKey'].iloc[0]
        release_filtered_df = df[df['SortKey'] >= selected_sort]
        if use_recent:
            top_10 = df['SortKey'].drop_duplicates().nlargest(10)
            release_filtered_df = release_filtered_df[release_filtered_df['SortKey'].isin(top_10)]
        filtered_df = release_filtered_df.copy()
        if selected_tags:
            filtered_df = filtered_df[filtered_df['Tags'].apply(lambda x: any(tag in str(x) for tag in selected_tags))]
        if selected_genres:
            filtered_df = filtered_df[filtered_df['Genre'].isin(selected_genres)]
        playlist = []
        random_fallbacks = []
        for track in track_types:
            track_df = filtered_df[filtered_df['Track No#'] == track]
            if not track_df.empty:
                playlist.append(track_df.sample(1))
            else:
                # Fallback: slot in a random track of that category from release_filtered_df (earliest release and forward, not filtered by tags/genres)
                fallback_df = release_filtered_df[release_filtered_df['Track No#'] == track]
                if not fallback_df.empty:
                    playlist.append(fallback_df.sample(1))
                    random_fallbacks.append(track)
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
        st.session_state['theme_playlist'] = pd.concat(playlist, ignore_index=True)
        st.session_state['theme_filtered_df'] = filtered_df.copy()
        st.session_state['theme_random_fallbacks'] = random_fallbacks

    # Display playlist if it exists
    if st.session_state['theme_playlist'] is not None:
        playlist_df = st.session_state['theme_playlist']
        filtered_df = st.session_state.get('theme_filtered_df', df)
        random_fallbacks = st.session_state.get('theme_random_fallbacks', [])
        if random_fallbacks:
            st.warning(f"No tagged track found for: {', '.join(random_fallbacks)}. A random track of that category was slotted in.")
        
        total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
        min_, sec = divmod(total_sec, 60)
        st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")
        
        for i, row in playlist_df.iterrows():
            track_no = row['Track No#']
            options_df = filtered_df[filtered_df['Track No#'] == track_no]
            muscle_group = track_no.split(' - ', 1)[1] if ' - ' in track_no else track_no
            col1, col2 = st.columns([6,2])
            with col1:
                tag_html = ""
                tags = []
                if not pd.isna(row.get("Tags")) and row['Tags'] != "-":
                    tags = [t.strip() for t in row["Tags"].split(',') if t.strip()]
                for j, tag in enumerate(tags):
                    emoji = tag_emojis.get(tag, "")
                    # Custom pill colors
                    if tag == "Women of Pop":
                        pill_color = "#ffd1e7"  # pale pink
                    elif tag == "Valentine's Day":
                        pill_color = "#ffb6c1"  # different pink
                    elif tag == "Halloween":
                        pill_color = "#ffe5b4"  # light orange
                    elif tag == "Beast Mode":
                        pill_color = "#b3e0ff"  # light blue
                    elif tag == "Sing-Along":
                        pill_color = "#e0c3fc"  # light purple
                    elif tag == "New Year's Eve":
                        pill_color = "#b9fbc0"  # light green
                    elif tag == "Positive Vibes":
                        pill_color = "#b9fbc0"  # light green
                    elif tag == "Hard":
                        pill_color = "#7eb8e6"  # slightly darker blue
                    else:
                        pill_color = "#ffeaa7"  # default
                    tag_html += f"<span style='background-color:{pill_color}; color:#222; padding:0.2rem 0.5rem; margin-right:5px; border-radius:10px; font-size:0.8rem'>{emoji} {tag}</span>"
                st.markdown(f"""
                    <div class="playlist-card" style="padding:1rem;margin-bottom:0.5rem;border-left:5px solid #667eea;border-radius:8px">
                        <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                        <em><span>Release: <span class='release-number' style='font-size:1.1em'>{row['Release']}</span></span> | Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                        {tag_html}
                    </div>
                """, unsafe_allow_html=True)
            with col2:
                # If this track was a random fallback, show a swap button for a new random track
                if random_fallbacks and track_no in random_fallbacks:
                    fallback_pool = release_filtered_df[(release_filtered_df['Track No#'] == track_no) & (release_filtered_df['Song Title'] != row['Song Title'])]
                    swap_label = f"Swap {muscle_group} for new random track"
                    swap_button_key = f"theme_fallback_swap_btn_{i}"
                    if not fallback_pool.empty:
                        if st.button(swap_label, key=swap_button_key):
                            new_row = fallback_pool.sample(1).iloc[0]
                            for col in playlist_df.columns:
                                st.session_state['theme_playlist'].at[i, col] = new_row[col]
                            st.rerun()
                    else:
                        st.button(f"No alternatives", key=swap_button_key, disabled=True)
                else:
                    # Existing swap logic for tagged tracks
                    swap_options_df = options_df[
                        (options_df['Song Title'] != row['Song Title']) | 
                        (options_df['Artist'] != row['Artist']) | 
                        (options_df['Release'].astype(str) != str(row['Release']))
                    ]
                    num_options = len(swap_options_df)
                    option_word = 'option' if num_options == 1 else 'options'
                    swap_label = f"Swap {muscle_group} ({num_options} {option_word})"
                    swap_button_key = f"theme_swap_btn_{i}"
                    if num_options > 0:
                        if st.button(swap_label, key=swap_button_key):
                            new_row = swap_options_df.sample(1).iloc[0]
                            for col in playlist_df.columns:
                                st.session_state['theme_playlist'].at[i, col] = new_row[col]
                            st.rerun()
                    else:
                        st.button(f"No alternatives", key=swap_button_key, disabled=True)
        playlist_copy_export(playlist_df)

# Tab 3: Custom
with tab3:
    st.markdown("Browse all your available options for each track and build your playlist manually.")
    manual_selection = {}
    selected_sort = df[df['Release'] == early_release]['SortKey'].iloc[0]
    if use_recent:
        top_10 = df['SortKey'].drop_duplicates().nlargest(10)
        filtered_df = df[df['SortKey'].isin(top_10)]
    else:
        filtered_df = df.copy()

    eligible_df = filtered_df[filtered_df['SortKey'] >= selected_sort]

    for track in track_types:
        track_df = eligible_df[eligible_df['Track No#'] == track]
        if not track_df.empty:
            display_names = [f"[{row['Release']}] {row['Song Title']} by {row['Artist']}" for _, row in track_df.iterrows()]
            selected_display = st.selectbox(track, display_names, key=f"manual_{track}")
            # Extract song title robustly
            try:
                after_bracket = selected_display.split(']', 1)[1].strip()
                selected_song_title = after_bracket.rsplit(' by ', 1)[0]
            except Exception:
                selected_song_title = None
            match = track_df[track_df['Song Title'] == selected_song_title]
            if match.shape[0] > 0:
                chosen_row = match.iloc[0]
                manual_selection[track] = chosen_row
            else:
                manual_selection[track] = pd.Series({
                    "Track No#": track,
                    "Song Title": "⚠️ No match found",
                    "Artist": "-",
                    "Release": "-",
                    "Duration": "-",
                    "Genre": "-",
                    "Tags": "-"
                })
        else:
            manual_selection[track] = pd.Series({
                "Track No#": track,
                "Song Title": "⚠️ No match found",
                "Artist": "-",
                "Release": "-",
                "Duration": "-",
                "Genre": "-",
                "Tags": "-"
            })

    playlist_df = pd.DataFrame(manual_selection.values())
    playlist_copy_export(playlist_df)

# Footer
st.markdown("<br><br>", unsafe_allow_html=True)
st.markdown("---")
st.markdown(f"""
    <div style="text-align:center; padding:1rem; color:#666; font-size:0.9rem; font-style:italic;">
        <strong>Disclaimer:</strong> This tool was created by a certified BodyPump instructor as a personal project.<br>
        It is <strong>not affiliated with, endorsed by, or associated with Les Mills or the BodyPump program</strong>.
    </div>
""", unsafe_allow_html=True)
