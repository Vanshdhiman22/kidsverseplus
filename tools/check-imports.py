"""
Find identifiers a file uses but never imports.

  python tools/check-imports.py

Vite does not catch these: an unbound name is valid JavaScript until it runs, so the
build stays green and the screen throws a ReferenceError the first time anyone opens it.
With no error boundary in the app, React then unmounts the whole tree, so one missing
import blanks the entire page rather than one component.

This has bitten twice -- `useTint` on Battle Opponents (the whole battle flow was
unreachable) and `QUESTIONS` on Test Intro -- so it is worth a check.
"""
import re, io, glob, os, sys

SRC = os.path.join(os.path.dirname(__file__), "..", "src")


def strip(s):
    """Leave only code. Prose is what makes this check cry wolf: a comment saying
    'the first tap (browsers require it)' and a label reading 'Small Steps<br/>' both
    look exactly like a call and a JSX tag to a regex."""
    s = re.sub(r"^import .*$", "", s, flags=re.M)
    s = re.sub(r"/\*.*?\*/", " ", s, flags=re.S)          # block comments
    s = re.sub(r"//[^\n]*", " ", s)                        # line comments
    s = re.sub(r"'[^'\n]*'|\"[^\"\n]*\"|`[^`]*`", "''", s)  # string literals
    s = re.sub(r">[^<>{}]*<", "><", s)                     # JSX text between tags
    return s


def files():
    for pat in ("**/*.js", "**/*.jsx"):
        for f in glob.glob(os.path.join(SRC, pat), recursive=True):
            yield f


def main():
    exports = {}
    for f in files():
        s = io.open(f, encoding="utf-8", errors="replace").read()
        for m in re.finditer(r"export\s+(?:const|function|class|let)\s+(\w+)", s):
            exports.setdefault(m.group(1), f)

    bad = []
    for f in sorted(files()):
        s = io.open(f, encoding="utf-8", errors="replace").read()
        body = strip(s)
        names = set()
        for m in re.finditer(r"import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from", s):
            if m.group(1):
                names.add(m.group(1))
            if m.group(2):
                names.update(p.split(" as ")[-1].strip() for p in m.group(2).split(","))
        names |= set(re.findall(r"(?:const|let|var|function|class)\s+(\w+)", body))
        for name, src in exports.items():
            if os.path.abspath(src) == os.path.abspath(f) or name in names:
                continue
            # used as a call, a member access, or a JSX tag
            if re.search(r"(?<![\w.])" + re.escape(name) + r"\s*[.(<]", body):
                bad.append((os.path.relpath(f, SRC), name, os.path.relpath(src, SRC)))

    if bad:
        print("used without an import (%d):" % len(bad))
        for f, n, src in bad:
            print("  %-38s %-18s exported from %s" % (f, n, src))
        return 1
    print("no unbound identifiers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
