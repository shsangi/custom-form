class DataService {
    constructor(config) {
        this.config = config;
        this.allData = [];
        this.currentPage = 1;
        this.recordsPerPage = 50;
        this.totalPages = 1;
        this.totalRecords = 0;
    }

    async fetchAllData() {
        try {
            const batchSize = 1000;
            this.allData = [];
            let offset = 0;
            let hasMore = true;
            
            while (hasMore) {
                const response = await fetch(
                    `${this.config.url}/rest/v1/${this.config.table}?order=timestamp.desc&limit=${batchSize}&offset=${offset}`,
                    {
                        headers: {
                            'apikey': this.config.key,
                            'Authorization': `Bearer ${this.config.key}`
                        }
                    }
                );
                
                if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
                const batchData = await response.json();
                this.allData = this.allData.concat(batchData);
                
                if (batchData.length < batchSize) hasMore = false;
                else {
                    offset += batchSize;
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            this.totalRecords = this.allData.length;
            this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
            return { success: true, data: this.allData, totalRecords: this.totalRecords };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getPageData(page = 1) {
        this.currentPage = Math.max(1, Math.min(page, this.totalPages));
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = Math.min(startIndex + this.recordsPerPage, this.totalRecords);
        
        return {
            data: this.allData.slice(startIndex, endIndex),
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalRecords: this.totalRecords,
            startIndex: startIndex + 1,
            endIndex: endIndex
        };
    }

    async createRecord(data) {
        try {
            data.timestamp = new Date().toISOString();
            const response = await fetch(
                `${this.config.url}/rest/v1/${this.config.table}`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.key,
                        'Authorization': `Bearer ${this.config.key}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                }
            );
            
            if (!response.ok) throw new Error(`Failed to save: ${response.status}`);
            const savedData = await response.json();
            
            this.allData.unshift(savedData[0]);
            this.totalRecords++;
            this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
            return { success: true, data: savedData[0] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteRecord(id) {
        try {
            const response = await fetch(
                `${this.config.url}/rest/v1/${this.config.table}?id=eq.${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': this.config.key,
                        'Authorization': `Bearer ${this.config.key}`
                    }
                }
            );
            
            if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);
            this.allData = this.allData.filter(item => item.id !== id);
            this.totalRecords--;
            this.totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    exportToCSV() {
        if (this.allData.length === 0) return null;
        const headers = ['SR No', 'Date', 'Filled By', 'Items', 'Amount', 'Comments'];
        const csv = [
            headers.join(','),
            ...this.allData.map(item => [
                item.forms_sr_no,
                item.dated,
                item.filled_by,
                `"${(item.todays_select_items_to_buy || '').replace(/"/g, '""')}"`,
                item.approximately_amount || '',
                `"${(item.comments_about_today_purchase || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');
        return csv;
    }

    getStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.allData.filter(item => {
            if (!item.dated) return false;
            return new Date(item.dated).toISOString().split('T')[0] === today;
        }).length;
        
        const totalAmount = this.allData.reduce((sum, item) => sum + (parseFloat(item.approximately_amount) || 0), 0);
        const uniqueUsers = [...new Set(this.allData.map(item => item.filled_by).filter(Boolean))];
        
        return {
            totalRecords: this.totalRecords,
            todayRecords: todayCount,
            totalAmount: totalAmount,
            uniqueUsers: uniqueUsers.length
        };
    }
}

let dataService = null;
function initDataService(config) {
    dataService = new DataService(config);
    return dataService;
}
function getDataService() {
    return dataService;
}

window.initDataService = initDataService;
window.getDataService = getDataService;