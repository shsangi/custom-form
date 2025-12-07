class UIManager {
    static async loadPage(pageName) {
        try {
            const response = await fetch(`pages/${pageName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${pageName}`);
            }
            
            const html = await response.text();
            document.getElementById('app-container').innerHTML = html;
            
            // Initialize page-specific JavaScript
            await this.initializePage(pageName);
            
        } catch (error) {
            console.error('Page load error:', error);
            this.showError('Failed to load page. Please refresh.');
        }
    }
    
    static async initializePage(pageName) {
        switch(pageName) {
            case 'login':
                await this.initializeLoginPage();
                break;
            case 'dashboard':
                await this.initializeDashboardPage();
                break;
            case 'form':
                await this.initializeFormPage();
                break;
        }
    }
    
    static async initializeLoginPage() {
        // Add event listener for login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }
        
        // Add Enter key support
        const pinInput = document.getElementById('pin-input');
        if (pinInput) {
            pinInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }
    }
    
    static async initializeDashboardPage() {
        // Check authentication
        if (!AuthService.isAuthenticated()) {
            window.location.hash = '#login';
            return;
        }
        
        // Initialize data service
        const config = AuthService.getCurrentConfig();
        initDataService(config);
        
        // Load data
        await this.loadData();
        
        // Set up tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Set up control buttons
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.loadData());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportData());
        document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout());
        
        // Set up pagination
        document.getElementById('prev-page')?.addEventListener('click', () => this.changePage(-1));
        document.getElementById('next-page')?.addEventListener('click', () => this.changePage(1));
        
        // Update info tab
        this.updateInfoTab();
    }
    
    static async initializeFormPage() {
        // Check authentication
        if (!AuthService.isAuthenticated()) {
            window.location.hash = '#login';
            return;
        }
        
        // Set today's date
        const dateInput = document.getElementById('dated');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        
        // Handle form submission
        const form = document.getElementById('data-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmit();
            });
        }
    }
    
    static async handleLogin() {
        const pinInput = document.getElementById('pin-input');
        const pin = pinInput.value.trim();
        const alertDiv = document.getElementById('login-alert');
        
        if (!pin) {
            this.showAlert(alertDiv, 'Please enter a PIN', 'error');
            return;
        }
        
        this.showAlert(alertDiv, '🔍 Encrypting PIN and checking database...', 'info');
        
        const result = await AuthService.login(pin);
        
        if (result.success) {
            this.showAlert(alertDiv, '✅ Login successful! Loading dashboard...', 'success');
            setTimeout(() => {
                window.location.hash = '#dashboard';
            }, 1000);
        } else {
            this.showAlert(alertDiv, `Login failed: ${result.error}`, 'error');
        }
    }
    
    static async handleLogout() {
        AuthService.logout();
        window.location.hash = '#login';
    }
    
    static async loadData() {
        const loadingEl = document.getElementById('data-loading');
        const alertDiv = document.getElementById('data-alert');
        
        this.showLoading(loadingEl, true);
        this.showAlert(alertDiv, 'Loading data from your project...', 'info');
        
        const service = getDataService();
        if (!service) {
            this.showAlert(alertDiv, 'Data service not initialized', 'error');
            return;
        }
        
        const result = await service.fetchAllData();
        
        if (result.success) {
            this.updateStatistics();
            this.renderData();
            this.showAlert(alertDiv, `✅ Successfully loaded ${result.totalRecords} records`, 'success');
        } else {
            this.showAlert(alertDiv, `Error loading data: ${result.error}`, 'error');
        }
        
        this.showLoading(loadingEl, false);
    }
    
    static renderData() {
        const service = getDataService();
        if (!service) return;
        
        const pageData = service.getPageData();
        const tbody = document.getElementById('data-body');
        
        if (pageData.totalRecords === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 40px; color: #64748b;">
                        📭 No data found in your project
                    </td>
                </tr>
            `;
            this.updatePaginationControls();
            return;
        }
        
        tbody.innerHTML = pageData.data.map(item => `
            <tr>
                <td><strong>${item.forms_sr_no || '-'}</strong></td>
                <td>${this.formatDate(item.dated)}</td>
                <td>${item.filled_by || '-'}</td>
                <td title="${item.todays_select_items_to_buy || ''}">
                    ${this.truncateText(item.todays_select_items_to_buy, 40)}
                </td>
                <td>${item.approximately_amount ? '₹' + parseFloat(item.approximately_amount).toFixed(2) : '-'}</td>
                <td>${this.truncateText(item.comments_about_today_purchase, 30)}</td>
                <td>
                    <button onclick="UIManager.deleteRecord(${item.id})" 
                            class="btn-danger" 
                            style="padding: 5px 10px; font-size: 12px;">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Update pagination info
        const pageInfo = document.getElementById('page-info');
        const pageDisplay = document.getElementById('page-display');
        
        if (pageInfo) {
            pageInfo.textContent = `Showing ${pageData.startIndex}-${pageData.endIndex} of ${pageData.totalRecords} records`;
        }
        
        if (pageDisplay) {
            pageDisplay.textContent = `Page ${pageData.currentPage} of ${pageData.totalPages}`;
        }
        
        this.updatePaginationControls();
    }
    
    static async handleFormSubmit() {
        const form = document.getElementById('data-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const alertDiv = document.getElementById('form-alert');
        
        // Validate required fields
        const required = ['forms_sr_no', 'dated', 'filled_by', 'approximately_amount', 'todays_select_items_to_buy'];
        for (const field of required) {
            if (!data[field]) {
                this.showAlert(alertDiv, `Please fill in the ${field.replace(/_/g, ' ')} field`, 'error');
                return;
            }
        }
        
        // Convert date to ISO string
        if (data.dated) {
            data.dated = new Date(data.dated).toISOString();
        }
        
        this.showAlert(alertDiv, 'Saving data to your project...', 'info');
        
        const service = getDataService();
        if (!service) {
            this.showAlert(alertDiv, 'Data service not initialized', 'error');
            return;
        }
        
        const result = await service.createRecord(data);
        
        if (result.success) {
            this.showAlert(alertDiv, '✅ Data saved successfully!', 'success');
            form.reset();
            
            // Set today's date again
            const dateInput = document.getElementById('dated');
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
            
            // Update statistics
            this.updateStatistics();
            
            // If on dashboard, refresh data display
            if (window.location.hash === '#dashboard') {
                this.renderData();
            }
        } else {
            this.showAlert(alertDiv, `Error saving data: ${result.error}`, 'error');
        }
    }
    
    static async deleteRecord(id) {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }
        
        const alertDiv = document.getElementById('data-alert');
        this.showAlert(alertDiv, 'Deleting record...', 'info');
        
        const service = getDataService();
        if (!service) {
            this.showAlert(alertDiv, 'Data service not initialized', 'error');
            return;
        }
        
        const result = await service.deleteRecord(id);
        
        if (result.success) {
            this.showAlert(alertDiv, '✅ Record deleted successfully!', 'success');
            this.updateStatistics();
            this.renderData();
        } else {
            this.showAlert(alertDiv, `Error deleting record: ${result.error}`, 'error');
        }
    }
    
    static exportData() {
        const service = getDataService();
        if (!service) {
            this.showAlert(document.getElementById('data-alert'), 'Data service not initialized', 'error');
            return;
        }
        
        const csv = service.exportToCSV();
        if (!csv) {
            this.showAlert(document.getElementById('data-alert'), 'No data to export', 'error');
            return;
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family_data_${AuthService.getCurrentPin()}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert(document.getElementById('data-alert'), `✅ Exported ${service.totalRecords} records to CSV`, 'success');
    }
    
    static updateStatistics() {
        const service = getDataService();
        if (!service) return;
        
        const stats = service.getStatistics();
        
        document.getElementById('total-records').textContent = stats.totalRecords;
        document.getElementById('today-records').textContent = stats.todayRecords;
        document.getElementById('total-amount').textContent = `₹${stats.totalAmount.toFixed(2)}`;
        document.getElementById('unique-users').textContent = stats.uniqueUsers;
        
        // Update record count in connection info
        const recordCount = document.getElementById('record-count');
        if (recordCount) {
            recordCount.textContent = stats.totalRecords;
        }
    }
    
    static updateInfoTab() {
        const config = AuthService.getCurrentConfig();
        const pin = AuthService.getCurrentPin();
        const service = getDataService();
        
        if (!config || !pin) return;
        
        // Login info
        document.getElementById('info-pin').textContent = pin;
        document.getElementById('info-encrypted-pin').textContent = AuthService.encrypt(pin);
        
        // Project info
        document.getElementById('info-url').textContent = config.url;
        document.getElementById('info-api-key').textContent = 
            config.key.substring(0, 30) + '...';
        
        // Encryption demo
        document.getElementById('original-url').textContent = 
            config.adminRecord?.url_enc ? AuthService.decrypt(config.adminRecord.url_enc) : '-';
        document.getElementById('encrypted-url').textContent = 
            config.adminRecord?.url_enc || '-';
        document.getElementById('original-key').textContent = 
            config.adminRecord?.key_enc ? AuthService.decrypt(config.adminRecord.key_enc).substring(0, 30) + '...' : '-';
        document.getElementById('encrypted-key').textContent = 
            config.adminRecord?.key_enc?.substring(0, 30) + '...' || '-';
        
        // Load strategy info
        if (service) {
            document.getElementById('current-page-info').textContent = service.currentPage;
            document.getElementById('total-pages-info').textContent = service.totalPages;
            document.getElementById('memory-records').textContent = service.totalRecords;
            document.getElementById('info-total-records').textContent = service.totalRecords;
