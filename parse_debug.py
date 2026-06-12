import json
import os

path = r"C:\Users\Ayushideep\.gemini\antigravity-ide\brain\7961d828-4939-4a07-bfb1-df3a508c35b3\.system_generated\steps\951\content.md"
with open(path, encoding='utf-8') as f:
    text = f.read()

try:
    json_str = text.split("---")[1].strip()
    data = json.loads(json_str)
    caches = [f for f in data.get("files", []) if "main.py" in f]
    print("MAIN.PY:", caches)
    print("BASE:", data.get("base"))
    print("CWD:", data.get("cwd"))
except Exception as e:
    print("Error:", e)
