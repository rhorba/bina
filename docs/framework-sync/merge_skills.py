import re, sys, os

CTS = "cts-repo/.claude/skills"
BINA = "bina-repo/.claude/skills"

SHARED = [
    "backend-dev", "dba", "frontend-dev", "security-engineer", "tester",
    "test-architect", "ui-designer", "ux-designer", "tech-lead",
    "devops-devsecops", "deployment", "orchestrator", "project-manager",
    "project-monitor", "scrum-master",
]

NEW = [
    "design-loop", "content-marketer", "copywriter", "creative-intelligence",
    "digital-marketer", "software-architect", "system-designer",
]

def split_frontmatter(text):
    m = re.match(r"^---\n(.*?\n)---\n(.*)$", text, re.DOTALL)
    if not m:
        raise ValueError("no frontmatter")
    return m.group(1), m.group(2)

def strip_leading_title(body):
    # remove first "# Title" line (and following blank lines) from CTS body
    lines = body.lstrip("\n").split("\n")
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    while lines and lines[0].strip() == "":
        lines = lines[1:]
    return "\n".join(lines)

report = []

for skill in SHARED:
    cts_path = os.path.join(CTS, skill, "SKILL.md")
    bina_path = os.path.join(BINA, skill, "SKILL.md")
    if not os.path.exists(cts_path) or not os.path.exists(bina_path):
        report.append(f"SKIP {skill}: missing file")
        continue

    cts_text = open(cts_path, encoding="utf-8").read()
    bina_text = open(bina_path, encoding="utf-8").read()

    cts_fm, cts_body = split_frontmatter(cts_text)
    bina_fm, bina_body = split_frontmatter(bina_text)

    generic_body = strip_leading_title(cts_body)

    # bina_body starts with "# Title — Bina\n\n" then bina-specific content
    bina_lines = bina_body.lstrip("\n").split("\n")
    title_line = bina_lines[0] if bina_lines and bina_lines[0].startswith("# ") else f"# {skill} — Bina"
    rest_idx = 1
    while rest_idx < len(bina_lines) and bina_lines[rest_idx].strip() == "":
        rest_idx += 1
    bina_specific = "\n".join(bina_lines[rest_idx:]).rstrip("\n")

    # Use CTS frontmatter's description (generic, trigger-rich) but keep bina's `name:`
    new_fm = cts_fm  # already ends with newline, includes name/description from CTS

    merged = (
        "---\n" + new_fm + "---\n\n"
        + title_line + "\n\n"
        + generic_body.rstrip("\n") + "\n\n"
        + "---\n\n"
        + "## Bina-Specific Overlay\n\n"
        + "> Everything above is the generic CTS specialist skill. Below is what changes for Bina.\n\n"
        + bina_specific + "\n"
    )

    open(bina_path, "w", encoding="utf-8", newline="\n").write(merged)
    report.append(f"MERGED {skill}: {len(bina_text.splitlines())} -> {len(merged.splitlines())} lines")

for skill in NEW:
    cts_path = os.path.join(CTS, skill, "SKILL.md")
    if not os.path.exists(cts_path):
        report.append(f"SKIP-NEW {skill}: missing in CTS")
        continue
    dest_dir = os.path.join(BINA, skill)
    os.makedirs(dest_dir, exist_ok=True)
    import shutil
    shutil.copytree(os.path.join(CTS, skill), dest_dir, dirs_exist_ok=True)
    report.append(f"ADDED {skill}")

print("\n".join(report))
