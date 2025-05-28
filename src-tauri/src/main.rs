// src-tauri/src/main.rs (Enhanced)
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize)]
struct CodeAnalysisRequest {
    code: String,
    filename: String,
}

#[derive(Serialize, Deserialize)]
struct DirectoryAnalysisRequest {
    directory_path: String,
}

#[derive(Serialize, Deserialize)]
struct BatchAnalysisRequest {
    files: Vec<FileData>,
}

#[derive(Serialize, Deserialize)]
struct FileData {
    name: String,
    content: String,
    path: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct CodeAnalysisResponse {
    language: String,
    filename: String,
    static_analysis: serde_json::Value,
    ai_analysis: serde_json::Value,
    response: String,
    lines: i32,
    size: i32,
    success: bool,
}

#[derive(Serialize, Deserialize)]
struct DirectoryAnalysisResponse {
    r#type: String,
    path: String,
    total_files: i32,
    analyzed_files: i32,
    results: Vec<CodeAnalysisResponse>,
    project_analysis: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
struct BatchAnalysisResponse {
    total_files: i32,
    successful_analyses: i32,
    results: Vec<CodeAnalysisResponse>,
    summary: String,
}

#[derive(Serialize, Deserialize)]
struct OllamaStatus {
    available: bool,
    models: Vec<String>,
    error: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct ProgressUpdate {
    step: String,
    progress: i32,
    message: String,
    current_file: Option<String>,
}

#[command]
async fn analyze_code(request: CodeAnalysisRequest) -> Result<CodeAnalysisResponse, String> {
    let python_script = if cfg!(debug_assertions) {
        "../backend/processor.py"
    } else {
        "./backend/processor.py"
    };

    let output = Command::new("python3")
        .arg(python_script)
        .arg(&request.code)
        .arg(&request.filename)
        .output()
        .map_err(|e| format!("Failed to execute Python processor: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python processor failed: {}", error));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: CodeAnalysisResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse Python response: {}", e))?;

    Ok(result)
}

#[command]
async fn analyze_directory(request: DirectoryAnalysisRequest) -> Result<DirectoryAnalysisResponse, String> {
    let python_script = if cfg!(debug_assertions) {
        "../backend/processor.py"
    } else {
        "./backend/processor.py"
    };

    // Validate directory exists
    if !Path::new(&request.directory_path).is_dir() {
        return Err(format!("Directory does not exist: {}", request.directory_path));
    }

    let output = Command::new("python3")
        .arg(python_script)
        .arg(&request.directory_path)
        .output()
        .map_err(|e| format!("Failed to execute Python processor: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Directory analysis failed: {}", error));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let result: DirectoryAnalysisResponse = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse directory analysis response: {}", e))?;

    Ok(result)
}

#[command]
async fn analyze_multiple_files(request: BatchAnalysisRequest) -> Result<BatchAnalysisResponse, String> {
    let mut results = Vec::new();
    let mut successful = 0;
    let total = request.files.len();

    for file in request.files {
        match analyze_code(CodeAnalysisRequest {
            code: file.content,
            filename: file.name.clone(),
        }).await {
            Ok(mut result) => {
                if let Some(path) = file.path {
                    // Add path information to result if available
                    result.filename = format!("{} ({})", result.filename, path);
                }
                if result.success {
                    successful += 1;
                }
                results.push(result);
            }
            Err(e) => {
                results.push(CodeAnalysisResponse {
                    language: "unknown".to_string(),
                    filename: file.name,
                    static_analysis: serde_json::Value::Null,
                    ai_analysis: serde_json::Value::Null,
                    response: format!("Analysis failed: {}", e),
                    lines: 0,
                    size: 0,
                    success: false,
                });
            }
        }
    }

    let summary = format!(
        "Batch analysis complete: {}/{} files analyzed successfully. {} issues found across all files.",
        successful,
        total,
        results.iter().filter(|r| r.response.contains("issues found")).count()
    );

    Ok(BatchAnalysisResponse {
        total_files: total as i32,
        successful_analyses: successful as i32,
        results,
        summary,
    })
}

#[command]
async fn analyze_code_with_progress(
    request: CodeAnalysisRequest,
    progress_callback: tauri::State<'_, ProgressCallback>,
) -> Result<CodeAnalysisResponse, String> {
    // Emit progress updates
    progress_callback.emit(ProgressUpdate {
        step: "reading".to_string(),
        progress: 10,
        message: format!("Reading {}", request.filename),
        current_file: Some(request.filename.clone()),
    });

    // Small delay to show progress
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    progress_callback.emit(ProgressUpdate {
        step: "parsing".to_string(),
        progress: 40,
        message: "Running static analysis...".to_string(),
        current_file: Some(request.filename.clone()),
    });

    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;

    progress_callback.emit(ProgressUpdate {
        step: "analyzing".to_string(),
        progress: 70,
        message: "AI processing...".to_string(),
        current_file: Some(request.filename.clone()),
    });

    // Perform actual analysis
    let result = analyze_code(request).await?;

    progress_callback.emit(ProgressUpdate {
        step: "complete".to_string(),
        progress: 100,
        message: "Analysis complete!".to_string(),
        current_file: None,
    });

    Ok(result)
}

#[command]
async fn check_ollama_status() -> Result<OllamaStatus, String> {
    let ollama_check = Command::new("ollama")
        .arg("list")
        .output();

    match ollama_check {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let models: Vec<String> = stdout
                    .lines()
                    .skip(1) // Skip header
                    .map(|line| line.split_whitespace().next().unwrap_or("").to_string())
                    .filter(|model| !model.is_empty())
                    .collect();

                Ok(OllamaStatus {
                    available: true,
                    models,
                    error: None,
                })
            } else {
                Ok(OllamaStatus {
                    available: false,
                    models: vec![],
                    error: Some("Ollama service not running".to_string()),
                })
            }
        }
        Err(e) => Ok(OllamaStatus {
            available: false,
            models: vec![],
            error: Some(format!("Ollama not installed: {}", e)),
        }),
    }
}

#[command]
async fn install_ollama_model(model: String) -> Result<String, String> {
    let output = Command::new("ollama")
        .arg("pull")
        .arg(&model)
        .output()
        .map_err(|e| format!("Failed to pull model: {}", e))?;

    if output.status.success() {
        Ok(format!("Successfully installed model: {}", model))
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to install model {}: {}", model, error))
    }
}

#[command]
async fn get_desktop_path() -> Result<String, String> {
    let home_dir = dirs::home_dir()
        .ok_or("Could not find home directory")?;
    
    let desktop_path = home_dir.join("Desktop");
    
    Ok(desktop_path.to_string_lossy().to_string())
}

#[command]
async fn get_supported_file_extensions() -> Result<Vec<String>, String> {
    Ok(vec![
        "py".to_string(), "js".to_string(), "ts".to_string(), "jsx".to_string(), "tsx".to_string(),
        "java".to_string(), "cpp".to_string(), "c".to_string(), "h".to_string(), "hpp".to_string(),
        "rs".to_string(), "go".to_string(), "php".to_string(), "rb".to_string(), "swift".to_string(),
        "kt".to_string(), "cs".to_string(), "html".to_string(), "css".to_string(), "scss".to_string(),
        "sass".to_string(), "json".to_string(), "xml".to_string(), "yaml".to_string(), "yml".to_string(),
        "md".to_string(), "txt".to_string(), "lua".to_string(), "luau".to_string(), "r".to_string(),
        "sql".to_string(), "sh".to_string(), "bash".to_string(), "ps1".to_string(), "vue".to_string(),
        "svelte".to_string()
    ])
}

#[command]
async fn validate_directory(path: String) -> Result<DirectoryInfo, String> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut total_files = 0;
    let mut code_files = 0;
    let mut supported_extensions = std::collections::HashSet::new();

    // Get supported extensions
    let extensions = get_supported_file_extensions().await?;
    let ext_set: std::collections::HashSet<String> = extensions.into_iter().collect();

    // Walk directory and count files
    if let Ok(entries) = std::fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    total_files += 1;
                    
                    if let Some(extension) = entry.path().extension() {
                        if let Some(ext_str) = extension.to_str() {
                            if ext_set.contains(ext_str) {
                                code_files += 1;
                                supported_extensions.insert(ext_str.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(DirectoryInfo {
        path: path,
        total_files,
        code_files,
        supported_extensions: supported_extensions.into_iter().collect(),
        is_valid: code_files > 0,
    })
}

#[derive(Serialize, Deserialize)]
struct DirectoryInfo {
    path: String,
    total_files: i32,
    code_files: i32,
    supported_extensions: Vec<String>,
    is_valid: bool,
}

// Progress callback state
struct ProgressCallback;

impl ProgressCallback {
    fn emit(&self, update: ProgressUpdate) {
        // In a real implementation, this would emit to the frontend
        // For now, we'll print to stderr for debugging
        eprintln!("PROGRESS: {}", serde_json::to_string(&update).unwrap_or_default());
    }
}

#[command]
async fn get_system_info() -> Result<SystemInfo, String> {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    
    Ok(SystemInfo {
        os: os.to_string(),
        arch: arch.to_string(),
        supported_languages: vec![
            "Python".to_string(),
            "JavaScript".to_string(),
            "TypeScript".to_string(),
            "Java".to_string(),
            "C++".to_string(),
            "C".to_string(),
            "Rust".to_string(),
            "Go".to_string(),
            "PHP".to_string(),
            "Ruby".to_string(),
            "Lua".to_string(),
            "HTML".to_string(),
            "CSS".to_string(),
        ],
    })
}

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    os: String,
    arch: String,
    supported_languages: Vec<String>,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(ProgressCallback)
        .invoke_handler(tauri::generate_handler![
            analyze_code,
            analyze_directory,
            analyze_multiple_files,
            analyze_code_with_progress,
            check_ollama_status,
            install_ollama_model,
            get_desktop_path,
            get_supported_file_extensions,
            validate_directory,
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}