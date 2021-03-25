const stringToAesKey = (key) => {
    if (key.length == 0 || key.length > 32) {
        return -1;
    }
    else if (key.length < 16) {
        const buffer16 = new ArrayBuffer(16);
        const uintKey16 = new Uint8Array(buffer16);
        uintKey16.set(key, 0);
        return uintKey16;
    }
    else if (key.length < 24) {
        const buffer24 = new ArrayBuffer(24);
        const uintKey24 = new Uint8Array(buffer24);
        uintKey24.set(key, 0);
        return uintKey24;
    }
    else if (key.length < 32) {
        const buffer32 = new ArrayBuffer(32);
        const uintKey32 = new Uint8Array(buffer32);
        uintKey32.set(key, 0);
        return uintKey32;
    }
    else {
        return -1;
    }
}

module.exports = stringToAesKey;