import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'

export function TabNavigation() {
  const { state, actions } = usePlaylist()

  const tabs = [
    { id: 'quick', label: '🎲 Quick Generate', description: 'Random or themed playlist' }
  ]

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => actions.setActiveTab(tab.id)}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative
            ${state.activeTab === tab.id
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }
          `}
        >
          <span className="text-lg">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
