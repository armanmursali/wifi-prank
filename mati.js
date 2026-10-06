const puppeteer = require('puppeteer');

const ROUTER_URL = 'http://192.168.100.1'; 
const ROUTER_USER = 'root';              
const ROUTER_PASS = 'yFNP6Q6U';      

async function matikanWiFiRouterUtama() {
    console.log("[*] Menghubungi router utama untuk mematikan Wi-Fi asli...");

    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
    }); 
    const page = await browser.newPage();

    try {
        await page.goto(ROUTER_URL, { waitUntil: 'networkidle2' });

        // 1. Proses Login Resmi
        await page.waitForSelector('#txt_Username'); 
        await page.type('#txt_Username', ROUTER_USER);
        await page.type('#txt_Password', ROUTER_PASS);

        const loginClicked = await page.evaluate(() => {
            const selectors = ['#loginButton', 'input[type="submit"]', '#btn_Login', '.login_button'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) { el.click(); return true; }
            }
            return false;
        });

        if (!loginClicked) throw new Error("Tombol login tidak ditemukan.");

        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("[+] Berhasil masuk ke panel admin router.");
        await new Promise(r => setTimeout(r, 2000)); 

        // 2. Akses Langsung Halaman Konfigurasi
        console.log("[*] Membuka halaman konfigurasi Wi-Fi secara instan...");
        await page.goto('http://192.168.100', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 4000)); 

        // 3. Menembus Semua Lapisan Frame Konten
        const semuaFrame = page.frames();
        let targetFrame = null;

        for (const frame of semuaFrame) {
            try {
                const hasElement = await frame.evaluate(() => {
                    return document.getElementById('enable2g') !== null || document.getElementById('enable5g') !== null;
                });
                if (hasElement) {
                    targetFrame = frame;
                    console.log("[+] Berhasil menembus target frame nirkabel.");
                    break;
                }
            } catch (e) {}
        }

        // Jika pencarian otomatis gagal, gunakan halaman utama
        const frameKontekstual = targetFrame || page;

        // 4. Manipulasi Status Sakelar Berdasarkan Logika Event Handler Router
        console.log("[*] Memproses pemutusan sakelar nirkabel...");

        const hasilEksekusi = await frameKontekstual.evaluate(() => {
            let log2g = "TIDAK_DITEMUKAN";
            let log5g = "TIDAK_DITEMUKAN";

            // Eksekusi Sakelar 2.4 GHz
            const el2g = document.getElementById('enable2g');
            if (el2g) {
                // Di Huawei HG8145V5, fungsi klik global 'EnableWiFi' menerima ID elemen untuk membalikkan kondisi
                if (typeof window.EnableWiFi === 'function') {
                    window.EnableWiFi('enable2g');
                    log2g = "DIKLIK_VIA_FUNGSI";
                } else {
                    el2g.click();
                    log2g = "DIKLIK_MANUAL";
                }
            }

            // Eksekusi Sakelar 5 GHz
            const el5g = document.getElementById('enable5g');
            if (el5g) {
                if (typeof window.EnableWiFi === 'function') {
                    window.EnableWiFi('enable5g');
                    log5g = "DIKLIK_VIA_FUNGSI";
                } else {
                    el5g.click();
                    log5g = "DIKLIK_MANUAL";
                }
            }

            return { log2g, log5g };
        });

        console.log(`[->] Status Eksekusi Wi-Fi 2.4GHz: ${hasilEksekusi.log2g}`);
        console.log(`[->] Status Eksekusi Wi-Fi 5GHz: ${hasilEksekusi.log5g}`);

        await new Promise(r => setTimeout(r, 2000));

        // 5. Simpan Perubahan Secara Paksa
        console.log("[*] Menerapkan perubahan ke sistem router...");
        
        const applyClicked = await frameKontekstual.evaluate(() => {
            const selectors = ['#btnSubmit', '#applyButton', '#btnApply', '#saveButton', 'input[type="submit"]'];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) { el.click(); return true; }
            }

            // Cari elemen input bertuliskan Apply secara dinamis
            const inputs = Array.from(document.querySelectorAll('input'));
            const targetBtn = inputs.find(i => (i.value || '').toLowerCase().trim() === 'apply');
            if (targetBtn) {
                targetBtn.click();
                return true;
            }
            return false;
        });

        if (!applyClicked) {
            throw new Error("Tombol Apply tidak merespons di lingkungan dokumen saat ini.");
        }
        
        console.log("[+] Perubahan berhasil dikirim ke firmware router.");
        console.log("[*] Menunggu 8 detik untuk proses pemadaman sinyal fisik...");
        await new Promise(r => setTimeout(r, 8000)); 

    } catch (error) {
        console.error("[-] Gagal mengeksekusi otomatisasi router:", error.message);
    } finally {
        await browser.close();
        console.log("[+] Proses selesai. Program ditutup.");
        process.exit(0);
    }
}

matikanWiFiRouterUtama();
