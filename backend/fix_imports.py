import os
import re

def fix_imports(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix logger
    content = re.sub(r'from \.\.?logger import', r'from app.logger import', content)
    
    # Fix submodules where it says .parsers. etc instead of app.parsers.
    content = re.sub(r'from \.\.?parsers\.', r'from app.parsers.', content)
    content = re.sub(r'from \.\.?scrapers\.', r'from app.scrapers.', content)
    content = re.sub(r'from \.\.?extractors\.', r'from app.extractors.', content)
    content = re.sub(r'from \.\.?llm\.', r'from app.llm.', content)
    content = re.sub(r'from \.\.?api\.', r'from app.api.', content)
    content = re.sub(r'from \.\.?database import', r'from app.database import', content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.py'):
            fix_imports(os.path.join(root, file))
print("Done")
