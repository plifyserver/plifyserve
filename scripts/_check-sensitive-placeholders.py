from pathlib import Path

for name in (".env.vercel-backup", ".env.vercel-plify"):
    path = Path(name)
    print("===", name)
    if not path.exists():
        print("missing")
        continue
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        raw = value.strip().strip('"').strip("'")
        print(f"{key}: placeholder={raw == '[SENSITIVE]'} empty={not raw} len={len(raw)}")
