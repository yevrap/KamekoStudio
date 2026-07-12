import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Guard localStorage keys', async (t) => {
    // 1. Get clearAllGameData lists from shared/settings.js
    const settingsPath = path.join(process.cwd(), 'shared', 'settings.js');
    const settingsCode = fs.readFileSync(settingsPath, 'utf-8');
    
    const exactKeysMatch = settingsCode.match(/const keysToRemove = \[([\s\S]*?)\];/);
    const prefixKeysMatch = settingsCode.match(/const prefixesToRemove = \[([\s\S]*?)\];/);
    
    assert(exactKeysMatch, 'Could not find keysToRemove in settings.js');
    assert(prefixKeysMatch, 'Could not find prefixesToRemove in settings.js');
    
    // Clean up comments and extract raw strings
    const extractArrayStrings = (raw) => {
        return raw.split('\n')
            .map(line => line.replace(/\/\/.*/, '').trim())
            .join('')
            .split(',')
            .map(s => s.trim().replace(/^'|'$/g, ''))
            .filter(Boolean);
    };
    
    const exactKeys = extractArrayStrings(exactKeysMatch[1]);
    const prefixKeys = extractArrayStrings(prefixKeysMatch[1]);
    
    // 2. Find all source files
    const srcFiles = [];
    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                scanDir(path.join(dir, entry.name));
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
                srcFiles.push(path.join(dir, entry.name));
            }
        }
    }
    
    scanDir(path.join(process.cwd(), 'shared'));
    scanDir(path.join(process.cwd(), 'games'));
    if (fs.existsSync(path.join(process.cwd(), 'index.html'))) {
        srcFiles.push(path.join(process.cwd(), 'index.html'));
    }
    if (fs.existsSync(path.join(process.cwd(), '3d.html'))) {
        srcFiles.push(path.join(process.cwd(), '3d.html'));
    }
    
    // 3. Extract keys
    const foundKeys = new Set();
    const foundPrefixes = new Set();
    
    for (const file of srcFiles) {
        const code = fs.readFileSync(file, 'utf-8');
        // Match literal strings: localStorage.getItem('foo')
        const exactMatches = code.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\('([^']+)'\)/g);
        for (const match of exactMatches) {
            foundKeys.add(match[1]);
        }
        
        // Match concatenation pattern: localStorage.getItem('prefix_' + var)
        const prefixMatches = code.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\('([^']+)'\s*\+/g);
        for (const match of prefixMatches) {
            foundPrefixes.add(match[1]);
        }
    }
    
    // 4. Verify coverage
    const missingExact = [];
    for (const key of foundKeys) {
        if (exactKeys.includes(key)) continue;
        let covered = false;
        for (const prefix of prefixKeys) {
            if (key.startsWith(prefix)) {
                covered = true;
                break;
            }
        }
        if (!covered) {
            missingExact.push(key);
        }
    }
    
    const missingPrefix = [];
    // durak_name_ is combined dynamically into durak_name_ai_ and durak_name_hotseat_, which are both in prefixesToRemove
    // lastPlayed_ is combined dynamically, but all games are explicitly listed in exactKeys
    const allowedPrefixes = ['durak_name_', 'lastPlayed_']; 
    
    for (const prefix of foundPrefixes) {
        if (!prefixKeys.includes(prefix) && !allowedPrefixes.includes(prefix)) {
            missingPrefix.push(prefix);
        }
    }
    
    assert.deepEqual(missingExact, [], `Found localStorage exact keys not covered by clearAllGameData: ${missingExact.join(', ')}`);
    assert.deepEqual(missingPrefix, [], `Found localStorage prefix keys not covered by clearAllGameData: ${missingPrefix.join(', ')}`);
});
