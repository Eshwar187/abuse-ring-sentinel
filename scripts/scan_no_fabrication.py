import sys
import os
import re

SUSPICIOUS_PATTERNS = [
    re.compile(r"Math\.random\(\)"),
    re.compile(r"fakePrediction", re.IGNORECASE),
    re.compile(r"mockPrediction", re.IGNORECASE),
    re.compile(r"mockRiskScore", re.IGNORECASE),
    re.compile(r"fakeRiskScore", re.IGNORECASE),
]

findings = []
for root, dirs, files in os.walk("frontend/src/app"):
    for f in files:
        if f.endswith(".ts") or f.endswith(".html"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                for idx, line in enumerate(fp, 1):
                    for pat in SUSPICIOUS_PATTERNS:
                        if pat.search(line):
                            findings.append((path, idx, line.strip()))

print(f"Total suspicious fabrication patterns found: {len(findings)}")
for p, l, t in findings:
    print(f"{p}:{l} -> {t}")
