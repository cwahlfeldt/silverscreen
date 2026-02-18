use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use tokio::sync::OnceCell;

static SERVER_PORT: OnceCell<u16> = OnceCell::const_new();

#[tauri::command]
async fn get_server_port() -> Result<u16, String> {
    SERVER_PORT
        .get()
        .copied()
        .ok_or_else(|| "Server not ready yet".to_string())
}

#[tauri::command]
async fn install_playwright_browsers(app: tauri::AppHandle) -> Result<(), String> {
    let (mut rx, _child) = app
        .shell()
        .sidecar("silverscreen-server")
        .map_err(|e| e.to_string())?
        .args(["--install-browsers"])
        .spawn()
        .map_err(|e| e.to_string())?;

    while let Some(event) = rx.recv().await {
        if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
            let msg = String::from_utf8_lossy(&line).to_string();
            app.emit("browser-install-progress", msg).ok();
        }
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Resolve app data directory and pass it to the sidecar
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir");
            std::fs::create_dir_all(&data_dir)?;

            let data_dir_str = data_dir
                .to_str()
                .expect("app data dir is not valid UTF-8")
                .to_string();

            let sidecar_command = app
                .shell()
                .sidecar("silverscreen-server")
                .expect("silverscreen-server sidecar not found")
                .env("PORT", "0")
                .env("SILVERSCREEN_DATA_DIR", &data_dir_str);

            let (mut rx, _child) = sidecar_command.spawn().expect("failed to spawn sidecar");

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                            if let Ok(msg) =
                                serde_json::from_slice::<serde_json::Value>(&line)
                            {
                                if msg["ready"] == true {
                                    if let Some(port) = msg["port"].as_u64() {
                                        let port = port as u16;
                                        SERVER_PORT.set(port).ok();
                                        app_handle.emit("server-ready", port).ok();
                                    }
                                }
                            }
                        }
                        tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                            eprintln!(
                                "[sidecar] {}",
                                String::from_utf8_lossy(&line)
                            );
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_server_port,
            install_playwright_browsers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
