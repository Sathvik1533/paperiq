import re

def main():
    try:
        # Patch Dashboard.tsx
        with open('src/pages/Dashboard.tsx', 'r') as f:
            dashboard = f.read()

        # Remove tour logic from Dashboard
        dashboard = re.sub(
            r'\{\s*/\*\s*Guided Tour overlay.*?\}\s*\{\s*runTour && \(\s*<GuidedTour[^>]+>\s*\)\s*\}',
            '',
            dashboard,
            flags=re.DOTALL
        )

        with open('src/pages/Dashboard.tsx', 'w') as f:
            f.write(dashboard)

        # Patch App.tsx
        with open('src/App.tsx', 'r') as f:
            app = f.read()

        # Add imports to App.tsx
        if 'GuidedTour' not in app:
            app = app.replace(
                "import { useAuthStore } from './store/authStore'",
                "import { useAuthStore } from './store/authStore'\nimport { usePrefsStore } from './store/prefsStore'\nimport { GuidedTour } from './components/GuidedTour'\nimport { APP_TOUR_STEPS } from './components/tourSteps'"
            )

        # Add GlobalTour component
        global_tour_code = """
function GlobalTour() {
  const { user } = useAuthStore()
  const { preferences, updatePreferences } = usePrefsStore()
  const [runTour, setRunTour] = useState(false)
  
  useEffect(() => {
    if (user && preferences) {
      const isCompleted = preferences.tour_completed
      const isStarted = localStorage.getItem('paperiq_tour_started') === 'true'
      if (!isCompleted && !isStarted) {
        setRunTour(true)
      }
    }
  }, [user, preferences])

  const startTour = () => {
    localStorage.setItem('paperiq_tour_started', 'true')
  }

  const completeTour = () => {
    localStorage.removeItem('paperiq_tour_started')
    setRunTour(false)
    if (user) {
      updatePreferences(user.id, { tour_completed: true })
    }
  }

  if (!runTour) return null

  return (
    <GuidedTour
      steps={APP_TOUR_STEPS}
      onComplete={completeTour}
      onSkip={completeTour}
      onStart={startTour}
    />
  )
}
"""

        if 'GlobalTour()' not in app:
            app = app.replace(
                "export default function App() {",
                global_tour_code + "\nexport default function App() {"
            )
            
            app = app.replace(
                "<CommandPalette />",
                "<CommandPalette />\n        <GlobalTour />"
            )

        with open('src/App.tsx', 'w') as f:
            f.write(app)

        print("Tour patched successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
