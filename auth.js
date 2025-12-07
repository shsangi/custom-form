const CONFIG = {
    ADMIN_PROJECT: {
        url: 'https://kmtrpnkftfqkthlgfwob.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdHJwbmtmdGZxa3RobGdmd29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTgzMzUsImV4cCI6MjA3OTE5NDMzNX0.6aL-nG-srGEqI18Sp5kVCW2mG5f4Z53gF-csMZ7gfI0'
    }
};

class AuthService {
    static async login(pin) {
        try {
            const encryptedPin = this.encrypt(pin);
            const response = await fetch(
                `${CONFIG.ADMIN_PROJECT.url}/rest/v1/admin_public?pin_enc=eq.${encodeURIComponent(encryptedPin)}`,
                {
                    headers: {
                        'apikey': CONFIG.ADMIN_PROJECT.key,
                        'Authorization': `Bearer ${CONFIG.ADMIN_PROJECT.key}`
                    }
                }
            );
            
            if (!response.ok) throw new Error(`Database error: ${response.status}`);
            const data = await response.json();
            
            if (data.length === 0) throw new Error('Invalid PIN');
            
            const adminRecord = data[0];
            const decryptedUrl = this.decrypt(adminRecord.url_enc);
            const decryptedKey = this.decrypt(adminRecord.key_enc);
            
            if (!decryptedUrl || !decryptedKey) throw new Error('Invalid admin record');
            
            const currentConfig = {
                url: decryptedUrl,
                key: decryptedKey,
                table: 'family_data_responses_gsheet',
                adminRecord: adminRecord
            };
            
            localStorage.setItem('project_config', JSON.stringify(currentConfig));
            localStorage.setItem('current_pin', pin);
            
            return { success: true, config: currentConfig, pin: pin };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    static logout() {
        localStorage.removeItem('project_config');
        localStorage.removeItem('current_pin');
        return true;
    }
    
    static isAuthenticated() {
        return localStorage.getItem('project_config') !== null;
    }
    
    static getCurrentConfig() {
        const config = localStorage.getItem('project_config');
        return config ? JSON.parse(config) : null;
    }
    
    static getCurrentPin() {
        return localStorage.getItem('current_pin');
    }
    
    static encrypt(text) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === 'a') result += 'o';
            else if (ch === 'b') result += 'k';
            else if (ch === 'c') result += 'x';
            else if (ch === 'd') result += 'z';
            else if (ch === 'e') result += 'p';
            else if (ch === 'f') result += 'q';
            else if (ch === 'g') result += 'r';
            else if (ch === 'h') result += 's';
            else if (ch === 'i') result += 't';
            else if (ch === 'j') result += 'u';
            else if (ch === 'k') result += 'v';
            else if (ch === 'l') result += 'w';
            else if (ch === 'm') result += 'a';
            else if (ch === 'n') result += 'b';
            else if (ch === 'o') result += 'c';
            else if (ch === 'p') result += 'd';
            else if (ch === 'q') result += 'e';
            else if (ch === 'r') result += 'f';
            else if (ch === 's') result += 'g';
            else if (ch === 't') result += 'h';
            else if (ch === 'u') result += 'i';
            else if (ch === 'v') result += 'j';
            else if (ch === 'w') result += 'l';
            else if (ch === 'x') result += 'm';
            else if (ch === 'y') result += 'n';
            else if (ch === 'z') result += 'y';
            else if (ch === '0') result += '7';
            else if (ch === '1') result += '8';
            else if (ch === '2') result += '9';
            else if (ch === '3') result += '4';
            else if (ch === '4') result += '5';
            else if (ch === '5') result += '6';
            else if (ch === '6') result += '0';
            else if (ch === '7') result += '1';
            else if (ch === '8') result += '2';
            else if (ch === '9') result += '3';
            else result += ch;
        }
        return result;
    }
    
    static decrypt(text) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (ch === 'o') result += 'a';
            else if (ch === 'k') result += 'b';
            else if (ch === 'x') result += 'c';
            else if (ch === 'z') result += 'd';
            else if (ch === 'p') result += 'e';
            else if (ch === 'q') result += 'f';
            else if (ch === 'r') result += 'g';
            else if (ch === 's') result += 'h';
            else if (ch === 't') result += 'i';
            else if (ch === 'u') result += 'j';
            else if (ch === 'v') result += 'k';
            else if (ch === 'w') result += 'l';
            else if (ch === 'a') result += 'm';
            else if (ch === 'b') result += 'n';
            else if (ch === 'c') result += 'o';
            else if (ch === 'd') result += 'p';
            else if (ch === 'e') result += 'q';
            else if (ch === 'f') result += 'r';
            else if (ch === 'g') result += 's';
            else if (ch === 'h') result += 't';
            else if (ch === 'i') result += 'u';
            else if (ch === 'j') result += 'v';
            else if (ch === 'l') result += 'w';
            else if (ch === 'm') result += 'x';
            else if (ch === 'n') result += 'y';
            else if (ch === 'y') result += 'z';
            else if (ch === '7') result += '0';
            else if (ch === '8') result += '1';
            else if (ch === '9') result += '2';
            else if (ch === '4') result += '3';
            else if (ch === '5') result += '4';
            else if (ch === '6') result += '5';
            else if (ch === '0') result += '6';
            else if (ch === '1') result += '7';
            else if (ch === '2') result += '8';
            else if (ch === '3') result += '9';
            else result += ch;
        }
        return result;
    }
}

window.AuthService = AuthService;