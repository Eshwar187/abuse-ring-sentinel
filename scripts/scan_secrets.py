import os
import re

PATTERNS = [
    re.compile(r'(?i)(?:api[_-]?key|secret[_-]?key|private[_-]?key|password|bearer[_-]?token)\s*[:=]\s*["\'][a-zA-Z0-9_\-\.]{8,}["\']'),
    re.compile(r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----')
]

matches = []
for root, dirs, files in os.walk('.'):
    if any(ig in root for ig in ['node_modules', '.angular', '.git', '.pytest_cache', 'dist', '__pycache__']):
        continue
    for f in files:
        filepath = os.path.join(root, f)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                for idx, line in enumerate(fp, 1):
                    for pat in PATTERNS:
                        if pat.search(line):
                            if 'test' in filepath.lower() or 'example' in filepath.lower():
                                continue
                            matches.append((filepath, idx, line.strip()[:80]))
        except Exception:
            pass

print(f"Total suspicious secret matches: {len(matches)}")
for p, l, text in matches:
    print(f"{p}:{l} -> {text}")
