#!/usr/bin/env python3
"""
PatchPilot AI Code Processor
Handles code analysis, linting, and AI-powered reviews using Ollama
"""

import subprocess
import json
import sys
import os
import tempfile
from pathlib import Path
import difflib
from typing import Dict, List, Tuple, Optional

class CodeProcessor:
    def __init__(self):
        self.supported_languages = {
            'py': 'python',
            'js': 'javascript', 
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'rs': 'rust',
            'go': 'go',
            'php': 'php',
            'rb': 'ruby',
            'lua': 'lua',
            'html': 'html',
            'css': 'css',
            'json': 'json'
        }
        
        self.linters = {
            'python': ['pylint', 'flake8'],
            'javascript': ['eslint'],
            'typescript': ['eslint'],
            'json': ['jsonlint']
        }

    def detect_language(self, filename: str, content: str) -> str:
        """Detect programming language from filename and content"""
        extension = Path(filename).suffix.lower().lstrip('.')
        return self.supported_languages.get(extension, 'text')

    def run_static_analysis(self, code: str, language: str, filename: str) -> Dict:
        """Run static analysis tools (linting) on the code"""
        issues = []
        
        if language not in self.linters:
            return {"issues": [], "tool": "none", "status": "no_linter"}
        
        # Create temporary file for analysis
        with tempfile.NamedTemporaryFile(mode='w', suffix=f'.{language}', delete=False) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        
        try:
            for linter in self.linters[language]:
                if self.check_tool_available(linter):
                    linter_issues = self.run_linter(linter, tmp_path, language)
                    issues.extend(linter_issues)
                    break  # Use first available linter
            
            return {
                "issues": issues,
                "tool": linter if issues else "none",
                "status": "success" if issues else "clean"
            }
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    def check_tool_available(self, tool: str) -> bool:
        """Check if a linting tool is available"""
        try:
            subprocess.run([tool, '--version'], capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def run_linter(self, linter: str, filepath: str, language: str) -> List[Dict]:
        """Run specific linter and parse output"""
        issues = []
        
        try:
            if linter == 'pylint':
                result = subprocess.run([
                    'pylint', filepath, '--output-format=json', '--disable=C0103,C0114,C0115,C0116'
                ], capture_output=True, text=True)
                
                if result.stdout:
                    pylint_issues = json.loads(result.stdout)
                    for issue in pylint_issues:
                        issues.append({
                            "line": issue.get("line", 0),
                            "column": issue.get("column", 0),
                            "severity": issue.get("type", "warning"),
                            "message": issue.get("message", ""),
                            "rule": issue.get("message-id", "")
                        })
            
            elif linter == 'flake8':
                result = subprocess.run([
                    'flake8', filepath, '--format=json'
                ], capture_output=True, text=True)
                
                # Flake8 doesn't output JSON by default, parse text output
                for line in result.stdout.split('\n'):
                    if line.strip() and ':' in line:
                        parts = line.split(':')
                        if len(parts) >= 4:
                            issues.append({
                                "line": int(parts[1]) if parts[1].isdigit() else 0,
                                "column": int(parts[2]) if parts[2].isdigit() else 0,
                                "severity": "warning",
                                "message": ':'.join(parts[3:]).strip(),
                                "rule": "flake8"
                            })
            
            elif linter == 'eslint':
                result = subprocess.run([
                    'eslint', filepath, '--format=json'
                ], capture_output=True, text=True)
                
                if result.stdout:
                    eslint_result = json.loads(result.stdout)
                    if eslint_result and len(eslint_result) > 0:
                        for issue in eslint_result[0].get('messages', []):
                            issues.append({
                                "line": issue.get("line", 0),
                                "column": issue.get("column", 0),
                                "severity": issue.get("severity", 1) == 2 and "error" or "warning",
                                "message": issue.get("message", ""),
                                "rule": issue.get("ruleId", "")
                            })
        
        except Exception as e:
            print(f"Error running {linter}: {e}", file=sys.stderr)
        
        return issues

    def prompt_ollama(self, code: str, language: str, filename: str, static_issues: List[Dict] = None) -> Dict:
        """Send code to Ollama for AI analysis"""
        
        # Build context-aware prompt
        issues_context = ""
        if static_issues:
            issues_context = f"\n\nStatic analysis found {len(static_issues)} issues:\n"
            for issue in static_issues[:5]:  # Limit to top 5 issues
                issues_context += f"- Line {issue['line']}: {issue['message']}\n"
        
        prompt = f"""You are PatchPilot, an expert code reviewer. Analyze this {language} code from file "{filename}".

Please provide:
1. **Overview**: Brief summary of what the code does
2. **Issues Found**: List bugs, inefficiencies, and improvements (including any static analysis issues)
3. **Explanations**: Explain each issue in simple terms
4. **Severity**: Rate each issue as Critical/High/Medium/Low
5. **Fixed Code**: Provide the corrected version if issues found

{issues_context}

Here is the code to analyze:

```{language}
{code}
```

Format your response in a structured way that's easy to parse. Be conversational but thorough."""

        try:
            # Call Ollama with codellama model
            result = subprocess.run([
                'ollama', 'run', 'codellama:7b-instruct'
            ], input=prompt.encode(), capture_output=True, timeout=60)
            
            if result.returncode == 0:
                ai_response = result.stdout.decode('utf-8', errors='ignore')
                return {
                    "status": "success",
                    "response": ai_response,
                    "model": "codellama:7b-instruct"
                }
            else:
                error_msg = result.stderr.decode('utf-8', errors='ignore')
                return {
                    "status": "error",
                    "error": f"Ollama error: {error_msg}",
                    "fallback": True
                }
                
        except subprocess.TimeoutExpired:
            return {
                "status": "error", 
                "error": "AI analysis timed out",
                "fallback": True
            }
        except FileNotFoundError:
            return {
                "status": "error",
                "error": "Ollama not found. Please install Ollama and pull codellama model.",
                "fallback": True
            }

    def generate_diff(self, original: str, fixed: str, filename: str) -> str:
        """Generate unified diff between original and fixed code"""
        original_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.lines(keepends=True)
        
        diff = difflib.unified_diff(
            original_lines,
            fixed_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
            lineterm=""
        )
        
        return ''.join(diff)

    def fallback_analysis(self, code: str, language: str, static_issues: List[Dict]) -> str:
        """Provide basic analysis when AI is unavailable"""
        lines = code.split('\n')
        analysis = []
        
        analysis.append(f"## Basic Code Analysis ({language.title()})")
        analysis.append(f"**File Statistics:**")
        analysis.append(f"- Total lines: {len(lines)}")
        analysis.append(f"- Non-empty lines: {len([l for l in lines if l.strip()])}")
        analysis.append(f"- Language: {language.title()}")
        
        if static_issues:
            analysis.append(f"\n**Static Analysis Issues ({len(static_issues)} found):**")
            for i, issue in enumerate(static_issues[:10], 1):
                severity_emoji = {"error": "🔴", "warning": "🟡"}.get(issue['severity'], "🔵")
                analysis.append(f"{i}. {severity_emoji} Line {issue['line']}: {issue['message']}")
        else:
            analysis.append(f"\n✅ **No static analysis issues found!**")
        
        analysis.append(f"\n**Recommendations:**")
        analysis.append(f"- Code appears to follow basic {language} syntax")
        analysis.append(f"- Consider adding comments for complex logic")
        analysis.append(f"- Run with AI enabled for detailed review")
        
        return '\n'.join(analysis)

    def process_code(self, code: str, filename: str) -> Dict:
        """Main processing function - orchestrates analysis"""
        language = self.detect_language(filename, code)
        
        # Step 1: Static analysis
        static_analysis = self.run_static_analysis(code, language, filename)
        
        # Step 2: AI analysis
        ai_analysis = self.prompt_ollama(code, language, filename, static_analysis['issues'])
        
        # Step 3: Combine results
        if ai_analysis['status'] == 'success':
            response_text = ai_analysis['response']
        else:
            # Fallback to basic analysis
            response_text = self.fallback_analysis(code, language, static_analysis['issues'])
        
        return {
            "language": language,
            "filename": filename,
            "static_analysis": static_analysis,
            "ai_analysis": ai_analysis,
            "response": response_text,
            "lines": len(code.split('\n')),
            "size": len(code)
        }

def main():
    """CLI interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python processor.py <code_content> [filename]")
        sys.exit(1)
    
    code = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else "script.py"
    
    processor = CodeProcessor()
    result = processor.process_code(code, filename)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()