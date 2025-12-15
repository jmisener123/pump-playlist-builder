import streamlit as st
import pandas as pd
import random
import base64
import os
import io
import shutil
import hashlib
import unicodedata

def make_track_key(row):
    base = f"{row['Track No#']}_{row['Song Title']}_{row['Artist']}_{row['Release']}"
    return hashlib.md5(base.encode()).hexdigest()

# Page setup
st.set_page_config(page_title="Pump Playlist Builder", page_icon="favicon.png", layout="wide")

# Copy secrets for Render deployment
if os.path.exists("/etc/secrets/secrets.toml"):
    os.makedirs(os.path.expanduser("~/.streamlit"), exist_ok=True)
    shutil.copy("/etc/secrets/secrets.toml", os.path.expanduser("~/.streamlit/secrets.toml"))

# --- Light/Dark mode styling ---
st.markdown("""
    <style>
    .playlist-card {
        background: #f9f9f9 !important;
        color: #22223b !important;
    }
    .playlist-card span.release-number {
        color: #2563eb !important;
        font-weight: bold !important;
    }
    [data-theme="dark"] .playlist-card {
        background: #23272f !important;
        color: #f5f6fa !important;
    }
    [data-theme="dark"] .playlist-card span.release-number {
        color: #4ecdc4 !important;
    }
    </style>
""", unsafe_allow_html=True)

@st.cache_data(ttl=3600)  # Cache for 1 hour
def load_data(encoded_csv: str | None):
    if encoded_csv:
        decoded_bytes = base64.b64decode(encoded_csv)
        # Pass the raw bytes to pandas
        try:
            df = pd.read_csv(io.BytesIO(decoded_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(decoded_bytes), encoding="cp1252")
    else:
        try:
            df = pd.read_csv("BPdata_89_Current.csv", encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv("BPdata_89_Current.csv", encoding="cp1252")

    # --- Sorting key for releases ---
    def sort_key(x):
        if str(x) == "United":
            return 113.5
        try:
            return float(x)
        except:
            return 0

    df["SortKey"] = df["Release"].apply(sort_key)
    df = df.sort_values("SortKey").reset_index(drop=True)

    # --- Clean tags ---
    def clean_tags(tag_str):
        if pd.isna(tag_str) or str(tag_str).strip().lower() in ["nan", "none", "-"]:
            return None
        tags = [t.strip() for t in str(tag_str).split(",") if t.strip()]
        replacements = {"Break-up Songs": "Break-Up Songs", "🌈": "✨"}
        cleaned = [replacements.get(tag, tag) for tag in tags]
        return ", ".join(sorted(set(cleaned))) if cleaned else None

    df["Tags"] = df["Tags"].apply(clean_tags)

    # --- Normalize text fields to fix accent issues ---
    import unicodedata
    for col in ["Song Title", "Artist", "Genre", "Tags"]:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: unicodedata.normalize("NFC", str(x)))

    return df

encoded_csv = st.secrets.get("csv_data")
df = load_data(encoded_csv)

# Track/Tag data
track_types = [
    "1 - Warmup", "2 - Squats", "3 - Chest", "4 - Back", "5 - Triceps",
    "6 - Biceps", "7 - Lunges", "8 - Shoulders", "9 - Core", "10 - Cooldown"
]

tag_emojis = {
    "Halloween": "🎃", "Women of Pop": "👩‍🎤", "Break-Up Songs": "💔",
    "Beast Mode": "💪", "Positive Vibes": "✨", "Sing-Along": "🎤",
    "Emo": "🎸", "P!nk": "💗", "New Year's Eve": "🥳", "Valentine's Day": "💘",
    "Summer": "☀️", "Hard": "💀", "Easy to Learn": "😅",
    "Short (<4:30)": "⏱️", "Long (>6 min)": "⌛"
}

# -------- Helpers --------
def duration_to_sec(dur):
    try:
        m, s = map(int, str(dur).split(":"))
        return m * 60 + s
    except:
        return 0

def apply_search_filter(df, search_term):
    """Apply search filter to dataframe with exact matching and artist name normalization"""
    if not search_term or not search_term.strip():
        return df
    
    search_lower = search_term.lower().strip()
    
    def normalize_for_search(text):
        """Normalize text for better search matching"""
        text = text.lower()
        # Handle common artist name variations
        text = text.replace('p!nk', 'pink')
        text = text.replace('pink', 'p!nk pink')  # Allow both to match
        # Add more normalizations as needed
        return text
    
    def matches_search(row):
        title = str(row.get('Song Title', '')).lower()
        artist = str(row.get('Artist', '')).lower()
        
        # Normalize both search term and data for special character matching
        normalized_search = normalize_for_search(search_lower)
        normalized_title = normalize_for_search(title)
        normalized_artist = normalize_for_search(artist)
        
        # Split search term into individual words for more precise matching
        search_words = [word.strip() for word in search_lower.split() if word.strip()]
        
        # For multi-word searches (like "lady gaga"), require ALL words to be present
        if len(search_words) > 1:
            # Check if all words in the search term are present in title or artist
            title_match = all(word in normalized_title for word in search_words)
            artist_match = all(word in normalized_artist for word in search_words)
            return title_match or artist_match
        else:
            # For single word searches, use the original substring matching
            single_word = search_words[0] if search_words else search_lower
            if (single_word in title or single_word in artist or
                single_word in normalized_title or single_word in normalized_artist):
                return True
        
        return False
    
    return df[df.apply(matches_search, axis=1)]

def render_tags(row):
    tag_html = ""
    if row.get("Tags") not in [None, "-", "nan", "NaN", "None"] and not pd.isna(row.get("Tags")):
        tags = [t.strip() for t in str(row["Tags"]).split(",") if t.strip()]
        for tag in tags:
            emoji = tag_emojis.get(tag, "")
            
            # Map tag names for display (keeps data unchanged)
            display_tag = tag
            if tag == "Hard":
                display_tag = "Hard Workout"
            
            if tag == "Women of Pop":
                pill_color = "#ffd1e7"
            elif tag == "Valentine's Day":
                pill_color = "#ffb6c1"
            elif tag == "Halloween":
                pill_color = "#ffe5b4"
            elif tag == "Beast Mode":
                pill_color = "#b3e0ff"
            elif tag == "Sing-Along":
                pill_color = "#e0c3fc"
            elif tag == "New Year's Eve":
                pill_color = "#b9fbc0"
            elif tag == "Positive Vibes":
                pill_color = "#b9fbc0"
            elif tag == "Hard":
                pill_color = "#7eb8e6"
            elif tag == "Short (<4:30)":
                pill_color = "#c6f6d5"
            elif tag == "Long (>6 min)":
                pill_color = "#e2e8f0"
            else:
                pill_color = "#ffeaa7"
            tag_html += f"<span style='background-color:{pill_color}; color:#222; padding:0.2rem 0.5rem; margin-right:5px; border-radius:10px; font-size:0.8rem'>{emoji} {display_tag}</span>"
    return tag_html

def playlist_copy_export(playlist_df):
    total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
    min_, sec = divmod(total_sec, 60)
    with st.expander("📋 Ready to teach it? Click to get a copy/paste version of your playlist."):
        copy_text = f"Pump Playlist - Total Time: {min_}:{str(sec).zfill(2)}\n"
        for _, row in playlist_df.iterrows():
            copy_text += f"{row['Release']} - {row['Track No#']}: {row['Song Title']} — {row['Artist']} ({row['Duration']})\n"
        st.code(copy_text, language=None)

# ---------------- Headers ----------------
primary_color = "#667eea"
secondary_color = "#4ecdc4"
accent_color = "#ff6b6b"

st.markdown(f"""
    <div class="header-gradient" style="text-align:center; padding:0.7rem 0.5rem 1.2rem 0.5rem;
        background:linear-gradient(135deg, {primary_color}, {secondary_color});
        color:white; border-radius:1rem;">
        <h1 style='margin-bottom:0.5rem;'>🎵 Pump Playlist Builder <span style='pointer-events:none;'>💪</span></h1>
        <p style='margin-top:0;'>Create your perfect Pump class lineup</p>
    </div>
""", unsafe_allow_html=True)

st.markdown(f"""
    <div class="step1-gradient" style="background:linear-gradient(135deg, #ffecd2, {accent_color});
        padding:1.2rem 0.7rem; border-radius:15px; margin-top:1.2rem; margin-bottom:1.2rem;
        box-shadow:0 4px 15px rgba(255,107,107,0.15);">
        <h3 style="color:{primary_color}; margin:0; font-size:1.2rem;">
            Feeling uninspired? Let's get you pumped! 🎵
        </h3>
        <div style='color:#333; font-size:1.05rem; margin-top:0.3rem;'>
            Tell us about your back catalog and we'll help you build the perfect mix.
        </div>
    </div>
""", unsafe_allow_html=True)

# ---------------- Step 1 ----------------
current_release = str(df.loc[df['SortKey'].idxmax(), 'Release'])

st.markdown("### Step 1: What's the earliest release you own?")
avoid_current_release = st.checkbox(
    f"Exclude songs from the newest release ({current_release})", key="avoid_current_release"
)
use_recent = st.checkbox(
    "Use only songs from the 10 most recent releases", key="use_recent"
)
available_releases = df['Release'].astype(str).unique().tolist()
early_release = st.selectbox("Select your earliest release", available_releases, key="early_release")

# ---------------- Step 2 ----------------
st.markdown("### Step 2: Pick your method and build your playlist")
tab1, tab2, tab3 = st.tabs(["🎲 Random", "👻 Theme", "🛠️ Custom/Search"])

# ---------- Tab 1: Random ----------
with tab1:
    st.markdown("Generate a full playlist in one click, totally randomized from your library.")
    if 'random_playlist' not in st.session_state:
        st.session_state['random_playlist'] = None
    if st.button("🎲 Build My Random Playlist", key="build_random"):
        selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
        filtered_df = df[df['SortKey'] >= selected_sort]
        if use_recent:
            top_10 = df['SortKey'].drop_duplicates().nlargest(10)
            filtered_df = filtered_df[filtered_df['SortKey'].isin(top_10)]
        if avoid_current_release:
            filtered_df = filtered_df[filtered_df['Release'].astype(str) != str(current_release)]

        playlist = []
        for track in track_types:
            track_df = filtered_df[filtered_df['Track No#'] == track]
            if not track_df.empty:
                playlist.append(track_df.sample(1))
            else:
                playlist.append(pd.DataFrame([{
                    "Track No#": track, "Song Title": "⚠️ No match found", "Artist": "-",
                    "Release": "-", "Duration": "-", "Genre": "-", "Tags": "-"
                }]))
        st.session_state['random_playlist'] = pd.concat(playlist, ignore_index=True)

    if st.session_state['random_playlist'] is not None:
        playlist_df = st.session_state['random_playlist']
        total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
        min_, sec = divmod(total_sec, 60)
        st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")

        for idx, row in playlist_df.iterrows():
            col1, col2 = st.columns([6, 1])
            with col1:
                st.markdown(f"""
                    <div class="playlist-card" style="padding:1rem;margin-bottom:0.5rem;
                        border-left:5px solid #667eea;border-radius:8px">
                        <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                        <em><span>Release: <span class='release-number'>{row['Release']}</span></span> |
                        Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                        {render_tags(row)}
                    </div>
                """, unsafe_allow_html=True)
            with col2:
                if st.button("Swap for another random track", key=f"swap_random_{idx}"):
                    selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
                    swap_pool = df[(df['SortKey'] >= selected_sort) & (df['Track No#'] == row['Track No#'])]
                    if avoid_current_release:
                        swap_pool = swap_pool[swap_pool['Release'].astype(str) != str(current_release)]
                    swap_pool = swap_pool[swap_pool['Song Title'] != row['Song Title']]
                    if not swap_pool.empty:
                        new_row = swap_pool.sample(1).iloc[0]
                        for col in playlist_df.columns:
                            playlist_df.at[idx, col] = new_row[col]
                        st.session_state['random_playlist'] = playlist_df
                        st.rerun()

        st.session_state['random_playlist'] = playlist_df
        playlist_copy_export(playlist_df)

# ---------- Tab 2: Theme ----------
with tab2:
    st.markdown("Mix and match themes (like Halloween or Positive Vibes), track difficulty, song length, and genres to create your perfect playlist!")
    st.markdown("*💡 All filters are optional - pick just one or combine multiple!*")

    # Separate theme tags from instructor tags
    all_tags = sorted(set(tag.strip() for tags in df['Tags'].dropna() for tag in tags.split(',') if tag.strip()))
    
    theme_tags = ["Beast Mode", "Break-Up Songs", "Emo", "Halloween", "New Year's Eve", "P!nk", 
                  "Positive Vibes", "Sing-Along", "Summer", "Valentine's Day", "Women of Pop"]
    instructor_tags = ["Easy to Learn", "Hard", "Short (<4:30)", "Long (>6 min)"]
    
    # Filter available tags to only show those that exist in the data
    available_theme_tags = [tag for tag in theme_tags if tag in all_tags]
    available_instructor_tags = [tag for tag in instructor_tags if tag in all_tags]
    
    # Create display options with emojis
    theme_display_options = [f"{tag_emojis.get(tag, '')} {tag}" for tag in available_theme_tags]
    instructor_display_options = []
    for tag in available_instructor_tags:
        display_tag = "Hard Workout" if tag == "Hard" else tag
        instructor_display_options.append(f"{tag_emojis.get(tag, '')} {display_tag}")
    
    col1, col2 = st.columns(2)
    with col1:
        selected_theme_display = st.multiselect("Theme tags", options=theme_display_options, key="theme_tags", placeholder="Select themes")
        # Convert back to original tag names
        selected_theme_tags = [option.split(' ', 1)[1] for option in selected_theme_display]
    with col2:
        selected_instructor_display = st.multiselect("Difficulty & Length", options=instructor_display_options, key="instructor_tags", placeholder="Select details")
        # Convert back to original tag names (handling "Hard Workout" -> "Hard")
        selected_instructor_tags = []
        for option in selected_instructor_display:
            tag_name = option.split(' ', 1)[1]  # Remove emoji
            if tag_name == "Hard Workout":
                selected_instructor_tags.append("Hard")
            else:
                selected_instructor_tags.append(tag_name)
    
    # Combine both tag types for filtering
    selected_tags = selected_theme_tags + selected_instructor_tags
    
    available_genres = sorted(df['Genre'].dropna().unique().tolist())
    selected_genres = st.multiselect("Genres", options=available_genres, key="theme_genres", placeholder="Select genres")

    if 'theme_playlist' not in st.session_state:
        st.session_state['theme_playlist'] = None

    if st.button("👻 Build My Themed Playlist", key="build_theme"):
        # Clear used partial tracks when building a new playlist
        st.session_state['used_partial_tracks'] = set()
        selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
        release_filtered_df = df[df['SortKey'] >= selected_sort]
        if use_recent:
            top_10 = df['SortKey'].drop_duplicates().nlargest(10)
            release_filtered_df = release_filtered_df[release_filtered_df['SortKey'].isin(top_10)]
        if avoid_current_release:
            release_filtered_df = release_filtered_df[release_filtered_df['Release'].astype(str) != str(current_release)]

        filtered_df = release_filtered_df.copy()
        if selected_theme_tags or selected_instructor_tags:
            def has_matching_tags(tag_str):
                if pd.isna(tag_str) or tag_str in ["", "None", None]:
                    return False
                track_tags = [t.strip() for t in str(tag_str).split(",") if t.strip()]
                
                # Check if track has at least one theme tag (if any theme tags selected)
                has_theme_tag = True
                if selected_theme_tags:
                    has_theme_tag = any(tag in track_tags for tag in selected_theme_tags)
                
                # Check if track has at least one instructor tag (if any instructor tags selected)
                has_instructor_tag = True
                if selected_instructor_tags:
                    has_instructor_tag = any(tag in track_tags for tag in selected_instructor_tags)
                
                # Track must have both types if both are selected, or just the selected type
                return has_theme_tag and has_instructor_tag
            
            filtered_df = filtered_df[filtered_df['Tags'].apply(has_matching_tags)]
        if selected_genres:
            filtered_df = filtered_df[filtered_df['Genre'].isin(selected_genres)]

        playlist = []
        used_tracks = set()  # Track which themed tracks we've already used
        
        # Initialize used partial tracks in session state
        if 'used_partial_tracks' not in st.session_state:
            st.session_state['used_partial_tracks'] = set()
        
        for track in track_types:
            track_df = filtered_df[filtered_df['Track No#'] == track]
            if not track_df.empty:
                # Filter out tracks we've already used
                available_tracks = track_df[~track_df['Song Title'].isin(used_tracks)]
                if not available_tracks.empty:
                    selected_track = available_tracks.sample(1)
                    used_tracks.add(selected_track.iloc[0]['Song Title'])
                    playlist.append(selected_track)
                else:
                    # No unused themed tracks for this position
                    playlist.append(pd.DataFrame([{
                        "Track No#": track, "Song Title": "⚠️ No themed track available", "Artist": "-",
                        "Release": "-", "Duration": "-", "Genre": "-", "Tags": "-"
                    }]))
            else:
                # If no themed tracks for this position, show "no themed track available"
                # Don't reassign tracks from other positions as it breaks workout structure
                playlist.append(pd.DataFrame([{
                    "Track No#": track, "Song Title": "⚠️ No themed track available", "Artist": "-",
                    "Release": "-", "Duration": "-", "Genre": "-", "Tags": "-"
                }]))
        st.session_state['theme_playlist'] = pd.concat(playlist, ignore_index=True)

    if st.session_state.get('theme_playlist') is not None:
        playlist_df = st.session_state['theme_playlist']
        total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
        min_, sec = divmod(total_sec, 60)
        st.markdown(f"### 🕒 Total Duration: **{min_}:{str(sec).zfill(2)}**")

        for idx, row in playlist_df.iterrows():
            col1, col2 = st.columns([6, 2])
            with col1:
                st.markdown(f"""
                    <div class="playlist-card" style="padding:1rem;margin-bottom:0.5rem;
                        border-left:5px solid #667eea;border-radius:8px">
                        <strong>{row['Track No#']} - {row['Song Title']}</strong> by {row['Artist']}<br>
                        <em><span>Release: <span class='release-number'>{row['Release']}</span></span> |
                        Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                        {render_tags(row)}
                    </div>
                """, unsafe_allow_html=True)
            with col2:
                # Check if this is a "no themed track available" slot
                if row['Song Title'] == "⚠️ No themed track available":
                    st.markdown("**No themed track available**")
                    
                    # Create options for partial matches
                    col_a, col_b = st.columns(2)
                    
                    with col_a:
                        if st.button("🎲 Random track", key=f"slot_random_{idx}"):
                            # Get a completely random track for this position
                            selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
                            random_pool = df[(df['SortKey'] >= selected_sort) & (df['Track No#'] == row['Track No#'])]
                            if use_recent:
                                top_10 = df['SortKey'].drop_duplicates().nlargest(10)
                                random_pool = random_pool[random_pool['SortKey'].isin(top_10)]
                            if avoid_current_release:
                                random_pool = random_pool[random_pool['Release'].astype(str) != str(current_release)]
                            
                            if not random_pool.empty:
                                new_row = random_pool.sample(1).iloc[0]
                                for col in playlist_df.columns:
                                    playlist_df.at[idx, col] = new_row[col]
                                st.rerun()
                    
                    with col_b:
                        # Check if we have any partial matches (tracks that match at least one tag)
                        if selected_theme_tags or selected_instructor_tags:
                            selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
                            partial_pool = df[(df['SortKey'] >= selected_sort) & (df['Track No#'] == row['Track No#'])]
                            if use_recent:
                                top_10 = df['SortKey'].drop_duplicates().nlargest(10)
                                partial_pool = partial_pool[partial_pool['SortKey'].isin(top_10)]
                            if avoid_current_release:
                                partial_pool = partial_pool[partial_pool['Release'].astype(str) != str(current_release)]
                            
                            # Filter for tracks that match at least one tag (OR logic)
                            def has_any_matching_tag(tag_str):
                                if pd.isna(tag_str) or tag_str in ["", "None", None]:
                                    return False
                                track_tags = [t.strip() for t in str(tag_str).split(",") if t.strip()]
                                all_selected_tags = selected_theme_tags + selected_instructor_tags
                                return any(tag in track_tags for tag in all_selected_tags)
                            
                            partial_pool = partial_pool[partial_pool['Tags'].apply(has_any_matching_tag)]
                            
                            # Filter out tracks we've already used for partial matches
                            unused_partial_pool = partial_pool[~partial_pool['Song Title'].isin(st.session_state['used_partial_tracks'])]
                            
                            if not unused_partial_pool.empty:
                                if st.button("🎯 Partial match", key=f"slot_partial_{idx}"):
                                    new_row = unused_partial_pool.sample(1).iloc[0]
                                    st.session_state['used_partial_tracks'].add(new_row['Song Title'])
                                    for col in playlist_df.columns:
                                        playlist_df.at[idx, col] = new_row[col]
                                    st.rerun()
                            elif not partial_pool.empty:
                                # All partial matches have been used, reset and start over
                                if st.button("🎯 Reset partial matches", key=f"slot_reset_{idx}"):
                                    st.session_state['used_partial_tracks'].clear()
                                    new_row = partial_pool.sample(1).iloc[0]
                                    st.session_state['used_partial_tracks'].add(new_row['Song Title'])
                                    for col in playlist_df.columns:
                                        playlist_df.at[idx, col] = new_row[col]
                                    st.rerun()
                            else:
                                st.button("🎯 No partial matches", key=f"slot_none_{idx}", disabled=True)
                        else:
                            st.button("🎯 No tags selected", key=f"slot_none_{idx}", disabled=True)
                else:
                    # Recreate the filtered data for swap options
                    selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
                    release_filtered_df = df[df['SortKey'] >= selected_sort]
                    if use_recent:
                        top_10 = df['SortKey'].drop_duplicates().nlargest(10)
                        release_filtered_df = release_filtered_df[release_filtered_df['SortKey'].isin(top_10)]
                    if avoid_current_release:
                        release_filtered_df = release_filtered_df[release_filtered_df['Release'].astype(str) != str(current_release)]

                    # Apply theme/genre filters
                    swap_filtered_df = release_filtered_df.copy()
                    if selected_theme_tags or selected_instructor_tags:
                        def has_matching_tags(tag_str):
                            if pd.isna(tag_str) or tag_str in ["", "None", None]:
                                return False
                            track_tags = [t.strip() for t in str(tag_str).split(",") if t.strip()]
                            
                            # Check if track has at least one theme tag (if any theme tags selected)
                            has_theme_tag = True
                            if selected_theme_tags:
                                has_theme_tag = any(tag in track_tags for tag in selected_theme_tags)
                            
                            # Check if track has at least one instructor tag (if any instructor tags selected)
                            has_instructor_tag = True
                            if selected_instructor_tags:
                                has_instructor_tag = any(tag in track_tags for tag in selected_instructor_tags)
                            
                            # Track must have both types if both are selected, or just the selected type
                            return has_theme_tag and has_instructor_tag
                        
                        swap_filtered_df = swap_filtered_df[swap_filtered_df['Tags'].apply(has_matching_tags)]
                    if selected_genres:
                        swap_filtered_df = swap_filtered_df[swap_filtered_df['Genre'].isin(selected_genres)]

                    swap_pool = swap_filtered_df[swap_filtered_df['Track No#'] == row['Track No#']]
                    swap_pool = swap_pool[swap_pool['Song Title'] != row['Song Title']]

                    num_options = len(swap_pool)
                    option_word = "option" if num_options == 1 else "options"

                    if num_options > 0:
                        swap_label = f"Swap {row['Track No#']} ({num_options} other tracks with your theme)"
                        options = [f"[{r['Release']}] {r['Song Title']} by {r['Artist']}" for _, r in swap_pool.iterrows()]
                        current_track = f"[{row['Release']}] {row['Song Title']} by {row['Artist']}"
                        
                        # Add current track to the beginning of options if not already there
                        if current_track not in options:
                            options = [current_track] + options
                        
                        # Initialize session state for this selectbox if not exists
                        if f"theme_swap_select_{idx}" not in st.session_state:
                            st.session_state[f"theme_swap_select_{idx}"] = current_track
                        
                        selected_option = st.selectbox(
                            swap_label,
                            options,
                            index=options.index(st.session_state[f"theme_swap_select_{idx}"]) if st.session_state[f"theme_swap_select_{idx}"] in options else 0,
                            key=f"theme_swap_select_{idx}"
                        )
                        
                        # Check if selection changed and update playlist
                        if selected_option != current_track:
                            new_title = selected_option.split("] ", 1)[1].rsplit(" by ", 1)[0]
                            new_row = swap_pool[swap_pool['Song Title'] == new_title].iloc[0]
                            for col in playlist_df.columns:
                                playlist_df.at[idx, col] = new_row[col]
                            st.session_state['theme_playlist'] = playlist_df
                            st.rerun()
                        
                    else:
                        st.button("No alternatives", key=f"theme_no_options_{idx}", disabled=True)


        st.session_state['theme_playlist'] = playlist_df
        playlist_copy_export(playlist_df)

# ---------- Tab 3: Custom ----------
with tab3:
    st.markdown("Browse all your available options for each track and build your playlist manually.")
    
    # Create two columns: left for search, right for playlist builder
    search_col, playlist_col = st.columns([1, 1])
    
    # Initialize manual selection in session state if not exists
    if 'manual_selection' not in st.session_state:
        st.session_state['manual_selection'] = {}
    
    selected_sort = df[df['Release'].astype(str) == str(early_release)]['SortKey'].iloc[0]
    filtered_df = df[df['SortKey'] >= selected_sort]
    if use_recent:
        top_10 = df['SortKey'].drop_duplicates().nlargest(10)
        filtered_df = filtered_df[filtered_df['SortKey'].isin(top_10)]
    if avoid_current_release:
        filtered_df = filtered_df[filtered_df['Release'].astype(str) != str(current_release)]

    # Left column: Search functionality
    with search_col:
        st.markdown("### 🔍 Search & Browse")
        
        # Add search bar
        search_term = st.text_input("Search by song title or artist", 
                                   placeholder="Type to search...", 
                                   key="custom_search",
                                   help="Search for songs by title or artist name. Uses exact text matching for precise results.")
        
        # Apply search filter if search term is provided
        if search_term and search_term.strip():
            search_results = apply_search_filter(filtered_df, search_term)
            
            # Show search results if there's a search term
            if not search_results.empty:
                st.markdown(f"**Found {len(search_results)} tracks matching '{search_term}'**")
                
                # Display search results grouped by track type
                for track_type in track_types:
                    track_results = search_results[search_results['Track No#'] == track_type]
                    if not track_results.empty:
                        with st.expander(f"{track_type} ({len(track_results)} matches)", expanded=True):
                            for idx, row in track_results.iterrows():
                                col1, col2 = st.columns([3, 1])
                                with col1:
                                    st.markdown(f"""
                                        <div class="playlist-card" style="padding:0.8rem;margin-bottom:0.4rem;
                                            border-left:4px solid #667eea;border-radius:6px; font-size:0.9rem;">
                                            <strong>{row['Song Title']}</strong> by {row['Artist']}<br>
                                            <em>Release: <span class='release-number'>{row['Release']}</span> | 
                                            Duration: {row['Duration']} | Genre: {row['Genre']}</em><br>
                                            {render_tags(row)}
                                        </div>
                                    """, unsafe_allow_html=True)
                                with col2:
                                    # Add button to add this track to the playlist
                                    track_key = make_track_key(row)
                                    if st.button("➕", key=f"add_search_{track_key}", 
                                               help=f"Add this track to the {track_type} position"):
                                        st.session_state['manual_selection'][track_type] = row
                                        st.success(f"✅ Added to {track_type}!")
                                        st.rerun()
            else:
                st.markdown("**🔍 No results found**")
                st.info(f"No tracks found matching '{search_term}'. Try different keywords, check your spelling, or try searching for partial words.")
        else:
            st.info("Enter a search term above to find specific tracks, or use the playlist builder on the right to browse all available options.")

    # Right column: Manual playlist builder
    with playlist_col:
        st.markdown("### 🛠️ Build Your Custom Playlist")
        st.markdown("See all your available options for each track:")

        # Use the full filtered_df for dropdowns (not search results)
        display_filtered_df = filtered_df
        if search_term and search_term.strip():
            # Reset display_filtered_df to full filtered set for dropdowns
            display_filtered_df = df[df['SortKey'] >= selected_sort]
            if use_recent:
                top_10 = df['SortKey'].drop_duplicates().nlargest(10)
                display_filtered_df = display_filtered_df[display_filtered_df['SortKey'].isin(top_10)]
            if avoid_current_release:
                display_filtered_df = display_filtered_df[display_filtered_df['Release'].astype(str) != str(current_release)]

        for track in track_types:
            track_df = display_filtered_df[display_filtered_df['Track No#'] == track]
            
            col1, col2 = st.columns([3, 1])
            with col1:
                if not track_df.empty:
                    display_names = [f"[{row['Release']}] {row['Song Title']} by {row['Artist']}" for _, row in track_df.iterrows()]
                    
                    # Determine current selection index
                    current_selection = 0
                    
                    # Check if there's a forced reset (from clear button)
                    reset_key = f"reset_{track}"
                    if reset_key in st.session_state and st.session_state[reset_key]:
                        current_selection = 0
                        st.session_state[reset_key] = False  # Reset the flag
                    elif track in st.session_state.get('manual_selection', {}):
                        # Try to find the current selection in the dropdown
                        selected_row = st.session_state['manual_selection'][track]
                        try:
                            for i, (_, row) in enumerate(track_df.iterrows()):
                                if (row['Song Title'] == selected_row['Song Title'] and 
                                    row['Artist'] == selected_row['Artist'] and 
                                    str(row['Release']) == str(selected_row['Release'])):
                                    current_selection = i
                                    break
                        except:
                            current_selection = 0
                    
                    selected_idx = st.selectbox(
                        track, 
                        range(len(display_names)),
                        format_func=lambda x: display_names[x],
                        index=current_selection,
                        key=f"manual_{track}"
                    )
                    
                    # Update session state with the selected track
                    chosen_row = track_df.iloc[selected_idx]
                    st.session_state['manual_selection'][track] = chosen_row
                else:
                    st.selectbox(track, ["⚠️ No tracks available"], key=f"manual_{track}")
                    st.session_state['manual_selection'][track] = pd.Series({
                        "Track No#": track, "Song Title": "⚠️ No match found", "Artist": "-",
                        "Release": "-", "Duration": "-", "Genre": "-", "Tags": "-"
                    })
            
            with col2:
                # Clear selection button
                if st.button("🗑️", key=f"clear_{track}", help=f"Reset to first option"):
                    # Set flag to reset this track's selection
                    st.session_state[f"reset_{track}"] = True
                    st.rerun()

        # Build final playlist from session state
        manual_selection = st.session_state.get('manual_selection', {})
        playlist_rows = []
        for track in track_types:
            if track in manual_selection:
                playlist_rows.append(manual_selection[track])
            else:
                # Default to first available track or empty
                track_df = display_filtered_df[display_filtered_df['Track No#'] == track]
                if not track_df.empty:
                    playlist_rows.append(track_df.iloc[0])
                else:
                    playlist_rows.append(pd.Series({
                        "Track No#": track, "Song Title": "⚠️ No match found", "Artist": "-",
                        "Release": "-", "Duration": "-", "Genre": "-", "Tags": "-"
                    }))

        playlist_df = pd.DataFrame(playlist_rows)
        st.session_state['custom_playlist'] = playlist_df
        
        # Show playlist summary and export
        total_sec = playlist_df['Duration'].apply(duration_to_sec).sum()
        min_, sec = divmod(total_sec, 60)
        st.markdown(f"**🕒 Total Duration: {min_}:{str(sec).zfill(2)}**")
        
        playlist_copy_export(playlist_df)

# ---------------- Footer ----------------
st.markdown("---")
st.markdown(f"""
    <div style="text-align:center; padding:1rem; color:#666; font-size:0.9rem; font-style:italic;">
        <strong>Disclaimer:</strong> This tool was created by a certified BodyPump instructor as a personal project.<br>
        It is <strong>not affiliated with, endorsed by, or associated with Les Mills or the BodyPump program</strong>.
    </div>
""", unsafe_allow_html=True)
st.markdown("""
    <div style="text-align:center; padding:0.5rem;">
        <a href="https://github.com/jmisener123/pump-playlist-builder/" target="_blank" style="color:#2563eb; font-size:0.8rem; text-decoration:underline;">GitHub</a>
    </div>
""", unsafe_allow_html=True)
