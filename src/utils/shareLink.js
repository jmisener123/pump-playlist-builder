import { getTrackTypes, getSlotTrackTypes } from './trackUtils'

/**
 * Playlists travel as a URL so instructors can drop one into a group chat or
 * a Facebook thread. Tracks are stored by release and slot rather than by
 * title, which keeps the link short enough to paste and lets the recipient's
 * copy pick up any later data corrections.
 */
export const SHARE_PARAM = 'p'
const THEME_PARAM = 'th'
const INSTRUCTOR_PARAM = 'it'
const GENRE_PARAM = 'g'

const VERSION_CODES = { Bonus: 'b', Alt: 'a' }
const VERSION_NAMES = { b: 'Bonus', a: 'Alt' }

const SLOT_SEPARATOR = '~'
const FIELD_SEPARATOR = '.'

const clean = (value) => String(value ?? '').trim()

const identityKey = (release, trackType, version) => [clean(release), clean(trackType), clean(version)].join('|')

/**
 * Release, slot and version don't pin down a track on their own: a handful of
 * early releases ship two tracks in the same slot. Group them so a link can
 * carry the position within the group when it needs to.
 */
function groupByIdentity(tracks) {
  const groups = new Map()
  tracks.forEach(track => {
    const key = identityKey(track.Release, track['Track No#'], track.Version)
    const group = groups.get(key)
    if (group) group.push(track)
    else groups.set(key, [track])
  })
  return groups
}

/**
 * One slot as `release`, or with as many of `.altIndex.version.duplicate` as
 * it takes to be unambiguous. The slot's position carries its track type, so
 * only a deviation from the default type (the 45-minute Functional Strength
 * alternates) needs encoding.
 */
function encodeSlot(track, slotType, format, groups) {
  if (!track) return ''
  const altIndex = getSlotTrackTypes(slotType, format).indexOf(track['Track No#'])
  const version = VERSION_CODES[track.Version] || ''
  const group = groups.get(identityKey(track.Release, track['Track No#'], track.Version)) || []
  const duplicate = group.length > 1
    ? Math.max(0, group.findIndex(t => t['Song Title'] === track['Song Title']))
    : 0
  const fields = [
    clean(track.Release),
    altIndex > 0 ? String(altIndex) : '',
    version,
    duplicate > 0 ? String(duplicate) : ''
  ]
  while (fields.length > 1 && fields[fields.length - 1] === '') fields.pop()
  return fields.join(FIELD_SEPARATOR)
}

function decodeSlot(encoded, slotType, format, groups) {
  if (!encoded) return null
  const [release, altIndex = '', version = '', duplicate = ''] = encoded.split(FIELD_SEPARATOR)
  if (!release) return null
  const trackType = getSlotTrackTypes(slotType, format)[Number(altIndex) || 0]
  if (!trackType) return null
  const group = groups.get(identityKey(release, trackType, VERSION_NAMES[version] || ''))
  if (!group) return null
  return group[Number(duplicate) || 0] || group[0] || null
}

export function encodePlaylist(playlist, format, tracks) {
  const groups = groupByIdentity(tracks)
  const types = getTrackTypes(format)
  const slots = types.map((slotType, i) => encodeSlot(playlist[i], slotType, format, groups))
  if (slots.every(slot => slot === '')) return ''
  return [format, ...slots].join(SLOT_SEPARATOR)
}

/**
 * Rebuild a shared playlist against the catalog. Returns null when the
 * parameter is unusable, so a mangled link falls back to a normal visit
 * rather than an empty-looking app.
 */
export function decodePlaylist(encoded, tracks) {
  if (!encoded) return null
  const [format, ...slots] = encoded.split(SLOT_SEPARATOR)
  const classFormat = format === '45' ? '45' : format === '55' ? '55' : null
  if (!classFormat || slots.length === 0) return null

  const groups = groupByIdentity(tracks)
  const types = getTrackTypes(classFormat)
  const playlist = types.map((slotType, i) => decodeSlot(slots[i], slotType, classFormat, groups))
  if (playlist.every(track => track === null)) return null
  return { classFormat, playlist }
}

const splitList = (value) => (value ? value.split(',').map(s => s.trim()).filter(Boolean) : [])

/**
 * The full link, including the theme the playlist was built around so the
 * recipient lands with the same suggestions on tap.
 */
export function buildShareUrl({ playlist, classFormat, tracks, themeTags = [], instructorTags = [], selectedGenres = [] }) {
  const encoded = encodePlaylist(playlist, classFormat, tracks)
  if (!encoded) return ''
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set(SHARE_PARAM, encoded)
  if (themeTags.length) url.searchParams.set(THEME_PARAM, themeTags.join(','))
  if (instructorTags.length) url.searchParams.set(INSTRUCTOR_PARAM, instructorTags.join(','))
  if (selectedGenres.length) url.searchParams.set(GENRE_PARAM, selectedGenres.join(','))
  return url.toString()
}

export function readShareParams(search = window.location.search) {
  const params = new URLSearchParams(search)
  const encoded = params.get(SHARE_PARAM)
  if (!encoded) return null
  return {
    encoded,
    themeTags: splitList(params.get(THEME_PARAM)),
    instructorTags: splitList(params.get(INSTRUCTOR_PARAM)),
    selectedGenres: splitList(params.get(GENRE_PARAM))
  }
}

/**
 * Drop the share parameters once imported, so editing the playlist and
 * refreshing keeps your changes instead of reloading the original.
 */
export function clearShareParams() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(SHARE_PARAM)) return
  ;[SHARE_PARAM, THEME_PARAM, INSTRUCTOR_PARAM, GENRE_PARAM].forEach(p => url.searchParams.delete(p))
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}
