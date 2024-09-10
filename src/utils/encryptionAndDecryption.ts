import crypto from 'crypto';
import logger from './logger';

const algorithm = 'aes-256-cbc'; // Encryption algorithm

// Predefined static encryption key (32 bytes for AES-256) and IV (16 bytes)
const ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex'); // 32 bytes
const ENCRYPTION_IV = Buffer.from('abcdef9876543210abcdef9876543210', 'hex'); // 16 bytes

// Function to encrypt the password
export const encryptPassword = (password: string): string => {
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, ENCRYPTION_IV);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${ENCRYPTION_IV.toString('hex')}:${encrypted}`; // Store IV along with encrypted password
};

// Function to decrypt the password
export const decryptPassword = (encryptedPassword: string): string => {
    const [ivHex, encrypted] = encryptedPassword.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
