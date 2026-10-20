import React, { useMemo, useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Select } from '../ui/Select'
import { StepHeading } from '../ui/StepHeading'
import { getRangeReleases } from '../../data/loadPlaylistData'
import { CLASS_FORMATS, COMBO_FIRST_RELEASE } from '../../utils/trackUtils'

export function ReleaseSelector() {
  const { state, actions } = usePlaylist()
  const { releases, latestRelease, isLoading } = usePlaylistData()
  const [isCollapsed, setIsCollapsed] = useState(state.hasSavedCatalog)
  // Reopen the exclusion list for anyone who left releases switched off.
  const [showExclusions, setShowExclusions] = useState(state.excludedReleases.length > 0)

  // The span the range controls cover, before individual exclusions - this is
  // what you get to switch on and off.
  const spanReleases = useMemo(
    () => getRangeReleases({
      releases,
      earliestRelease: state.earliestRelease,
      onlyRecent10: state.onlyRecent10,
      excludeNewest: state.excludeNewest,
      latestRelease
    }),
    [releases, latestRelease, state.earliestRelease, state.onlyRecent10, state.excludeNewest]
  )

  const excludedInSpan = useMemo(
    () => spanReleases.filter((r) => state.excludedReleases.includes(String(r))),
    [spanReleases, state.excludedReleases]
  )

  // Mirrors filterTracks: the releases that actually feed the builder.
  const activeReleases = useMemo(
    () => spanReleases.filter((r) => !state.excludedReleases.includes(String(r))),
    [spanReleases, state.excludedReleases]
  )

  const summary = useMemo(() => {
    const format = state.classFormat === '45' ? '45 min' : '55 min'
    if (activeReleases.length === 0) return `${format} · No releases selected`
    if (activeReleases.length === 1) return `${format} · Release ${activeReleases[0]}`
    const span = `Releases ${activeReleases[0]}\u2013${activeReleases[activeReleases.length - 1]}`
    const releaseText = excludedInSpan.length > 0 ? `${span} (${excludedInSpan.length} excluded)` : span
    return `${format} \u00b7 ${releaseText}`
  }, [activeReleases, excludedInSpan, state.classFormat])

  // Combo tracks only exist from R103 on, so a catalog that stops short of it
  // can't fill the 45-minute slots.
  const comboReleaseCount = useMemo(
    () => activeReleases.filter((r) => {
      const n = parseFloat(r)
      return !isNaN(n) ? n >= COMBO_FIRST_RELEASE : String(r) === 'United'
    }).length,
    [activeReleases]
  )

  if (isLoading) {
    return (
      <div>
        <StepHeading number={1} title="Choose your catalog" />
        <div className="panel p-5 animate-pulse">
          <div className="h-4 bg-ink-100 dark:bg-ink-800 rounded w-1/2 mb-3"></div>
          <div className="h-9 bg-ink-100 dark:bg-ink-800 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        aria-expanded="false"
        aria-controls="catalog-settings"
        className="group w-full flex items-center gap-3 text-left"
      >
        <span
          aria-hidden="true"
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded
                     bg-flare-600 text-white
                     font-display font-black text-base tabular leading-none"
        >
          1
        </span>
        <span className="sr-only">Step 1 of 2: Catalog. </span>
        <span className="text-sm text-ink-700 dark:text-ink-300 tabular">
          {summary}
          <span aria-hidden="true" className="text-ink-300 dark:text-ink-600 mx-1.5">&middot;</span>
          <span className="text-flare-600 group-hover:underline underline-offset-2">Edit</span>
        </span>
        <span className="flex-1 border-t border-ink-200 dark:border-ink-800" />
      </button>
    )
  }

  return (
    <div id="catalog-settings">
      <StepHeading
        number={1}
        title="Choose your catalog"
        hint="Pick the oldest release you own. We'll use everything newer."
      />

      <div className="panel p-5">
        <div className="mb-5">
          <label className="eyebrow block mb-1.5" id="class-format-label">
            Class format
          </label>
          <div
            role="radiogroup"
            aria-labelledby="class-format-label"
            className="inline-flex border border-ink-200 dark:border-ink-800 rounded overflow-hidden"
          >
            {CLASS_FORMATS.map(({ id, label, detail }) => {
              const isActive = state.classFormat === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => actions.setClassFormat(id)}
                  className={`px-3 py-2 text-left transition-colors border-r last:border-r-0 border-ink-200 dark:border-ink-800
                    ${isActive
                      ? 'bg-flare-600 text-white'
                      : 'text-ink-500 dark:text-ink-400 hover:text-ink-950 dark:hover:text-paper'}`}
                >
                  <span className="display-sm text-[11px] block tabular">{label}</span>
                  <span className={`text-[11px] block ${isActive ? 'text-white/80' : 'text-ink-400'}`}>
                    {detail}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1.5">
            {state.classFormat === '45'
              ? 'Triceps/biceps and lunges/shoulders are combo tracks, available from Release 103 on.'
              : 'Separate triceps, biceps, lunges and shoulders tracks.'}
          </p>
          {state.classFormat === '45' && comboReleaseCount === 0 && (
            <p className="text-xs text-flare-600 mt-1.5">
              None of your selected releases have combo tracks. Include Release {COMBO_FIRST_RELEASE} or newer to fill those slots.
            </p>
          )}
        </div>

        <div className="max-w-xs mb-5">
          <label className="eyebrow block mb-1.5">
            Oldest release owned
          </label>
          <Select
            value={state.earliestRelease}
            onChange={actions.setEarliestRelease}
            options={releases}
          />
        </div>

        <div className="space-y-2.5 text-sm border-t border-ink-200 dark:border-ink-800 pt-4">
          <label className="group flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.excludeNewest}
              onChange={(e) => actions.setExcludeNewest(e.target.checked)}
              className="w-4 h-4 accent-flare rounded-none border-ink-300"
            />
            <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
              Exclude newest release <span className="tabular text-ink-400">({latestRelease})</span>
            </span>
          </label>

          <label className="group flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.onlyRecent10}
              onChange={(e) => actions.setOnlyRecent10(e.target.checked)}
              className="w-4 h-4 accent-flare rounded-none border-ink-300"
            />
            <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
              Only use my 10 most recent releases
            </span>
          </label>

          <label className="group flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.searchBothFormats}
              onChange={(e) => actions.setSearchBothFormats(e.target.checked)}
              className="w-4 h-4 accent-flare rounded-none border-ink-300"
            />
            <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
              Search both 55 and 45 min tracks
            </span>
          </label>

          <label className="group flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showExclusions}
              aria-controls="release-exclusions"
              aria-expanded={showExclusions}
              onChange={(e) => {
                setShowExclusions(e.target.checked)
                // Leaving exclusions behind in a closed panel would filter
                // the catalog invisibly.
                if (!e.target.checked) actions.setExcludedReleases([])
              }}
              className="w-4 h-4 accent-flare rounded-none border-ink-300"
            />
            <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
              Exclude certain releases from my results
              {excludedInSpan.length > 0 && (
                <span className="tabular text-ink-400"> ({excludedInSpan.length})</span>
              )}
            </span>
          </label>

          {showExclusions && (
            <div id="release-exclusions" className="pl-[1.625rem] pt-1">
              <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
                {[...spanReleases].reverse().map((release) => {
                  const value = String(release)
                  const isExcluded = state.excludedReleases.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => actions.toggleExcludedRelease(value)}
                      aria-pressed={!isExcluded}
                      aria-label={`${value}${isExcluded ? ' (excluded)' : ''}`}
                      className={`${isExcluded
                        ? 'pill-off line-through opacity-60'
                        : 'pill-on'} tabular min-w-[3rem] justify-center`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-3 mt-2.5">
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {activeReleases.length === 0
                    ? 'Keep at least one release switched on to build a playlist.'
                    : 'Tap a release to switch it off.'}
                </p>
                {excludedInSpan.length > 0 && (
                  <button
                    type="button"
                    onClick={() => actions.setExcludedReleases([])}
                    className="shrink-0 text-[11px] text-flare-600 hover:underline underline-offset-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
          <span className="text-sm text-ink-500 dark:text-ink-400 tabular">{summary}</span>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            disabled={activeReleases.length === 0}
            className="display-sm text-[11px] px-3 py-1.5 rounded bg-ink-950 dark:bg-paper text-paper dark:text-ink-950 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
