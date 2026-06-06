/**
 * Professional Icon System for PaperIQ
 * Replaces WhatsApp-style emojis with consistent, professional icons
 * All icons use Material Symbols with consistent styling
 */

import React from 'react'

export type IconName =
  // Dashboard & Navigation
  | 'dashboard'
  | 'analytics'
  | 'library_books'
  | 'person'
  | 'settings'
  | 'search'
  | 'menu'
  | 'close'
  | 'arrow_right'
  | 'arrow_left'
  | 'chevron_right'
  | 'chevron_left'
  | 'home'
  | 'rocket'
  
  // Analysis & Data
  | 'trending_up'
  | 'trending_down'
  | 'insights'
  | 'data_usage'
  | 'bar_chart'
  | 'pie_chart'
  | 'assessment'
  | 'timeline'
  | 'priority'
  | 'target'
  | 'bullseye'
  
  // Education & Learning
  | 'school'
  | 'book'
  | 'auto_stories'
  | 'menu_book'
  | 'library'
  | 'subject'
  | 'assignment'
  | 'quiz'
  | 'fact_check'
  | 'grading'
  | 'workspace_premium'
  | 'emoji_events'
  
  // Actions & Status
  | 'add'
  | 'edit'
  | 'delete'
  | 'download'
  | 'upload'
  | 'save'
  | 'refresh'
  | 'filter_list'
  | 'sort'
  | 'visibility'
  | 'visibility_off'
  | 'lock'
  | 'lock_open'
  | 'verified'
  | 'warning'
  | 'error'
  | 'info'
  | 'check_circle'
  | 'cancel'
  
  // UI & Navigation
  | 'notifications'
  | 'help'
  | 'feedback'
  | 'share'
  | 'link'
  | 'open_in_new'
  | 'fullscreen'
  | 'fullscreen_exit'
  | 'expand_more'
  | 'expand_less'
  | 'more_vert'
  | 'more_horiz'
  
  // Time & Schedule
  | 'schedule'
  | 'calendar_today'
  | 'event'
  | 'alarm'
  | 'timer'
  | 'history'
  | 'update'
  
  // Communication
  | 'mail'
  | 'chat'
  | 'forum'
  | 'comment'
  | 'support'
  
  // Files & Content
  | 'folder'
  | 'folder_open'
  | 'description'
  | 'article'
  | 'note'
  | 'note_add'
  | 'attachment'
  | 'cloud'
  | 'cloud_upload'
  | 'cloud_download'
  
  // Performance & Achievement
  | 'speed'
  | 'bolt'
  | 'flash_on'
  | 'star'
  | 'star_half'
  | 'star_border'
  | 'workspace_premium'
  | 'military_tech'
  | 'emoji_events'
  
  // User & Account
  | 'account_circle'
  | 'person_add'
  | 'group'
  | 'logout'
  | 'login'
  | 'security'
  
  // Status Indicators
  | 'circle'
  | 'radio_button_unchecked'
  | 'radio_button_checked'
  | 'check_box'
  | 'check_box_outline_blank'
  | 'toggle_on'
  | 'toggle_off'

export interface IconProps {
  /** Icon name from Material Symbols */
  name: IconName
  /** Size in pixels (default: 24) */
  size?: number
  /** Color class (e.g., 'text-primary', 'text-on-surface') */
  color?: string
  /** Additional CSS classes */
  className?: string
  /** Whether the icon should be filled (default: false for outlined, true for filled) */
  filled?: boolean
  /** Weight: 100, 200, 300, 400, 500, 600, 700 (default: 400) */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
  /** Grade: -25, 0, 200 (default: 0) */
  grade?: -25 | 0 | 200
  /** Optical size: 20, 24, 40, 48 (default: 24) */
  opticalSize?: 20 | 24 | 40 | 48
  /** Click handler */
  onClick?: () => void
  /** Accessibility label */
  ariaLabel?: string
}

/**
 * Professional Icon Component
 * Uses Material Symbols with consistent styling throughout the app
 */
export function Icon({
  name,
  size = 24,
  color = 'text-on-surface',
  className = '',
  filled = false,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  onClick,
  ariaLabel
}: IconProps) {
  const style: React.CSSProperties = {
    fontSize: `${size}px`,
    fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
    lineHeight: 1,
    display: 'inline-block',
    verticalAlign: 'middle',
  }

  const classes = [
    'material-symbols-outlined',
    color,
    onClick ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
    >
      {name}
    </span>
  )
}

/**
 * Pre-configured icon sets for common use cases
 */
export const IconSets = {
  // Navigation icons
  Navigation: {
    Dashboard: ({ size, color }: Partial<IconProps>) => (
      <Icon name="dashboard" size={size} color={color} filled />
    ),
    Analysis: ({ size, color }: Partial<IconProps>) => (
      <Icon name="analytics" size={size} color={color} filled />
    ),
    Papers: ({ size, color }: Partial<IconProps>) => (
      <Icon name="library_books" size={size} color={color} filled />
    ),
    Profile: ({ size, color }: Partial<IconProps>) => (
      <Icon name="person" size={size} color={color} filled />
    ),
    Settings: ({ size, color }: Partial<IconProps>) => (
      <Icon name="settings" size={size} color={color} filled />
    ),
    Search: ({ size, color }: Partial<IconProps>) => (
      <Icon name="search" size={size} color={color} />
    ),
  },

  // Action icons
  Actions: {
    Add: ({ size, color }: Partial<IconProps>) => (
      <Icon name="add" size={size} color={color} filled />
    ),
    Edit: ({ size, color }: Partial<IconProps>) => (
      <Icon name="edit" size={size} color={color} />
    ),
    Delete: ({ size, color }: Partial<IconProps>) => (
      <Icon name="delete" size={size} color={color} />
    ),
    Download: ({ size, color }: Partial<IconProps>) => (
      <Icon name="download" size={size} color={color} />
    ),
    Refresh: ({ size, color }: Partial<IconProps>) => (
      <Icon name="refresh" size={size} color={color} />
    ),
    Filter: ({ size, color }: Partial<IconProps>) => (
      <Icon name="filter_list" size={size} color={color} />
    ),
  },

  // Status icons
  Status: {
    Success: ({ size, color }: Partial<IconProps>) => (
      <Icon name="check_circle" size={size} color={color || 'text-success'} filled />
    ),
    Error: ({ size, color }: Partial<IconProps>) => (
      <Icon name="error" size={size} color={color || 'text-error'} filled />
    ),
    Warning: ({ size, color }: Partial<IconProps>) => (
      <Icon name="warning" size={size} color={color || 'text-warning'} filled />
    ),
    Info: ({ size, color }: Partial<IconProps>) => (
      <Icon name="info" size={size} color={color || 'text-info'} filled />
    ),
  },

  // Education icons
  Education: {
    School: ({ size, color }: Partial<IconProps>) => (
      <Icon name="school" size={size} color={color} filled />
    ),
    Book: ({ size, color }: Partial<IconProps>) => (
      <Icon name="book" size={size} color={color} filled />
    ),
    Assignment: ({ size, color }: Partial<IconProps>) => (
      <Icon name="assignment" size={size} color={color} />
    ),
    Quiz: ({ size, color }: Partial<IconProps>) => (
      <Icon name="quiz" size={size} color={color} />
    ),
    Grade: ({ size, color }: Partial<IconProps>) => (
      <Icon name="grading" size={size} color={color} filled />
    ),
  },

  // Analysis icons
  Analysis: {
    TrendingUp: ({ size, color }: Partial<IconProps>) => (
      <Icon name="trending_up" size={size} color={color} />
    ),
    TrendingDown: ({ size, color }: Partial<IconProps>) => (
      <Icon name="trending_down" size={size} color={color} />
    ),
    Target: ({ size, color }: Partial<IconProps>) => (
      <Icon name="target" size={size} color={color} filled />
    ),
    Priority: ({ size, color }: Partial<IconProps>) => (
      <Icon name="priority" size={size} color={color} />
    ),
    Chart: ({ size, color }: Partial<IconProps>) => (
      <Icon name="bar_chart" size={size} color={color} filled />
    ),
  },
}

/**
 * Hook for using icons with theme-aware colors
 */
export function useIcons() {
  return {
    // Common icon shortcuts
    nav: IconSets.Navigation,
    action: IconSets.Actions,
    status: IconSets.Status,
    edu: IconSets.Education,
    analysis: IconSets.Analysis,
    
    // Quick icon creator
    create: (name: IconName, props?: Partial<IconProps>) => (
      <Icon name={name} {...props} />
    ),
  }
}

export default Icon