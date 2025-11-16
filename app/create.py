import argparse
from datetime import datetime

def generate_markdown(data: dict) -> str:
    """Generate markdown front matter + body text, hmm."""
    md = f"""---
title: "{data['title']}"
CTF: "{data['ctf']}"
date: "{data['date']}"
description: "{data['description']}"
read: {data['read']}
image: {data['image']}
---

{data.get('body', '')}
"""
    return md


def main():
    parser = argparse.ArgumentParser(description="Create markdown file from fields, hmm.")
    
    parser.add_argument("--title", required=True)
    parser.add_argument("--ctf", required=True)
    parser.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    parser.add_argument("--desc", required=True)
    parser.add_argument("--read", type=int, required=True)
    parser.add_argument("--image", default="")
    parser.add_argument("--body", default="", help="Extra markdown content if any, yes.")
    parser.add_argument("--output", default="output.md", help="Output markdown filename.")

    args = parser.parse_args()

    data = {
        "title": args.title,
        "ctf": args.ctf,
        "date": args.date,
        "description": args.desc,
        "read": args.read,
        "image": args.image,
        "body": args.body
    }

    md_content = generate_markdown(data)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"Markdown file written to {args.output}, hmmm.")


if __name__ == "__main__":
    main()
