class ListControlApp {
    constructor() {
        this.currentData = [];
        this.checkedCodes = new Map();
        this.currentScreen = 'upload';
        this.sessionId = null;
        this.isSessionHost = false;
        this.sessionData = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.registerServiceWorker();
        this.checkUrlForSession();
    }

    bindEvents() {
        console.log('Binding events...');
        
        // File upload
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            console.log('File input found, adding event listener');
            fileInput.addEventListener('change', (e) => {
                console.log('File input change event triggered!');
                this.handleFileUpload(e);
            });
        } else {
            console.error('file-input element not found!');
        }

        // Code input - removed automatic search on input

        // Navigation buttons
        const viewListBtn = document.getElementById('view-list-btn');
        const backToControlBtn = document.getElementById('back-to-control-btn');
        const completeBtn = document.getElementById('complete-btn');
        
        if (viewListBtn) {
            viewListBtn.addEventListener('click', () => {
                console.log('View list button clicked');
                this.showScreen('list');
            });
        } else {
            console.error('view-list-btn not found');
        }

        if (backToControlBtn) {
            backToControlBtn.addEventListener('click', () => {
                console.log('Back to control button clicked');
                this.showScreen('control');
            });
        } else {
            console.error('back-to-control-btn not found');
        }

        if (completeBtn) {
            completeBtn.addEventListener('click', () => {
                console.log('Complete button clicked');
                this.completeControl();
            });
        } else {
            console.error('complete-btn not found');
        }

        // Report actions
        document.getElementById('download-report-btn').addEventListener('click', () => {
            this.downloadReport();
        });

        document.getElementById('share-whatsapp-btn').addEventListener('click', () => {
            this.shareToWhatsApp();
        });

        document.getElementById('new-check-btn').addEventListener('click', () => {
            this.startNewCheck();
        });

        // Session management
        document.getElementById('continue-session-btn').addEventListener('click', () => {
            this.showScreen('continue-session');
        });

        document.getElementById('share-session-btn').addEventListener('click', () => {
            // Sync current progress before sharing
            if (this.sessionId && this.isSessionHost) {
                this.syncSession();
            }
            this.createSession();
        });

        document.getElementById('back-to-upload-btn').addEventListener('click', () => {
            this.showScreen('upload');
        });

        document.getElementById('back-to-control-from-share-btn').addEventListener('click', () => {
            this.showScreen('control');
        });

        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copySessionCode();
        });

        document.getElementById('scan-qr-btn').addEventListener('click', () => {
            this.startQRScan();
        });

        document.getElementById('connect-session-btn').addEventListener('click', () => {
            this.connectToSession();
        });

        document.getElementById('session-code-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Enter key support for code input
        document.getElementById('code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    this.handleCodeSearch(value);
                }
            }
        });

        // Clear search status when typing
        document.getElementById('code-input').addEventListener('input', (e) => {
            this.clearSearchStatus();
        });

        // List search functionality
        document.getElementById('list-search-input').addEventListener('input', (e) => {
            this.filterDataTable(e.target.value);
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    showScreen(screenName) {
        console.log('showScreen called with:', screenName);
        const screens = document.querySelectorAll('.screen');
        console.log('Found screens:', screens.length);
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(`${screenName}-screen`);
        console.log('Target screen:', targetScreen);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log('Screen switched to:', screenName);
        } else {
            console.error('Screen not found:', `${screenName}-screen`);
        }

        if (screenName === 'list') {
            this.displayDataTable();
        } else if (screenName === 'report') {
            this.updateReportSummary();
        }
    }

    async handleFileUpload(event) {
        console.log('File upload started');
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', file.name, file.type, file.size);

        try {
            console.log('Starting file parse...');
            const data = await this.parseFile(file);
            console.log('File parsed successfully, data length:', data.length);
            console.log('First 5 codes:', data.slice(0, 5));
            
            this.currentData = data;
            this.checkedCodes.clear();
            
            console.log(`Loaded ${data.length} codes from file`);
            console.log('Switching to control screen...');
            this.showScreen('control');
            
        } catch (error) {
            console.error('File upload error:', error);
            alert('Dosya okunurken hata oluştu: ' + error.message);
        }
    }

    parseFile(file) {
        return new Promise((resolve, reject) => {
            console.log('parseFile started for:', file.name);
            const reader = new FileReader();
            
            reader.onload = (e) => {
                console.log('FileReader onload triggered');
                try {
                    // Check if it's CSV file
                    if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                        console.log('Parsing as CSV file...');
                        const text = e.target.result;
                        const textDecoder = new TextDecoder();
                        const csvText = textDecoder.decode(new Uint8Array(text));
                        console.log('CSV text:', csvText.substring(0, 200));
                        
                        const lines = csvText.split('\n').filter(line => line.trim());
                        const codes = [];
                        
                        for (let line of lines) {
                            const code = line.trim().toUpperCase();
                            if (code && codes.indexOf(code) === -1) {
                                codes.push(code);
                            }
                        }
                        
                        console.log('CSV codes parsed:', codes.length);
                        console.log('First 5 codes:', codes.slice(0, 5));
                        resolve(codes);
                        return;
                    }
                    
                    // For Excel files
                    console.log('Parsing as Excel file...');
                    console.log('Checking XLSX library...');
                    if (typeof XLSX === 'undefined') {
                        console.error('XLSX library not loaded!');
                        reject(new Error('Excel kütüphanesi yüklenmedi'));
                        return;
                    }
                    
                    console.log('XLSX library found, parsing...');
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    console.log('Workbook created:', workbook.SheetNames);
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    console.log('JSON data created, rows:', jsonData.length);
                    
                    // Parse codes from first column
                    const codes = [];
                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (row && row[0]) {
                            const code = String(row[0]).trim().toUpperCase();
                            if (code && codes.indexOf(code) === -1) {
                                codes.push(code);
                            }
                        }
                    }
                    
                    console.log('Excel codes parsed:', codes.length);
                    resolve(codes);
                } catch (error) {
                    console.error('Parse error:', error);
                    reject(new Error('Dosya formatı desteklenmiyor: ' + error.message));
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(new Error('Dosya okunamadı'));
            };
            
            console.log('Starting readAsArrayBuffer...');
            reader.readAsArrayBuffer(file);
        });
    }

    handleCodeSearch(inputValue) {
        if (!inputValue || inputValue.length === 0) {
            this.clearSearchStatus();
            return;
        }

        const searchCode = 'LBL' + inputValue.toString().trim();
        const found = this.searchCode(searchCode);
        
        if (found) {
            this.showSuccessFlash();
            this.markCodeAsChecked(searchCode);
            this.showSearchStatus('Bulundu!', 'success');
        } else {
            this.showErrorFlash();
            this.showSearchStatus('Bulunamadı!', 'error');
        }

        // Clear input after search
        setTimeout(() => {
            document.getElementById('code-input').value = '';
        }, 1500);
    }

    searchCode(code) {
        return this.currentData.some(item => 
            item.toUpperCase() === code.toUpperCase()
        );
    }

    markCodeAsChecked(code) {
        this.checkedCodes.set(code.toUpperCase(), {
            code: code.toUpperCase(),
            status: 'Bulundu',
            date: new Date().toLocaleString('tr-TR')
        });
    }

    showSuccessFlash() {
        const overlay = document.getElementById('flash-overlay');
        overlay.className = 'flash-overlay success';
        
        setTimeout(() => {
            overlay.className = 'flash-overlay';
        }, 3000);
    }

    showErrorFlash() {
        const overlay = document.getElementById('flash-overlay');
        overlay.className = 'flash-overlay error';
        
        setTimeout(() => {
            overlay.className = 'flash-overlay';
        }, 3000);
    }

    showSearchStatus(message, type) {
        const statusEl = document.getElementById('search-status');
        statusEl.textContent = message;
        statusEl.className = `search-status ${type}`;
        
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'search-status';
        }, 3000);
    }

    clearSearchStatus() {
        const statusEl = document.getElementById('search-status');
        statusEl.textContent = '';
        statusEl.className = 'search-status';
    }

    displayDataTable(filteredData = null) {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';
        
        const dataToShow = filteredData || this.currentData;

        dataToShow.forEach(code => {
            const row = document.createElement('tr');
            const checkedData = this.checkedCodes.get(code.toUpperCase());
            
            row.innerHTML = `
                <td>${code}</td>
                <td class="${checkedData ? 'status-found' : 'status-not-found'}">
                    ${checkedData ? checkedData.status : 'Kontrol edilmedi'}
                </td>
                <td>${checkedData ? checkedData.date : '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    filterDataTable(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            this.displayDataTable();
            return;
        }

        const filteredData = this.currentData.filter(code => 
            code.toUpperCase().includes(searchTerm.toUpperCase())
        );

        this.displayDataTable(filteredData);
    }

    completeControl() {
        // Final sync before completing
        if (this.sessionId && this.isSessionHost) {
            this.syncSession();
        }
        this.showScreen('report');
    }

    updateReportSummary() {
        const totalCodes = this.currentData.length;
        const checkedCodes = this.checkedCodes.size;
        
        document.getElementById('total-codes').textContent = totalCodes;
        document.getElementById('checked-codes').textContent = checkedCodes;
    }

    downloadReport() {
        const reportData = [];
        
        // Add header
        reportData.push(['Kod', 'Durum', 'Tarih']);
        
        // Add data
        this.currentData.forEach(code => {
            const checkedData = this.checkedCodes.get(code.toUpperCase());
            reportData.push([
                code,
                checkedData ? checkedData.status : 'Kontrol edilmedi',
                checkedData ? checkedData.date : '-'
            ]);
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(reportData);
        
        // Auto-size columns
        const colWidths = [
            { wch: 15 }, // Kod
            { wch: 20 }, // Durum
            { wch: 20 }  // Tarih
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Raporu');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `kontrol_raporu_${dateStr}.xlsx`;
        
        // Download file
        XLSX.writeFile(wb, filename);
    }

    async shareToWhatsApp() {
        try {
            // First create the report blob
            const reportData = [];
            reportData.push(['Kod', 'Durum', 'Tarih']);
            
            this.currentData.forEach(code => {
                const checkedData = this.checkedCodes.get(code.toUpperCase());
                reportData.push([
                    code,
                    checkedData ? checkedData.status : 'Kontrol edilmedi',
                    checkedData ? checkedData.date : '-'
                ]);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Kontrol Raporu');
            
            // Create blob and file
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const filename = `kontrol_raporu_${dateStr}_${timeStr.replace(':', '')}.xlsx`;
            
            // Method 1: Try native Web Share API with file (works on mobile)
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], filename, {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    });
                    
                    const shareData = {
                        title: 'Kontrol Raporu',
                        text: `Kontrol Raporu\nToplam: ${this.currentData.length} kod\nKontrol Edilen: ${this.checkedCodes.size} kod`,
                        files: [file]
                    };
                    
                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        return; // Success!
                    }
                } catch (shareError) {
                    console.log('Native file sharing failed, trying alternative methods');
                }
            }
            
            // Method 2: Create downloadable link and auto-trigger share intent (Android)
            if (/Android/i.test(navigator.userAgent)) {
                try {
                    // Create a temporary download link
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    // Try to open share intent after a brief delay
                    setTimeout(() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'Kontrol Raporu',
                                text: `Kontrol Raporu dosyası indirildi.\nToplam: ${this.currentData.length} kod\nKontrol Edilen: ${this.checkedCodes.size} kod\n\nIndirilen Excel dosyasını WhatsApp'ta paylaşabilirsiniz.`
                            }).catch(() => {
                                this.showWhatsAppTextShare();
                            });
                        } else {
                            this.showWhatsAppTextShare();
                        }
                    }, 1500);
                    
                    return;
                } catch (error) {
                    console.log('Android method failed:', error);
                }
            }
            
            // Method 3: Show instruction modal and download (fallback)
            this.showDownloadAndShareInstructions(blob, filename);
            
        } catch (error) {
            console.error('WhatsApp sharing failed:', error);
            this.showWhatsAppTextShare();
        }
    }

    showDownloadAndShareInstructions(blob, filename) {
        // Download the file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show instructions
        const message = `Excel raporu indirildi!\n\nWhatsApp'ta paylaşmak için:\n1. WhatsApp'ı açın\n2. Sohbet açın\n3. Ataş (📎) butonuna basın\n4. "Dosya" seçin\n5. İndirilen "${filename}" dosyasını seçin\n\nToplam: ${this.currentData.length} kod\nKontrol Edilen: ${this.checkedCodes.size} kod`;
        
        alert(message);
        
        // Also try to open WhatsApp
        setTimeout(() => {
            this.showWhatsAppTextShare();
        }, 2000);
    }

    showWhatsAppTextShare() {
        const summary = `Kontrol Raporu\nToplam: ${this.currentData.length} kod\nKontrol Edilen: ${this.checkedCodes.size} kod\n\nExcel raporu ayrıca indirildi.`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
        window.open(whatsappUrl, '_blank');
    }

    startNewCheck() {
        this.currentData = [];
        this.checkedCodes.clear();
        this.sessionId = null;
        this.isSessionHost = false;
        this.sessionData = null;
        document.getElementById('file-input').value = '';
        this.showScreen('upload');
    }

    // Session Management Methods
    generateSessionId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async createSession() {
        try {
            this.sessionId = this.generateSessionId();
            this.isSessionHost = true;
            
            const sessionData = {
                id: this.sessionId,
                data: this.currentData,
                checkedCodes: Array.from(this.checkedCodes.entries()),
                timestamp: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            // For now, just use localStorage (later can add cloud)
            localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(sessionData));
            
            // Try cloud storage with real API key
            try {
                await this.saveToCloud(sessionData);
                console.log('Session saved to cloud successfully!');
            } catch (cloudError) {
                console.log('Cloud storage failed, using local only:', cloudError.message);
            }
            
            this.displaySessionShare();
            this.showScreen('share-session');
            
        } catch (error) {
            console.error('Session creation error:', error);
            alert('Session oluşturulamadı: ' + error.message);
        }
    }

    async saveToCloud(sessionData) {
        try {
            // Use JSONBin.io as free cloud storage
            const API_KEY = '$2a$10$UFhz5fGpEvEfqmX.6xp9H.eSEgC0M7yW5lp1AEkHKP53xPlEccUi2';
            
            const response = await fetch('https://api.jsonbin.io/v3/b', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': API_KEY,
                    'X-Access-Key': '$2a$10$u/gAW4fLiB18cKXSJ4sBZeEbOUVp0gCX8K/XoLMGtTABW07Ec3GaG',
                    'X-Bin-Name': `setupal-session-${sessionData.id}`,
                    'X-Bin-Private': 'false'
                },
                body: JSON.stringify(sessionData)
            });
            
            if (response.ok) {
                const result = await response.json();
                // Store the bin ID for retrieval
                localStorage.setItem(`cloud_${sessionData.id}`, result.metadata.id);
                console.log('Session saved to cloud:', result.metadata.id);
                return true;
            } else {
                console.error('Cloud save failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Cloud save error:', error);
            return false;
        }
    }

    displaySessionShare() {
        // Display session code
        document.getElementById('session-code-display').textContent = this.sessionId;
        
        // Generate QR code
        const qrContainer = document.getElementById('qr-code');
        qrContainer.innerHTML = '';
        
        const sessionUrl = `${window.location.origin}${window.location.pathname}?session=${this.sessionId}`;
        
        // Wait for QRCode library to load
        this.generateQRCode(qrContainer, sessionUrl, 0);
    }

    generateQRCode(container, url, attempts) {
        if (typeof QRCode !== 'undefined') {
            QRCode.toCanvas(container, url, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#2d3748',
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) {
                    container.innerHTML = `
                        <div style="padding: 20px; text-align: center; border: 2px dashed #e2e8f0; background: #f7fafc; border-radius: 8px;">
                            <p style="color: #718096;">QR kodu oluşturulamadı</p>
                            <p style="font-size: 12px; margin-top: 10px; color: #4a5568;">Manuel kod: <strong>${this.sessionId}</strong></p>
                        </div>
                    `;
                    console.error(error);
                }
            });
        } else if (attempts < 10) {
            // Retry after 500ms, max 10 attempts (5 seconds)
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #718096;">
                    <div style="margin-bottom: 10px;">QR kütüphanesi yükleniyor...</div>
                    <div style="font-size: 12px;">Manuel kod: <strong style="color: #4a5568;">${this.sessionId}</strong></div>
                </div>
            `;
            setTimeout(() => {
                this.generateQRCode(container, url, attempts + 1);
            }, 500);
        } else {
            // Fallback after 5 seconds
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; border: 2px dashed #e2e8f0; background: #f7fafc; border-radius: 8px;">
                    <p style="color: #e53e3e; margin-bottom: 10px;">QR kütüphanesi yüklenemedi</p>
                    <p style="color: #4a5568;">Manuel kod kullanın:</p>
                    <p style="font-size: 20px; font-weight: bold; margin-top: 10px; color: #2d3748; letter-spacing: 2px;">${this.sessionId}</p>
                </div>
            `;
        }
    }

    copySessionCode() {
        const code = this.sessionId;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copy-code-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Kod kopyalandı: ' + code);
        }
    }

    async startQRScan() {
        // Check if we're on HTTPS or localhost
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            document.getElementById('qr-scanner-result').innerHTML = 
                '<div style="color: #e53e3e; text-align: center; padding: 20px; border-radius: 8px; background: #fed7d7; border: 1px solid #fc8181; margin: 10px 0;">⚠️ Kamera erişimi HTTPS gerektiriyor<br><small>Manuel kod girişi kullanın</small></div>';
            return;
        }

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            document.getElementById('qr-scanner-result').innerHTML = 
                '<div style="color: #e53e3e; text-align: center; padding: 20px; border-radius: 8px; background: #fed7d7; border: 1px solid #fc8181; margin: 10px 0;">⚠️ Kamera API desteklenmiyor<br><small>Manuel kod girişi kullanın</small></div>';
            return;
        }

        try {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Request camera access with better error handling
            const constraints = {
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            video.srcObject = stream;
            video.play();
            
            // Create scanning interface
            const scanner = document.getElementById('qr-scanner-result');
            scanner.innerHTML = '';
            scanner.appendChild(video);
            
            const scanButton = document.createElement('button');
            scanButton.textContent = 'Taramayı Durdur';
            scanButton.className = 'btn-secondary';
            scanner.appendChild(scanButton);
            
            video.style.width = '100%';
            video.style.maxWidth = '300px';
            video.style.height = 'auto';
            
            let scanning = true;
            
            const scan = () => {
                if (!scanning) return;
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    scanning = false;
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Extract session ID from URL
                    const url = new URL(code.data);
                    const sessionId = url.searchParams.get('session');
                    
                    if (sessionId) {
                        scanner.innerHTML = 'QR kod başarıyla okundu!';
                        this.loadSession(sessionId);
                    } else {
                        scanner.innerHTML = 'Geçersiz QR kod';
                    }
                } else {
                    requestAnimationFrame(scan);
                }
            };
            
            scanButton.onclick = () => {
                scanning = false;
                stream.getTracks().forEach(track => track.stop());
                scanner.innerHTML = 'Tarama durduruldu';
            };
            
            video.onloadedmetadata = () => {
                scan();
            };
            
        } catch (error) {
            console.error('Camera access error:', error);
            let errorMessage = 'Kamera erişimi reddedildi';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = '🚫 Kamera izni reddedildi';
            } else if (error.name === 'NotFoundError') {
                errorMessage = '📷 Kamera bulunamadı';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = '⚠️ Kamera desteklenmiyor';
            } else if (error.name === 'NotReadableError') {
                errorMessage = '🔧 Kamera başka uygulama tarafından kullanılıyor';
            }
            
            document.getElementById('qr-scanner-result').innerHTML = 
                `<div style="color: #e53e3e; text-align: center; padding: 20px; border-radius: 8px; background: #fed7d7; border: 1px solid #fc8181; margin: 10px 0;">
                    ${errorMessage}<br>
                    <small style="color: #c53030;">Manuel kod girişini kullanın</small>
                </div>`;
        }
    }

    connectToSession() {
        const code = document.getElementById('session-code-input').value.trim();
        if (!code || code.length !== 6) {
            alert('Lütfen 6 haneli geçerli bir kod girin');
            return;
        }
        
        this.loadSession(code);
    }

    async loadSession(sessionId) {
        try {
            // First try to load from cloud
            let session = await this.loadFromCloud(sessionId);
            
            // If cloud fails, try local storage
            if (!session) {
                const localData = localStorage.getItem(`session_${sessionId}`);
                if (localData) {
                    session = JSON.parse(localData);
                    console.log('Loaded from local storage');
                }
            }
            
            if (!session) {
                alert('Session bulunamadı. Kod yanlış veya süresi dolmuş olabilir.');
                return;
            }
            
            // Check expiration
            if (Date.now() > session.expiresAt) {
                localStorage.removeItem(`session_${sessionId}`);
                alert('Session süresi dolmuş (24 saat)');
                return;
            }
            
            // Load session data
            this.sessionId = sessionId;
            this.isSessionHost = false;
            this.currentData = session.data;
            this.checkedCodes = new Map(session.checkedCodes);
            
            alert(`Session başarıyla yüklendi!\\n${session.data.length} kod bulundu`);
            this.showScreen('control');
            
        } catch (error) {
            console.error('Session load error:', error);
            alert('Session yüklenirken hata oluştu: ' + error.message);
        }
    }

    async loadFromCloud(sessionId) {
        try {
            const API_KEY = '$2a$10$UFhz5fGpEvEfqmX.6xp9H.eSEgC0M7yW5lp1AEkHKP53xPlEccUi2';
            
            // Method 1: Try to get cloud bin ID from localStorage first
            const binId = localStorage.getItem(`cloud_${sessionId}`);
            
            if (binId) {
                console.log('Found local bin ID:', binId);
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
                    headers: {
                        'X-Master-Key': API_KEY,
                        'X-Access-Key': '$2a$10$u/gAW4fLiB18cKXSJ4sBZeEbOUVp0gCX8K/XoLMGtTABW07Ec3GaG'
                    }
                });
                if (response.ok) {
                    const result = await response.json();
                    console.log('Loaded from cloud via bin ID:', binId);
                    return result.record;
                }
            }
            
            // Method 2: Search all bins for matching session ID (cross-device)
            console.log('No local bin ID, searching all bins for session:', sessionId);
            
            const listResponse = await fetch('https://api.jsonbin.io/v3/b', {
                headers: {
                    'X-Master-Key': API_KEY,
                    'X-Access-Key': '$2a$10$u/gAW4fLiB18cKXSJ4sBZeEbOUVp0gCX8K/XoLMGtTABW07Ec3GaG'
                }
            });
            
            if (listResponse.ok) {
                const bins = await listResponse.json();
                console.log('Found bins:', bins.length);
                
                // Search for session in bins by name pattern
                for (const bin of bins) {
                    if (bin.name && bin.name.includes(`setupal-session-${sessionId}`)) {
                        console.log('Found matching bin:', bin.id);
                        
                        const dataResponse = await fetch(`https://api.jsonbin.io/v3/b/${bin.id}/latest`, {
                            headers: {
                                'X-Master-Key': API_KEY,
                                'X-Access-Key': '$2a$10$u/gAW4fLiB18cKXSJ4sBZeEbOUVp0gCX8K/XoLMGtTABW07Ec3GaG'
                            }
                        });
                        
                        if (dataResponse.ok) {
                            const result = await dataResponse.json();
                            const sessionData = result.record;
                            
                            if (sessionData && sessionData.id === sessionId) {
                                console.log('Session found via search:', sessionId);
                                // Store bin ID locally for future use
                                localStorage.setItem(`cloud_${sessionId}`, bin.id);
                                return sessionData;
                            }
                        }
                    }
                }
            }
            
            console.log('Session not found in cloud');
            return null;
            
        } catch (error) {
            console.error('Cloud load error:', error);
            return null;
        }
    }

    // Override existing methods to sync with session
    markCodeAsChecked(code) {
        this.checkedCodes.set(code.toUpperCase(), {
            code: code.toUpperCase(),
            status: 'Bulundu',
            date: new Date().toLocaleString('tr-TR')
        });
        
        // Sync every 10 codes to save API calls
        if (this.sessionId && this.isSessionHost && this.checkedCodes.size % 10 === 0) {
            this.syncSession();
        }
    }

    async syncSession() {
        if (!this.sessionId) return;
        
        const sessionData = {
            id: this.sessionId,
            data: this.currentData,
            checkedCodes: Array.from(this.checkedCodes.entries()),
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        };
        
        // Save to localStorage immediately
        localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(sessionData));
        
        // Try to sync to cloud if we're the host
        if (this.isSessionHost) {
            await this.updateCloud(sessionData);
        }
    }

    async updateCloud(sessionData) {
        try {
            const API_KEY = '$2a$10$UFhz5fGpEvEfqmX.6xp9H.eSEgC0M7yW5lp1AEkHKP53xPlEccUi2';
            const binId = localStorage.getItem(`cloud_${sessionData.id}`);
            
            if (binId) {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': API_KEY,
                        'X-Access-Key': '$2a$10$u/gAW4fLiB18cKXSJ4sBZeEbOUVp0gCX8K/XoLMGtTABW07Ec3GaG'
                    },
                    body: JSON.stringify(sessionData)
                });
                
                if (response.ok) {
                    console.log('Session synced to cloud');
                } else {
                    console.error('Cloud sync failed:', response.status);
                }
            }
        } catch (error) {
            console.error('Cloud sync error:', error);
        }
    }

    // Check URL for session parameter on load
    checkUrlForSession() {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        
        if (sessionId) {
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Auto-load session
            setTimeout(() => {
                this.loadSession(sessionId);
            }, 1000);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ListControlApp...');
    try {
        const app = new ListControlApp();
        console.log('ListControlApp initialized successfully:', app);
        window.app = app; // Debug için global erişim
    } catch (error) {
        console.error('ListControlApp initialization failed:', error);
    }
});

// PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
});