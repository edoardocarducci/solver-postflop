fn main() {
    // Fix for Cargo 1.80+ extra subfolder in OUT_DIR bug with tauri-build 1.5
    if let Ok(out_dir) = std::env::var("OUT_DIR") {
        let out = std::path::PathBuf::from(&out_dir);
        if let Some(hash_dir) = out.parent() {
            if let Some(pkg_dir) = hash_dir.parent() {
                if let Some(build_dir) = pkg_dir.parent() {
                    let fake_build = build_dir.join("build");
                    let _ = std::fs::create_dir_all(&fake_build);

                    if let Some(target_dir) = build_dir.parent() {
                        // Locate WebView2Loader.dll from any webview2 build directory
                        if let Ok(entries) = std::fs::read_dir(build_dir.join("webview2-com-sys")) {
                            for e in entries.flatten() {
                                let dll_path = e.path().join("out").join("x64").join("WebView2Loader.dll");
                                if dll_path.exists() {
                                    let _ = std::fs::copy(&dll_path, target_dir.join("WebView2Loader.dll"));
                                    let _ = std::fs::copy(&dll_path, build_dir.join("WebView2Loader.dll"));
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    tauri_build::build()
}
