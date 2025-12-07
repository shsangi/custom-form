class AuthService {
    static async login(pin) {
        try {
            // Encrypt PIN
            const encryptedPin = this.encrypt(pin);
            
            // Admin project config
            const ADMIN_PROJECT = {
                url: 'https://kmtrpnkftfqkthlgfwob.supabase.co',
                key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdHJwbmtmdGZxa3RobGdmd29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTgzMzUsImV4cCI6MjA3OTE5NDMzNX0.6aL-nG-srGEqI18Sp5kVCW2mG5f4Z53gF-csMZ7gfI0'
            };
            
            // Query admin_public table
            const response = await fetch(
                `${ADMIN_PROJECT.url}/rest/v1/admin_public?pin_enc=eq.${encodeURIComponent(encryptedPin)}`,
                {
                    headers: {
                        'apikey': ADMIN_PROJECT.key,
                        'Authorization': `Bearer ${ADMIN_PROJECT.key}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Database connection failed');
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                throw new Error('Invalid PIN');
            }
            
            // Decrypt URL and API key
            const adminRecord = data[0];
            const decryptedUrl = this.decrypt(adminRecord.url_enc);
            const decryptedKey = this.decrypt(adminRecord.key_enc);
            
            if (!decryptedUrl || !decryptedKey) {
                throw new Error('Invalid configuration');
            }
            
            // Store configuration
            const config = {
                url: decryptedUrl,
                key: decryptedKey,
                table: 'family_data_responses_gsheet',
                adminRecord: adminRecord
            };
            
            localStorage.setItem('family_data_config', JSON.stringify(config));
            localStorage.setItem('family_data_pin', pin);
            
            return {
                success: true,
                config: config,
                pin: pin
            };
            
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    static logout() {
        localStorage.removeItem('family_data_config');
        localStorage.removeItem('family_data_pin');
        return true;
    }
    
    static isAuthenticated() {
        return localStorage.getItem('family_data_config') !== null;
    }
    
    static getCurrentConfig() {
        const config = localStorage.getItem('family_data_config');
        return config ? JSON.parse(config) : null;
    }
    
    static getCurrentPin() {
        return localStorage.getItem('family_data_pin');
    }
    
    static encrypt(text) {
        if (!text) return '';
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            
            // Lowercase letters
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
            
            // Uppercase letters
            else if (ch === 'A') result += 'O';
            else if (ch === 'B') result += 'K';
            else if (ch === 'C') result += 'X';
            else if (ch === 'D') result += 'Z';
            else if (ch === 'E') result += 'P';
            else if (ch === 'F') result += 'Q';
            else if (ch === 'G') result += 'R';
            else if (ch === 'H') result += 'S';
            else if (ch === 'I') result += 'T';
            else if (ch === 'J') result += 'U';
            else if (ch === 'K') result += 'V';
            else if (ch === 'L') result += 'W';
            else if (ch === 'M') result += 'A';
            else if (ch === 'N') result += 'B';
            else if (ch === 'O') result += 'C';
            else if (ch === 'P') result += 'D';
            else if (ch === 'Q') result += 'E';
            else if (ch === 'R') result += 'F';
            else if (ch === 'S') result += 'G';
            else if (ch === 'T') result += 'H';
            else if (ch === 'U') result += 'I';
            else if (ch === 'V') result += 'J';
            else if (ch === 'W') result += 'L';
            else if (ch === 'X') result += 'M';
            else if (ch === 'Y') result += 'N';
            else if (ch === 'Z') result += 'Y';
            
            // Numbers
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
            
            // Reverse mapping for lowercase
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
            
            // Reverse mapping for uppercase
            else if (ch === 'O') result += 'A';
            else if (ch === 'K') result += 'B';
            else if (ch === 'X') result += 'C';
            else if (ch === 'Z') result += 'D';
            else if (ch === 'P') result += 'E';
            else if (ch === 'Q') result += 'F';
            else if (ch === 'R') result += 'G';
            else if (ch === 'S') result += 'H';
            else if (ch === 'T') result += 'I';
            else if (ch === 'U') result += 'J';
            else if (ch === 'V') result += 'K';
            else if (ch === 'W') result += 'L';
            else if (ch === 'A') result += 'M';
            else if (ch === 'B') result += 'N';
            else if (ch === 'C') result += 'O';
            else if (ch === 'D') result += 'P';
            else if (ch === 'E') result += 'Q';
            else if (ch === 'F') result += 'R';
            else if (ch === 'G') result += 'S';
            else if (ch === 'H') result += 'T';
            else if (ch === 'I') result += 'U';
            else if (ch === 'J') result += 'V';
            else if (ch === 'L') result += 'W';
            else if (ch === 'M') result += 'X';
            else if (ch === 'N') result += 'Y';
            else if (ch === 'Y') result += 'Z';
            
            // Reverse mapping for numbers
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

// Make available globally
window.AuthService = AuthService;
