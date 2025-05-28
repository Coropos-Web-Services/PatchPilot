// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize)]
struct CodeAnalysisRequest {
    code: String,
    filename: String,
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
}

#[derive(Serialize, Deserialize)]
struct OllamaStatus {
    available: bool,
    models: Vec<String>,
    error: Option<String>,
}

#[command]
async fn analyze_code(request: CodeAnalysisRequest) -> Result<CodeAnalysisResponse, String> {
    // Get the path to the Python processor
    let python_script = if cfg!(debug_assertions) {
        // Development: use relative path from project root
        "../backend/processor.py"
    } else {
        // Production: bundled with app
        "./backend/processor.py"
    };

    // Call Python processor
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
async fn check_ollama_status() -> Result<OllamaStatus, String> {
    // Check if Ollama is installed and running
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            analyze_code,
            check_ollama_status,
            install_ollama_model,
            get_desktop_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}