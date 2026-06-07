/**
 * Accessibility utilities and helpers for PaperIQ
 * 
 * Provides:
 * - ARIA label generators
 * - Keyboard navigation helpers
 * - Focus management utilities
 * - Screen reader announcements
 */

/**
 * Create a live region announcement for screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate accessible label for priority score
 */
export function getPriorityLabel(score: number): string {
  if (score >= 85) return `Critical priority: ${score} percent`
  if (score >= 70) return `High priority: ${score} percent`
  if (score >= 50) return `Medium priority: ${score} percent`
  if (score > 0) return `Low priority: ${score} percent`
  return 'No priority data available'
}

/**
 * Generate accessible label for subject card
 */
export function getSubjectCardLabel(
  name: string,
  code: string,
  score: number,
  topTopic: string
): string {
  const priority = getPriorityLabel(score)
  return `${name}, code ${code}. ${priority}. Most asked topic: ${topTopic}. Click to analyze.`
}

/**
 * Handle keyboard navigation for interactive cards
 */
export function handleCardKeyboard(
  event: React.KeyboardEvent,
  onActivate: () => void
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}

/**
 * Focus trap for modal dialogs
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')
  
  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors)
  )
  
  if (focusableElements.length === 0) return () => {}
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  // Focus first element
  firstElement.focus()
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  container.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get loading announcement
 */
export function announceLoading(item: string) {
  announce(`Loading ${item}`, 'polite')
}

/**
 * Get success announcement
 */
export function announceSuccess(message: string) {
  announce(`Success: ${message}`, 'polite')
}

/**
 * Get error announcement
 */
export function announceError(message: string) {
  announce(`Error: ${message}`, 'assertive')
}

/**
 * Get ARIA label for exam category
 */
export function getExamCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'Mid-1': 'Mid term 1',
    'Mid-2': 'Mid term 2',
    'Semester': 'Semester exam',
    'End': 'End semester exam',
  }
  return labels[category] || category
}

/**
 * Get ARIA label for regulation
 */
export function getRegulationLabel(regulation: string): string {
  // R22 → "Regulation 2022"
  const match = regulation.match(/R(\d{2})/)
  if (match) {
    const year = `20${match[1]}`
    return `Regulation ${year}`
  }
  return regulation
}

/**
 * Skip to main content helper
 */
export function skipToContent(contentId: string = 'main-content') {
  const element = document.getElementById(contentId)
  if (element) {
    element.focus()
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
