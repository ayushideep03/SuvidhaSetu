import os

# Files to update
files_to_update = [
    r"web\app\page.tsx",
    r"web\app\layout.tsx",
    r"web\app\insights\page.tsx",
    r"web\app\insights\how-it-works\page.tsx",
    r"web\app\insights\demographics\page.tsx",
    r"web\app\insights\hidden-schemes\page.tsx",
    r"web\app\find\page.tsx",
    r"web\app\contribute\page.tsx",
    r"web\components\scheme\DocumentChecklist.tsx",
    r"api\services\ai.py",
    r"scrape_schemes.py",
    r"README.md",
    r"web\README.md",
]

for file_path in files_to_update:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We do a targeted replace. We skip github URLs or lowercased system keys.
    # We replace exact "SuvidhaSetu" -> "Suvidha Setu"
    # But we want to avoid replacing inside "github.com/Ayushideep/SuvidhaSetu"
    # A simple way:
    content = content.replace("Ayushideep/SuvidhaSetu", "Ayushideep/TEMP_GITHUB_BRAND")
    
    # Replace branding
    content = content.replace("SuvidhaSetu", "Suvidha Setu")
    content = content.replace("सुविधासेतु", "सुविधा सेतु")
    
    # Restore github
    content = content.replace("Ayushideep/TEMP_GITHUB_BRAND", "Ayushideep/SuvidhaSetu")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Migration completed.")
