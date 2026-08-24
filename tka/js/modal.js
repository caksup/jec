// js/modal.js
// ==========================================
// MODAL CUSTOM - Pengganti alert/confirm/prompt bawaan browser
// ==========================================

const Modal = {
    container: null,
    
    // Inisialisasi container modal (dipanggil sekali saat DOM ready)
    init: function() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'custom-modal-container';
        this.container.innerHTML = `
            <style>
                #custom-modal-container {
                    position: fixed; inset: 0; z-index: 9999;
                    display: none; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                    padding: 20px; animation: modalFadeIn 0.2s ease;
                }
                #custom-modal-container.active { display: flex; }
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-box {
                    background: #fff; border-radius: 16px;
                    max-width: 420px; width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                    animation: modalSlideIn 0.3s ease;
                }
                .modal-header {
                    display: flex; align-items: center; gap: 12px;
                    padding: 20px 24px 12px;
                }
                .modal-icon {
                    width: 48px; height: 48px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .modal-icon .material-symbols-rounded { font-size: 28px; color: #fff; }
                .modal-icon.info { background: linear-gradient(135deg, #2196F3, #1976D2); }
                .modal-icon.success { background: linear-gradient(135deg, #4CAF50, #388E3C); }
                .modal-icon.warning { background: linear-gradient(135deg, #FF9800, #F57C00); }
                .modal-icon.danger { background: linear-gradient(135deg, #F44336, #D32F2F); }
                .modal-icon.question { background: linear-gradient(135deg, #9C27B0, #7B1FA2); }
                .modal-title {
                    font-size: 1.1rem; font-weight: 700; color: #1a1a1a;
                    margin: 0; flex: 1;
                }
                .modal-body {
                    padding: 0 24px 16px;
                    color: #444; font-size: 0.95rem; line-height: 1.5;
                    white-space: pre-wrap; word-wrap: break-word;
                }
                .modal-input {
                    margin: 12px 24px;
                }
                .modal-input input, .modal-input textarea {
                    width: 100%; padding: 10px 14px;
                    border: 2px solid #e0e0e0; border-radius: 8px;
                    font-size: 0.95rem; font-family: inherit;
                    transition: 0.2s; box-sizing: border-box;
                }
                .modal-input input:focus, .modal-input textarea:focus {
                    outline: none; border-color: #2196F3;
                }
                .modal-input textarea { min-height: 100px; resize: vertical; }
                .modal-footer {
                    display: flex; gap: 10px;
                    padding: 16px 24px;
                    background: #f8f9fa;
                    justify-content: flex-end;
                }
                .modal-btn {
                    padding: 10px 20px;
                    border: none; border-radius: 8px;
                    font-size: 0.95rem; font-weight: 600;
                    cursor: pointer; transition: 0.2s;
                    display: flex; align-items: center; gap: 6px;
                    font-family: inherit;
                }
                .modal-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .modal-btn.primary { background: #2196F3; color: #fff; }
                .modal-btn.success { background: #4CAF50; color: #fff; }
                .modal-btn.danger { background: #F44336; color: #fff; }
                .modal-btn.cancel { background: #e0e0e0; color: #444; }
                .modal-btn .material-symbols-rounded { font-size: 18px; }

                /* Toast (notifikasi kecil) */
                #custom-toast-container {
                    position: fixed; top: 20px; right: 20px; z-index: 9998;
                    display: flex; flex-direction: column; gap: 10px;
                    max-width: 360px;
                }
                .toast {
                    background: #fff; border-radius: 10px;
                    padding: 14px 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    display: flex; align-items: center; gap: 12px;
                    animation: toastSlideIn 0.3s ease;
                    border-left: 4px solid;
                }
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .toast.success { border-color: #4CAF50; }
                .toast.danger { border-color: #F44336; }
                .toast.info { border-color: #2196F3; }
                .toast.warning { border-color: #FF9800; }
                .toast-icon {
                    width: 32px; height: 32px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .toast-icon .material-symbols-rounded { color: #fff; font-size: 20px; }
                .toast.success .toast-icon { background: #4CAF50; }
                .toast.danger .toast-icon { background: #F44336; }
                .toast.info .toast-icon { background: #2196F3; }
                .toast.warning .toast-icon { background: #FF9800; }
                .toast-content { flex: 1; font-size: 0.9rem; color: #333; }
                .toast-title { font-weight: 600; margin-bottom: 2px; }
            </style>
            <div class="modal-box">
                <div class="modal-header">
                    <div class="modal-icon"><span class="material-symbols-rounded"></span></div>
                    <h3 class="modal-title"></h3>
                </div>
                <div class="modal-body"></div>
                <div class="modal-input hidden"></div>
                <div class="modal-footer"></div>
            </div>
        `;
        document.body.appendChild(this.container);
        
        // Toast container
        if (!document.getElementById('custom-toast-container')) {
            const toast = document.createElement('div');
            toast.id = 'custom-toast-container';
            document.body.appendChild(toast);
        }
    },
    
    // Tutup modal
    close: function() {
        if (this.container) this.container.classList.remove('active');
    },
    
    // Tampilkan modal
    show: function(options) {
        this.init();
        const box = this.container.querySelector('.modal-box');
        const icon = box.querySelector('.modal-icon');
        const iconSpan = icon.querySelector('.material-symbols-rounded');
        const title = box.querySelector('.modal-title');
        const body = box.querySelector('.modal-body');
        const inputWrap = box.querySelector('.modal-input');
        const footer = box.querySelector('.modal-footer');
        
        // Reset
        icon.className = 'modal-icon ' + (options.type || 'info');
        iconSpan.innerText = options.icon || 'info';
        title.innerText = options.title || '';
        body.innerText = options.message || '';
        inputWrap.innerHTML = '';
        inputWrap.classList.add('hidden');
        footer.innerHTML = '';
        
        // Input field (untuk prompt)
        if (options.input !== undefined) {
            inputWrap.classList.remove('hidden');
            if (options.multiline) {
                inputWrap.innerHTML = `<textarea placeholder="${options.placeholder || ''}">${options.defaultValue || ''}</textarea>`;
            } else {
                inputWrap.innerHTML = `<input type="${options.inputType || 'text'}" placeholder="${options.placeholder || ''}" value="${options.defaultValue || ''}">`;
            }
        }
        
        // Tombol
        const buttons = options.buttons || [{ label: 'OK', class: 'primary', value: true }];
        buttons.forEach(btn => {
            const b = document.createElement('button');
            b.className = 'modal-btn ' + (btn.class || 'primary');
            b.innerHTML = (btn.icon ? `<span class="material-symbols-rounded">${btn.icon}</span>` : '') + btn.label;
            b.onclick = () => {
                let value = btn.value;
                // Hanya baca isi input jika tombol ini memang diminta membaca input (readInput)
                if (options.input !== undefined && btn.readInput) {
                    const input = inputWrap.querySelector('input, textarea');
                    value = input ? input.value : null;
                }
                if (options.onConfirm) options.onConfirm(value);
                this.close();
            };
            footer.appendChild(b);
        });
        
        this.container.classList.add('active');
        
        // Focus input jika ada
        if (options.input !== undefined) {
            setTimeout(() => {
                const input = inputWrap.querySelector('input, textarea');
                if (input) input.focus();
            }, 100);
        }
    },
    
    // Shortcut: alert
    alert: function(message, options = {}) {
        return new Promise(resolve => {
            this.show({
                type: options.type || 'info',
                icon: options.icon || 'info',
                title: options.title || 'Informasi',
                message: message,
                buttons: [{ label: 'OK', class: 'primary', icon: 'check', value: true }],
                onConfirm: resolve
            });
        });
    },
    
    // Shortcut: confirm (yes/no)
    confirm: function(message, options = {}) {
        return new Promise(resolve => {
            this.show({
                type: options.type || 'question',
                icon: options.icon || 'help',
                title: options.title || 'Konfirmasi',
                message: message,
                buttons: [
                    { label: 'Batal', class: 'cancel', icon: 'close', value: false },
                    { label: options.confirmLabel || 'Ya', class: options.confirmClass || 'primary', icon: 'check', value: true }
                ],
                onConfirm: resolve
            });
        });
    },
    
    // Shortcut: prompt (input)
    prompt: function(message, options = {}) {
        return new Promise(resolve => {
            this.show({
                type: options.type || 'info',
                icon: options.icon || 'edit',
                title: options.title || 'Input',
                message: message,
                input: true,
                inputType: options.inputType || 'text',
                multiline: options.multiline || false,
                placeholder: options.placeholder || '',
                defaultValue: options.defaultValue || '',
                buttons: [
                    { label: 'Batal', class: 'cancel', icon: 'close', value: null },
                    { label: 'Simpan', class: 'primary', icon: 'save', value: true, readInput: true }
                ],
                onConfirm: (value) => {
                    resolve(value === true ? null : value);
                }
            });
        });
    },
    
    // Shortcut: toast (notifikasi kecil di kanan atas)
    toast: function(title, message, type = 'success') {
        if (!document.getElementById('custom-toast-container')) {
            const toast = document.createElement('div');
            toast.id = 'custom-toast-container';
            document.body.appendChild(toast);
        }
        const container = document.getElementById('custom-toast-container');
        const icons = {
            success: 'check_circle',
            danger: 'error',
            info: 'info',
            warning: 'warning'
        };
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        el.innerHTML = `
            <div class="toast-icon"><span class="material-symbols-rounded">${icons[type] || 'info'}</span></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div>${message}</div>
            </div>
        `;
        container.appendChild(el);
        setTimeout(() => {
            el.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => el.remove(), 300);
        }, 3500);
    }
};

// Export global untuk menggantikan native
window.alert = function(msg) { return Modal.alert(msg); };
window.confirm = function(msg) { return Modal.confirm(msg); };
window.prompt = function(msg, def) { return Modal.prompt(msg, { defaultValue: def }); };

// Init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Modal.init();
});