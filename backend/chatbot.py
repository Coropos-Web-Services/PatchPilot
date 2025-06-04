#!/usr/bin/env python3
"""Simple CLI assistant for PatchPilot.

This script uses a local Ollama model to answer questions and provide
coding assistance. It does not rely on any external API and therefore
works completely offline once a model has been downloaded.

Set ``OLLAMA_MODEL`` to choose a different model
(default: ``codellama:7b-instruct``).
"""

import os
import shutil
import subprocess
import sys


def run_ollama(prompt: str, model: str = "codellama:7b-instruct") -> str:
    """Run a prompt through the local Ollama model."""
    result = subprocess.run(
        ["ollama", "run", model, prompt], capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return result.stdout.strip()


def ask(question: str) -> str:
    """Handle a user question using the local Ollama model."""
    model = os.getenv("OLLAMA_MODEL", "codellama:7b-instruct")
    if not shutil.which("ollama"):
        raise RuntimeError("Ollama is not installed or not in PATH")
    return run_ollama(question, model)


def main() -> None:
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        prompt = sys.stdin.read()
    if not prompt.strip():
        print("Please provide a question or prompt.", file=sys.stderr)
        sys.exit(1)
    try:
        answer = ask(prompt)
        print(answer)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
