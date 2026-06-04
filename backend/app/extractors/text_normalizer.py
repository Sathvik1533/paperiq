import re


def normalize(text: str) -> str:
    """
    Normalize extracted text for storage and downstream parsing.
    - Collapse 3+ consecutive blank lines to 2
    - Strip leading/trailing whitespace per line
    - Remove Word artifact strings
    - Normalize unicode dashes and quotes
    """
    if not text:
        return ""

    text = re.sub(r"~\$.*", "", text)

    replacements = {
        "–": "-", "—": "-",
        "‘": "'", "’": "'",
        "“": '"', "”": '"',
        " ": " ",
        "•": "*",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)

    lines = [line.strip() for line in text.splitlines()]
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
