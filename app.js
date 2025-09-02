class ListControlApp {
    constructor() {
        this.currentData = [];
        this.checkedCodes = new Map();
        this.currentScreen = 'upload';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.registerServiceWorker();
    }

    bindEvents() {
        // File upload
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Code input - removed automatic search on input

        // Navigation buttons
        document.getElementById('view-list-btn').addEventListener('click', () => {
            this.showScreen('list');
        });

        document.getElementById('back-to-control-btn').addEventListener('click', () => {
            this.showScreen('control');
        });

        document.getElementById('complete-btn').addEventListener('click', () => {
            this.completeControl();
        });

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
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        document.getElementById(`${screenName}-screen`).classList.add('active');
        this.currentScreen = screenName;

        if (screenName === 'list') {
            this.displayDataTable();
        } else if (screenName === 'report') {
            this.updateReportSummary();
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await this.parseFile(file);
            this.currentData = data;
            this.checkedCodes.clear();
            
            console.log(`Loaded ${data.length} codes from file`);
            this.showScreen('control');
            
        } catch (error) {
            alert('Dosya okunurken hata oluştu: ' + error.message);
        }
    }

    parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
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
                    
                    resolve(codes);
                } catch (error) {
                    reject(new Error('Dosya formatı desteklenmiyor'));
                }
            };
            
            reader.onerror = () => reject(new Error('Dosya okunamadı'));
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
        document.getElementById('file-input').value = '';
        this.showScreen('upload');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ListControlApp();
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