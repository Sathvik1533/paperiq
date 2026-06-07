import re

def main():
    try:
        with open('src/pages/Profile.tsx', 'r') as f:
            content = f.read()
            
        # 1. Imports
        if "import { motion, useReducedMotion } from 'framer-motion'" not in content:
            content = content.replace("import { CustomSelect } from '../components/CustomSelect'",
                "import { CustomSelect } from '../components/CustomSelect'\nimport { motion, useReducedMotion } from 'framer-motion'\nimport { PageTransition } from '../components/ui/PageTransition'")

        # 2. Hook
        if 'const shouldReduceMotion = useReducedMotion()' not in content:
            content = content.replace('export function Profile() {',
                'export function Profile() {\n  const shouldReduceMotion = useReducedMotion()')

        # 3. PageTransition wrapper
        if '<PageTransition>' not in content:
            content = content.replace(
                '  return (\n    <div className="min-h-screen bg-background">',
                '  return (\n    <PageTransition>\n    <div className="min-h-screen bg-background">'
            )
            content = content.replace(
                '      </main>\n      <Footer />\n    </div>\n  )\n}',
                '      </main>\n      <Footer />\n    </div>\n    </PageTransition>\n  )\n}'
            )

        # 4. Hero Banner
        content = re.sub(
            r'<div\s*\n\s*data-tour="tour-profile-hero"',
            r'<motion.div\n          data-tour="tour-profile-hero"\n          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}',
            content
        )
        content = content.replace(
            '          </div>\n        </div>\n\n        {/* ── Two-col layout',
            '          </div>\n        </motion.div>\n\n        {/* ── Two-col layout'
        )

        # 5. Stats
        content = content.replace(
            '].map(s => (\n                <div key={s.label} className="flex items-center gap-md">',
            '].map((s, index) => (\n                <motion.div \n                  key={s.label} \n                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}\n                  animate={{ opacity: 1, y: 0 }}\n                  transition={{ type: "spring" as const, stiffness: 300, damping: 20, delay: index * 0.05 }}\n                  className="flex items-center gap-md"\n                >'
        )
        content = content.replace(
            '                    <div className="text-[11px] text-on-surface-variant mt-[3px]">{s.label}</div>\n                  </div>\n                </div>\n              ))}',
            '                    <div className="text-[11px] text-on-surface-variant mt-[3px]">{s.label}</div>\n                  </div>\n                </motion.div>\n              ))}'
        )

        # 6. Quick Action buttons
        content = content.replace(
            '].map(action => (\n                    <button key={action.label} onClick={() => navigate(action.to)}\n                      className={`flex flex-col gap-sm p-md rounded-2xl border ${action.border} ${action.bg} hover:brightness-110 transition-all group text-left`}>',
            '].map(action => (\n                    <motion.button key={action.label} onClick={() => navigate(action.to)}\n                      whileHover={shouldReduceMotion ? {} : { scale: 1.03, translateY: -2 }}\n                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}\n                      className={`flex flex-col gap-sm p-md rounded-2xl border ${action.border} ${action.bg} hover:brightness-110 transition-all group text-left`}>'
        )
        content = content.replace(
            '                        <p className="text-[11px] text-on-surface-variant mt-[2px]">{action.sub}</p>\n                      </div>\n                    </button>\n                  ))}',
            '                        <p className="text-[11px] text-on-surface-variant mt-[2px]">{action.sub}</p>\n                      </div>\n                    </motion.button>\n                  ))}'
        )

        with open('src/pages/Profile.tsx', 'w') as f:
            f.write(content)
            
        print("Profile patched successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
