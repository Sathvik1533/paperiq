import re


def normalize(text: str) -> str:
    """
    Normalize extracted text for storage and downstream parsing.
    - Collapse multiple blank lines
    - Strip leading/trailing whitespace per line
    - Remove Word artifact strings (~$, temp markers)
    - Normalize unicode dashes and quotes
    """
    if not text:
        return ""

    # Remove Word temp file artifacts
    text = re.sub(r"~\$.*", "", text)

    # Normalize unicode
    replacements = {
        "–": "-", "—": "-",     # en/em dash
        "‘": "'", "’": "'",     # curly single quotes
        "“": '"', "”": '"',     # curly double quotes
        " ": " ",                    # non-breaking space
        "•": "*",                    # bullet
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)

    # Strip each line
    lines = [line.strip() for line in text.splitlines()]

    # Collapse 3+ consecutive blank lines into 2
    result = []
    blank_count = 0
    for line in lines:
        if line == "":
            blank_count += 1
            if blank_count <= 2:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)

    return "\n".join(result).strip()
