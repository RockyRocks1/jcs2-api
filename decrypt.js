/**
 * Helper to force numbers to behave like 24-bit unsigned integers.
 */
function mask24(value) {
    return (value & 0xffffff) >>> 0;
}

/**
 * Decrypts a raw binary TrueAxis packet buffer back into readable components.
 * * @param {Buffer} buffer - The raw binary buffer intercepted from the network request
 * @returns {object} An object containing the gameId, the parsed endpoint, and the POST body data
 */
function decryptTaPacket(buffer) {
    // 1. Basic sanity bounds check
    if (buffer.length < 0x11) {
        throw new Error("Buffer too small to contain valid TrueAxis packet headers.");
    }

    const gameId = buffer[8];

    // 2. Extract initial Session Seeds straight from the unencrypted header bytes
    const ses_SeedC = buffer[2];
    const ses_SeedA = buffer[4];
    const ses_SeedB = buffer[6];

    // 3. Safely extract the exact endpoint length from byte 0x0d
    // Original encryption: encrypted_0xd = ses_SeedA ^ ses_SeedC ^ ses_SeedB ^ (endpointLen & 0xff)
    const endpointLen = (buffer[0xd] ^ ses_SeedA ^ ses_SeedC ^ ses_SeedB) & 0xff;

    // 4. Reconstruct the base global tracking seeds from session tokens
    const old_SeedC = mask24(ses_SeedC - 0x11);
    const old_SeedA = mask24(ses_SeedA - 0x2b);
    const old_SeedB = mask24(ses_SeedB - 9);

    // 5. Walk through the exact setup mutations to sync active keys with Loop 1 entry
    let uVar4 = (endpointLen >> 8) & 0xff; 
    let cipher_ses_SeedC = mask24(old_SeedA + (endpointLen & 0xff) + 0x61bfe);
    let uVar5 = (endpointLen >> 16) & 0xff;
    let cipher_ses_SeedB = mask24(uVar4 + cipher_ses_SeedC + 0x61bd3);
    let cipher_ses_SeedA = mask24(old_SeedB + (buffer[0xd] & 0xff) + 0x46);
    
    let uVar9 = mask24(old_SeedC + 0x8205); // Core loop iteration key
    let uVar3 = mask24(uVar5 + cipher_ses_SeedB + 0x61bd3);
    
    let active_SeedC = mask24(uVar4 ^ mask24(old_SeedC + 0x208e) ^ cipher_ses_SeedC ^ cipher_ses_SeedA);
    
    active_SeedC = mask24(cipher_ses_SeedA + (active_SeedC & 0xff) + 0x3d);
    let active_SeedA = mask24(((endpointLen >> 24) & 0xff) + uVar3 + 0x61bd3);
    let active_SeedB = mask24(uVar5 ^ mask24(old_SeedC + 0x410b) ^ cipher_ses_SeedB ^ active_SeedC);
    
    active_SeedC = mask24(active_SeedC + (active_SeedB & 0xff) + 0x3d);
    active_SeedB = mask24(((endpointLen >> 24) & 0xff) ^ mask24(old_SeedC + 0x6188) ^ uVar3 ^ active_SeedC);
    active_SeedC = mask24(active_SeedC + (active_SeedB & 0xff) + 0x3d);

    // 6. Loop 1 Reversal: Count-bounded decryption of the Endpoint String
    let endpointStr = "";
    const endpointBufferOffset = 0x11;

    for (let i = 0; i < endpointLen; i++) {
        let encryptedChar = buffer[endpointBufferOffset + i];

        // Inverse XOR logic using synced running keys
        let rawChar = mask24(uVar9 ^ encryptedChar ^ active_SeedA ^ active_SeedC) & 0xff;
        endpointStr += String.fromCharCode(rawChar);

        // State Machine Step Mutations
        let loop_old_SeedC = mask24(rawChar + 0x61bd3);
        uVar9 = mask24(uVar9 + 0x207d);
        active_SeedA = mask24(loop_old_SeedC + active_SeedA);
        active_SeedC = mask24(active_SeedC + (encryptedChar & 0xff) + 0x3d);
    }

    // 7. Advance state seeds through the 4-byte obfuscated body length fields
    const currentBufferOffset = endpointBufferOffset + endpointLen;
    
    // First we calculate the actual length of the body to guide the length block mutations
    const bodyOffset = currentBufferOffset + 4;
    // Account for 2 trailing footer checksum bytes at the very end of the buffer
    const bodyLength = buffer.length - bodyOffset - 2;

    if (bodyLength < 0) {
        throw new Error("Malformed packet structure: computed body layout overflows buffer boundaries.");
    }
    
    // Byte 0 Mutation Flow
    let body_b0 = buffer[currentBufferOffset];
    let rawBodyLenByte0 = mask24(uVar9 ^ body_b0 ^ active_SeedA ^ active_SeedC) & 0xff;
    active_SeedA = mask24(rawBodyLenByte0 + 0x61bd3 + active_SeedA);
    let uVar3_len = mask24(((bodyLength >> 8) & 0xff) + 0x61bd3 + active_SeedA); 
    let uVar4_len = mask24(((bodyLength >> 16) & 0xff) + 0x61bd3 + uVar3_len);
    
    active_SeedC = mask24(active_SeedC + (body_b0 & 0xff) + 0x3d);
    
    // Byte 1 Mutation Flow
    let len_b1 = buffer[currentBufferOffset + 1];
    active_SeedA = mask24(mask24(uVar9 + 0x207d) ^ ((bodyLength >> 8) & 0xff) ^ active_SeedA ^ active_SeedC);
    active_SeedC = mask24(active_SeedC + (len_b1 & 0xff) + 0x3d);
    
    // Byte 2 Mutation Flow
    let len_b2 = buffer[currentBufferOffset + 2];
    active_SeedA = mask24(mask24(uVar9 + 0x40fa) ^ ((bodyLength >> 16) & 0xff) ^ uVar3_len ^ active_SeedC);
    active_SeedC = mask24(active_SeedC + (len_b2 & 0xff) + 0x3d);
    
    // Byte 3 Mutation Flow
    let len_b3 = buffer[currentBufferOffset + 3];
    active_SeedA = mask24(((bodyLength >> 24) & 0xff) + 0x61bd3 + uVar4_len);
    active_SeedC = mask24(active_SeedC + (len_b3 & 0xff) + 0x3d);
    
    // Finalize Seed B assignment from compiler snapshot right prior to Loop 2 execution
    active_SeedB = mask24(uVar9 + 0x81f4);

    // 8. Loop 2 Reversal: Decrypt Request Body Data Parameters
    const requestBodyBuffer = Buffer.alloc(bodyLength);
    
    for (let i = 0; i < bodyLength; i++) {
        let encryptedBodyChar = buffer[bodyOffset + i];

        // Inverse stream math remains the same
        let rawBodyByte = mask24(encryptedBodyChar ^ active_SeedA ^ active_SeedC ^ active_SeedB) & 0xff;
        requestBodyBuffer[i] = rawBodyByte;

        // Keep cipher streaming synchronized
        active_SeedB = mask24(active_SeedB + 0x207d);
        active_SeedA = mask24(rawBodyByte + 0x61bd3 + active_SeedA);
        active_SeedC = mask24(active_SeedC + (encryptedBodyChar & 0xff) + 0x3d);
    }

    return {
        gameId: gameId,
        endpoint: endpointStr,
        // Return both format variants so you can parse strings OR pass binary blobs to zlib
        parametersStr: requestBodyBuffer.toString('binary'), 
        parametersBuffer: requestBodyBuffer
    };
}

module.exports = { decryptTaPacket };