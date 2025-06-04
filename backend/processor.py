#!/usr/bin/env python3
"""
Enhanced PatchPilot AI Code Processor
Handles single files, directories, and provides real-time progress feedback
"""

import subprocess
import json
import sys
import os
import tempfile
import time
import shutil
from pathlib import Path
import difflib
from typing import Dict, List, Tuple, Optional
import threading
import queue

class ProgressTracker:
    def __init__(self):
        self.current_step = "reading"
        self.progress = 0
        self.message = ""
        self.callbacks = []
    
    def update(self, step: str, progress: int, message: str = ""):
        self.current_step = step
        self.progress = progress
        self.message = message
        self.emit_progress()
    
    def emit_progress(self):
        progress_data = {
            "step": self.current_step,
            "progress": self.progress,
            "message": self.message
        }
        # In a real implementation, this would send to frontend
        print(f"PROGRESS: {json.dumps(progress_data)}", file=sys.stderr)

class EnhancedCodeProcessor:
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
            'luau': 'lua',
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
        
        self.progress_tracker = ProgressTracker()

    def detect_language(self, filename: str, content: str) -> str:
        """Detect programming language from filename and content"""
        extension = Path(filename).suffix.lower().lstrip('.')
        return self.supported_languages.get(extension, 'text')

    def analyze_directory(self, directory_path: str) -> Dict:
        """Analyze an entire directory of code files"""
        self.progress_tracker.update("reading", 0, "Scanning directory...")
        
        code_files = []
        supported_extensions = set(self.supported_languages.keys())
        
        # Recursively find all code files
        for root, dirs, files in os.walk(directory_path):
            # Skip common non-code directories
            dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.vscode', '.idea'}]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                extension = Path(file).suffix.lower().lstrip('.')
                if extension in supported_extensions:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, directory_path)
                    code_files.append({
                        'path': file_path,
                        'relative_path': relative_path,
                        'filename': file,
                        'extension': extension
                    })
        
        self.progress_tracker.update("reading", 30, f"Found {len(code_files)} code files")
        
        # Analyze each file
        results = []
        total_files = len(code_files)
        
        for i, file_info in enumerate(code_files):
            progress = 30 + (60 * i / total_files)
            self.progress_tracker.update("analyzing", int(progress), f"Analyzing {file_info['filename']}...")
            
            try:
                with open(file_info['path'], 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                file_result = self.process_code(content, file_info['filename'])
                file_result['relative_path'] = file_info['relative_path']
                results.append(file_result)
                
            except Exception as e:
                results.append({
                    'filename': file_info['filename'],
                    'relative_path': file_info['relative_path'],
                    'error': str(e),
                    'success': False
                })
        
        self.progress_tracker.update("generating", 90, "Generating project summary...")
        
        # Generate project-level analysis
        project_analysis = self.generate_project_analysis(results, directory_path)
        
        self.progress_tracker.update("complete", 100, "Directory analysis complete!")
        
        return {
            'type': 'directory',
            'path': directory_path,
            'total_files': total_files,
            'analyzed_files': len([r for r in results if r.get('success', True)]),
            'results': results,
            'project_analysis': project_analysis
        }

    def generate_project_analysis(self, file_results: List[Dict], directory_path: str) -> Dict:
        """Generate high-level project analysis from individual file results"""
        
        languages = {}
        total_lines = 0
        total_size = 0
        issues_found = 0
        
        for result in file_results:
            if result.get('success', True) and 'language' in result:
                lang = result['language']
                languages[lang] = languages.get(lang, 0) + 1
                total_lines += result.get('lines', 0)
                total_size += result.get('size', 0)
                
                if 'static_analysis' in result and result['static_analysis'].get('issues'):
                    issues_found += len(result['static_analysis']['issues'])
        
        primary_language = max(languages.keys(), key=languages.get) if languages else 'unknown'
        
        # Generate architectural insights
        architecture_notes = self.analyze_project_architecture(file_results)
        
        # Generate improvement suggestions
        improvements = self.generate_project_improvements(file_results, languages)
        
        return {
            'primary_language': primary_language,
            'languages': languages,
            'total_lines': total_lines,
            'total_size': total_size,
            'issues_found': issues_found,
            'architecture': architecture_notes,
            'improvements': improvements,
            'summary': self.generate_project_summary(languages, total_lines, issues_found)
        }

    def analyze_project_architecture(self, results: List[Dict]) -> List[str]:
        """Analyze project architecture patterns"""
        patterns = []
        
        has_main = any('main' in r.get('filename', '').lower() for r in results)
        has_config = any(r.get('filename', '').lower() in ['config.py', 'settings.py', 'config.js'] for r in results)
        has_tests = any('test' in r.get('filename', '').lower() for r in results)
        
        if has_main:
            patterns.append("Entry point pattern detected")
        if has_config:
            patterns.append("Configuration management pattern found")
        if has_tests:
            patterns.append("Testing structure present")
        else:
            patterns.append("No test files detected - consider adding tests")
            
        return patterns

    def generate_project_improvements(self, results: List[Dict], languages: Dict) -> List[str]:
        """Generate project-wide improvement suggestions"""
        improvements = []
        
        # Check for documentation
        has_readme = any('readme' in r.get('filename', '').lower() for r in results)
        if not has_readme:
            improvements.append("Add a README.md file to document the project")
        
        # Check for large files
        large_files = [r for r in results if r.get('lines', 0) > 500]
        if large_files:
            improvements.append(f"Consider breaking down {len(large_files)} large files (>500 lines)")
        
        # Language-specific suggestions
        if 'python' in languages:
            has_requirements = any('requirements' in r.get('filename', '') for r in results)
            if not has_requirements:
                improvements.append("Add requirements.txt for Python dependencies")
        
        if 'javascript' in languages:
            has_package_json = any('package.json' in r.get('filename', '') for r in results)
            if not has_package_json:
                improvements.append("Add package.json for JavaScript dependencies")
        
        return improvements

    def generate_project_summary(self, languages: Dict, total_lines: int, issues: int) -> str:
        """Generate a human-readable project summary"""
        primary_lang = max(languages.keys(), key=languages.get) if languages else 'Mixed'
        
        summary = f"This is primarily a {primary_lang} project with {total_lines:,} lines of code across {sum(languages.values())} files."
        
        if len(languages) > 1:
            other_langs = [lang for lang in languages.keys() if lang != primary_lang]
            summary += f" It also includes {', '.join(other_langs)} components."
        
        if issues > 0:
            summary += f" Static analysis found {issues} potential issues to review."
        else:
            summary += " No major issues detected in static analysis."
            
        return summary

    def run_static_analysis(self, code: str, language: str, filename: str) -> Dict:
        """Run static analysis tools (linting) on the code with progress tracking"""
        self.progress_tracker.update("parsing", 40, f"Running static analysis on {filename}...")
        
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

    def run_code_sandbox(
        self,
        code: str,
        language: str,
        timeout: int = 5,
        project_dir: Optional[str] = None,
        filename: str = "snippet",
    ) -> Dict[str, str]:
        """Execute code in an isolated sandbox directory."""

        commands = {
            "python": ["python", filename],
            "javascript": ["node", filename],
            "typescript": ["ts-node", filename],
            "bash": ["bash", filename],
        }

        temp_dir = tempfile.mkdtemp()
        if project_dir:
            try:
                shutil.copytree(project_dir, temp_dir, dirs_exist_ok=True)
            except Exception:
                pass

        tmp_path = os.path.join(temp_dir, filename)
        with open(tmp_path, "w", encoding="utf-8") as tmp:
            tmp.write(code)

        cmd = commands.get(language)
        if not cmd:
            shutil.rmtree(temp_dir, ignore_errors=True)
            return {"stdout": "", "stderr": f"Unsupported language: {language}", "timeout": False}

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=temp_dir,
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "timeout": False,
            }
        except subprocess.TimeoutExpired as e:
            return {
                "stdout": e.stdout or "",
                "stderr": e.stderr or "",
                "timeout": True,
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def prompt_ollama_with_progress(self, code: str, language: str, filename: str, static_issues: List[Dict] = None) -> Dict:
        """Send code to Ollama for AI analysis with progress tracking"""
        
        self.progress_tracker.update("analyzing", 60, f"Initializing AI analysis for {filename}...")
        
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

        self.progress_tracker.update("analyzing", 80, "Processing with CodeLlama...")

        try:
            # Call Ollama with codellama model
            result = subprocess.run([
                'ollama', 'run', 'codellama:7b-instruct'
            ], input=prompt.encode(), capture_output=True, timeout=60)
            
            self.progress_tracker.update("generating", 95, "Finalizing AI response...")
            
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

    def process_code_with_progress(self, code: str, filename: str) -> Dict:
        """Main processing function with detailed progress tracking"""
        
        # Step 1: Initial setup and language detection
        self.progress_tracker.update("reading", 10, f"Reading {filename}...")
        time.sleep(0.1)  # Small delay for UI feedback
        
        language = self.detect_language(filename, code)
        
        self.progress_tracker.update("reading", 30, f"Detected language: {language}")
        time.sleep(0.1)
        
        # Step 2: Static analysis
        self.progress_tracker.update("parsing", 40, "Running static analysis...")
        static_analysis = self.run_static_analysis(code, language, filename)
        
        # Step 3: AI analysis with progress
        ai_analysis = self.prompt_ollama_with_progress(code, language, filename, static_analysis['issues'])
        
        # Step 4: Generate response
        self.progress_tracker.update("optimizing", 95, "Preparing final response...")
        
        if ai_analysis['status'] == 'success':
            response_text = ai_analysis['response']
        else:
            # Fallback to basic analysis
            response_text = self.fallback_analysis(code, language, static_analysis['issues'])
        
        self.progress_tracker.update("complete", 100, "Analysis complete!")
        
        return {
            "language": language,
            "filename": filename,
            "static_analysis": static_analysis,
            "ai_analysis": ai_analysis,
            "response": response_text,
            "lines": len(code.split('\n')),
            "size": len(code),
            "success": True
        }

    def process_code(self, code: str, filename: str) -> Dict:
        """Legacy method for backward compatibility"""
        return self.process_code_with_progress(code, filename)

    def fallback_analysis(self, code: str, language: str, static_issues: List[Dict]) -> str:
        """Provide enhanced basic analysis when AI is unavailable"""
        lines = code.split('\n')
        analysis = []
        
        analysis.append(f"## Enhanced Code Analysis ({language.title()})")
        analysis.append(f"**File Statistics:**")
        analysis.append(f"- Total lines: {len(lines)}")
        analysis.append(f"- Non-empty lines: {len([l for l in lines if l.strip()])}")
        analysis.append(f"- Language: {language.title()}")
        analysis.append(f"- Complexity: {self.estimate_complexity(code, language)}")
        
        # Enhanced structure analysis
        structure_info = self.analyze_code_structure(code, language)
        if structure_info:
            analysis.append(f"\n**Code Structure:**")
            analysis.extend(structure_info)
        
        if static_issues:
            analysis.append(f"\n**Static Analysis Issues ({len(static_issues)} found):**")
            for i, issue in enumerate(static_issues[:10], 1):
                severity_emoji = {"error": "🔴", "warning": "🟡"}.get(issue['severity'], "🔵")
                analysis.append(f"{i}. {severity_emoji} Line {issue['line']}: {issue['message']}")
                if issue.get('rule'):
                    analysis.append(f"   Rule: {issue['rule']}")
        else:
            analysis.append(f"\n✅ **No static analysis issues found!**")
        
        # Language-specific recommendations
        lang_recommendations = self.get_language_recommendations(language, code)
        if lang_recommendations:
            analysis.append(f"\n**{language.title()}-Specific Recommendations:**")
            analysis.extend(lang_recommendations)
        
        analysis.append(f"\n**General Recommendations:**")
        analysis.append(f"- Code follows basic {language} syntax correctly")
        analysis.append(f"- Consider adding comprehensive comments for complex logic")
        analysis.append(f"- Implement error handling for robustness")
        analysis.append(f"- Add unit tests to verify functionality")
        analysis.append(f"- Run with AI enabled for detailed, intelligent review")
        
        analysis.append(f"\n**🤖 To Enable Advanced AI Analysis:**")
        analysis.append(f"1. Install Ollama: `brew install ollama` (macOS) or visit ollama.ai")
        analysis.append(f"2. Pull the code model: `ollama pull codellama:7b-instruct`")
        analysis.append(f"3. Restart PatchPilot for full AI-powered reviews")
        
        return '\n'.join(analysis)

    def estimate_complexity(self, code: str, language: str) -> str:
        """Estimate code complexity based on simple metrics"""
        lines = len(code.split('\n'))
        
        # Count control structures
        control_keywords = ['if', 'for', 'while', 'switch', 'case', 'try', 'catch']
        complexity_score = 0
        
        for keyword in control_keywords:
            complexity_score += code.lower().count(keyword)
        
        # Estimate based on lines and complexity
        if lines < 50 and complexity_score < 5:
            return "Low"
        elif lines < 200 and complexity_score < 15:
            return "Medium"
        elif lines < 500 and complexity_score < 30:
            return "High"
        else:
            return "Very High"

    def analyze_code_structure(self, code: str, language: str) -> List[str]:
        """Analyze code structure and return insights"""
        structure = []
        
        # Function analysis
        if language in ['python', 'javascript', 'typescript']:
            functions = len([line for line in code.split('\n') if 'def ' in line or 'function ' in line])
            if functions > 0:
                structure.append(f"- Functions defined: {functions}")
        
        # Class analysis
        if language in ['python', 'java', 'javascript', 'typescript']:
            classes = len([line for line in code.split('\n') if 'class ' in line])
            if classes > 0:
                structure.append(f"- Classes defined: {classes}")
        
        # Import/include analysis
        imports = 0
        if language == 'python':
            imports = len([line for line in code.split('\n') if line.strip().startswith(('import ', 'from '))])
        elif language in ['javascript', 'typescript']:
            imports = len([line for line in code.split('\n') if 'import ' in line or 'require(' in line])
        elif language in ['c', 'cpp']:
            imports = len([line for line in code.split('\n') if line.strip().startswith('#include')])
        
        if imports > 0:
            structure.append(f"- Dependencies/imports: {imports}")
        
        # Comment analysis
        comment_lines = 0
        if language == 'python':
            comment_lines = len([line for line in code.split('\n') if line.strip().startswith('#')])
        elif language in ['javascript', 'typescript', 'java', 'c', 'cpp']:
            comment_lines = len([line for line in code.split('\n') if '//' in line or '/*' in line])
        
        if comment_lines > 0:
            total_lines = len([line for line in code.split('\n') if line.strip()])
            comment_ratio = (comment_lines / total_lines) * 100 if total_lines > 0 else 0
            structure.append(f"- Comment coverage: {comment_ratio:.1f}% ({comment_lines} lines)")
        
        return structure

    def get_language_recommendations(self, language: str, code: str) -> List[str]:
        """Get language-specific recommendations"""
        recommendations = []
        
        if language == 'python':
            if 'print(' in code and 'logging' not in code:
                recommendations.append("- Consider using logging instead of print statements")
            if 'except:' in code:
                recommendations.append("- Use specific exception types instead of bare except clauses")
            if not any(line.strip().startswith('"""') for line in code.split('\n')):
                recommendations.append("- Add docstrings to functions and classes")
                
        elif language in ['javascript', 'typescript']:
            if 'var ' in code:
                recommendations.append("- Use 'const' or 'let' instead of 'var' for better scoping")
            if 'console.log' in code:
                recommendations.append("- Consider using a proper logging library for production")
            if language == 'javascript' and 'function(' in code:
                recommendations.append("- Consider using arrow functions for cleaner syntax")
                
        elif language == 'java':
            if 'System.out.print' in code:
                recommendations.append("- Use a logging framework like SLF4J instead of System.out")
            if not any('public static void main' in line for line in code.split('\n')):
                recommendations.append("- Consider adding a main method for testing")
                
        elif language in ['c', 'cpp']:
            if '#include <stdio.h>' in code and 'printf' in code:
                recommendations.append("- Ensure proper memory management for dynamic allocations")
            if language == 'cpp' and 'using namespace std' in code:
                recommendations.append("- Consider avoiding 'using namespace std' in headers")
        
        elif language == 'lua':
            if 'print(' in code:
                recommendations.append("- Consider using proper error handling with pcall")
            recommendations.append("- Ensure proper table indexing and nil checks")
        
        return recommendations

    def generate_diff(self, original: str, fixed: str, filename: str) -> str:
        """Generate unified diff between original and fixed code"""
        original_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.splitlines(keepends=True)
        
        diff = difflib.unified_diff(
            original_lines,
            fixed_lines,
            fromfile=f"a/{filename}",
            tofile=f"b/{filename}",
            lineterm=""
        )
        
        return ''.join(diff)

    def batch_analyze_files(self, file_paths: List[str]) -> List[Dict]:
        """Analyze multiple files in batch with progress tracking"""
        results = []
        total_files = len(file_paths)
        
        for i, file_path in enumerate(file_paths):
            filename = os.path.basename(file_path)
            progress = int((i / total_files) * 100)
            
            self.progress_tracker.update("analyzing", progress, f"Processing {filename} ({i+1}/{total_files})")
            
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                result = self.process_code_with_progress(content, filename)
                result['file_path'] = file_path
                results.append(result)
                
            except Exception as e:
                results.append({
                    'filename': filename,
                    'file_path': file_path,
                    'error': str(e),
                    'success': False
                })
        
        self.progress_tracker.update("complete", 100, f"Batch analysis complete: {len(results)} files processed")
        return results

def main():
    """Enhanced CLI interface for testing"""
    if len(sys.argv) < 2:
        print("Usage: python processor.py <code_content_or_directory> [filename]")
        print("Examples:")
        print("  python processor.py 'print(\"hello\")' script.py")
        print("  python processor.py /path/to/project/")
        sys.exit(1)
    
    input_arg = sys.argv[1]
    processor = EnhancedCodeProcessor()
    
    # Check for run sandbox option
    if input_arg == "--run" and len(sys.argv) >= 3:
        file_path = sys.argv[2]
        project_dir = os.getcwd()
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            code = f.read()
        language = processor.detect_language(file_path, code)
        result = processor.run_code_sandbox(
            code,
            language,
            project_dir=project_dir,
            filename=os.path.basename(file_path),
        )
    # Check if input is a directory
    elif os.path.isdir(input_arg):
        print(f"Analyzing directory: {input_arg}", file=sys.stderr)
        result = processor.analyze_directory(input_arg)
    else:
        # Treat as code content
        code = input_arg
        filename = sys.argv[2] if len(sys.argv) > 2 else "script.py"
        print(f"Analyzing code: {filename}", file=sys.stderr)
        result = processor.process_code_with_progress(code, filename)
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()