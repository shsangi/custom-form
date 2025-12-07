class UIManager {
    static async loadPage(pageName) {
        try {
            const response = await fetch(`pages/${pageName}.html`);
            const html = await response.text();
            document.getElementById('app-container').innerHTML = html;
            await this.initializePage(pageName);
        } catch (error) {
            this.showError('Failed to load page');
        }
    }
    
    static async initializePage(pageName) {
        switch(pageName) {
            case 'login':
                document.getElementById('login-form')?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleLogin();
                });
                document.getElementById('pin-input')?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.handleLogin();
                });
                break;
                
            case 'dashboard':
                if (!AuthService.isAuthenticated()) {
                    window.location.hash = '#login';
                    return;
                }
                const config = AuthService.getCurrentConfig();
                initDataService(config);
                await this.loadData();
                
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
                });
                
                document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadData());
                document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
                document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
                document.getElementById('prev-page')?.addEventListener('click', () => this.changePage(-1));
                document.getElementById('next-page')?.addEventListener('click', () => this.changePage(1));
                this.updateInfoTab();
                break;
                
            case 'form':
                const dateInput = document.getElementById('dated');
                if (dateInput) dateInput.valueAsDate = new Date();
                
                document.getElementById('data-form')?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleFormSubmit();
                });
                break;
        }
    }
    
    static async handleLogin() {
        const pin = document.getElementById('pin-input').value.trim();
        const alertDiv = document.getElementById('login-alert');
        
        if (!pin) {
            this.showAlert(alertDiv, 'Please enter PIN', 'error');
            return;
        }
        
        this.showAlert(alertDiv, 'Checking PIN...', 'info');
        const result = await AuthService.login(pin);
        
        if (result.success) {
            this.showAlert(alertDiv, '✅ Login successful!', 'success');
            setTimeout(() => window.location.hash = '#dashboard', 1000);
        } else {
            this.showAlert(alertDiv, `Login failed: ${result.error}`, 'error');
        }
    }
    
    static handleLogout() {
        AuthService.logout();
        window.location.hash = '#login';
    }
    
    static async loadData() {
        const loadingEl = document.getElementById('data-loading');
        const alertDiv = document.getElementById('data-alert');
        
        this.showLoading(loadingEl, true);
        this.showAlert(alertDiv, 'Loading data...', 'info');
        
        const service = getDataService();
        if (!service) {
            this.showAlert(alertDiv, 'Service not initialized', 'error');
            return;
        }
        
        const result = await service.fetchAllData();
        if (result.success) {
            this.updateStatistics();
            this.renderData();
            this.showAlert(alertDiv, `✅ Loaded ${result.totalRecords} records`, 'success');
        } else {
            this.showAlert(alertDiv, `Error: ${result.error}`, 'error');
        }
        
        this.showLoading(loadingEl, false);
    }
    
    static renderData() {
        const service = getDataService();
        if (!service) return;
        
        const pageData = service.getPageData();
        const tbody = document.getElementById('data-body');
        
        if (pageData.totalRecords === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No data found</td></tr>';
            return;
        }
        
        tbody.innerHTML = pageData.data.map(item => `
            <tr>
                <td><strong>${item.forms_sr_no || '-'}</strong></td>
                <td>${this.formatDate(item.dated)}</td>
                <td>${item.filled_by || '-'}</td>
                <td>${this.truncateText(item.todays_select_items_to_buy, 40)}</td>
                <td>${item.approximately_amount ? '₹' + parseFloat(item.approximately_amount).toFixed(2) : '-'}</td>
                <td>${this.truncateText(item.comments_about_today_purchase, 30)}</td>
                <td>
                    <button onclick="UIManager.deleteRecord(${item.id})" class="btn-danger" style="padding: 5px 10px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('page-info').textContent = 
            `Showing ${pageData.startIndex}-${pageData.endIndex} of ${pageData.totalRecords}`;
        document.getElementById('page-display').textContent = 
            `Page ${pageData.currentPage} of ${pageData.totalPages}`;
        
        document.getElementById('prev-page').disabled = pageData.currentPage <= 1;
        document.getElementById('next-page').disabled = pageData.currentPage >= pageData.totalPages;
    }
    
    static async handleFormSubmit() {
        const form = document.getElementById('data-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const alertDiv = document.getElementById('form-alert');
        
        if (!data.forms_sr_no || !data.dated || !data.filled_by || !data.approximately_amount || !data.todays_select_items_to_buy) {
            this.showAlert(alertDiv, 'Please fill all required fields', 'error');
            return;
        }
        
        data.dated = new Date(data.dated).toISOString();
        this.showAlert(alertDiv, 'Saving...', 'info');
        
        const service = getDataService();
        if (!service) {
            this.showAlert(alertDiv, 'Service not initialized', 'error');
            return;
        }
        
        const result = await service.createRecord(data);
        if (result.success) {
            this.showAlert(alertDiv, '✅ Saved successfully!', 'success');
            form.reset();
            document.getElementById('dated').valueAsDate = new Date();
            this.updateStatistics();
        } else {
            this.showAlert(alertDiv, `Error: ${result.error}`, 'error');
        }
    }
    
    static async deleteRecord(id) {
        if (!confirm('Delete this record?')) return;
        const service = getDataService();
        if (!service) return;
        
        const result = await service.deleteRecord(id);
        if (result.success) {
            this.updateStatistics();
            this.renderData();
        }
    }
    
    static exportData() {
        const service = getDataService();
        if (!service) return;
        
        const csv = service.exportToCSV();
        if (!csv) return;
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    static updateStatistics() {
        const service = getDataService();
        if (!service) return;
        
        const stats = service.getStatistics();
        document.getElementById('total-records').textContent = stats.totalRecords;
        document.getElementById('today-records').textContent = stats.todayRecords;
        document.getElementById('total-amount').textContent = `₹${stats.totalAmount.toFixed(2)}`;
        document.getElementById('unique-users').textContent = stats.uniqueUsers;
        document.getElementById('record-count').textContent = stats.totalRecords;
    }
    
    static updateInfoTab() {
        const config = AuthService.getCurrentConfig();
        const pin = AuthService.getCurrentPin();
        const service = getDataService();
        
        if (config && pin) {
            document.getElementById('info-pin').textContent = pin;
            document.getElementById('info-encrypted-pin').textContent = AuthService.encrypt(pin);
            document.getElementById('info-url').textContent = config.url;
            document.getElementById('info-api-key').textContent = config.key.substring(0, 30) + '...';
            
            if (service) {
                document.getElementById('current-page-info').textContent = service.currentPage;
                document.getElementById('total-pages-info').textContent = service.totalPages;
                document.getElementById('memory-records').textContent = service.totalRecords;
            }
        }
    }
    
    static switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}-tab`)?.classList.add('active');
        
        if (tabName === 'info') this.updateInfoTab();
    }
    
    static changePage(direction) {
        const service = getDataService();
        if (!service) return;
        
        const newPage = service.currentPage + direction;
        service.getPageData(newPage);
        this.renderData();
    }
    
    static showAlert(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `alert alert-${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000);
    }
    
    static showLoading(element, show) {
        if (element) element.style.display = show ? 'block' : 'none';
    }
    
    static formatDate(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-IN');
        } catch {
            return dateString;
        }
    }
    
    static truncateText(text, maxLength) {
        if (!text) return '-';
        return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
    }
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('load', handleHashChange);

async function handleHashChange() {
    const hash = window.location.hash.substring(1) || 'login';
    await UIManager.loadPage(hash);
}

window.UIManager = UIManager;