/**
 * Helper to force numbers to behave like 24-bit unsigned integers.
 */
function mask24(value) {
    return (value & 0xffffff) >>> 0;
}

/**
 * Encrypts a target URL and request body into the proprietary TrueAxis packet format.
 * * @param {number} gameId - The ID of the game (g_gameId from the binary)
 * @param {string} targetUrl - The full destination URL (e.g., 'https://connect.trueaxis.com/someScript.php')
 * @param {string} requestBody - The query-string style POST body parameters
 * @param {object} initialGlobals - Object containing current global seeds {_g_SeedA, _g_SeedB, _g_SeedC}
 * @returns {Buffer} The fully packed and encrypted binary request buffer
 */
function encryptTaPacket(gameId, targetUrl, requestBody, initialGlobals) {
    // 1. Calculate base components and string lengths
    const bodyStr = requestBody || "";
    const bodyLength = Buffer.byteLength(bodyStr, 'utf8');
    
    // Isolate endpoint string by cutting off the 28-character base domain
    const endpointStr = targetUrl.substring(28);
    const endpointLen = Buffer.byteLength(endpointStr, 'utf8');

    // Calculate dynamic buffer size: bodyLength + endpointLen + 23 bytes (0x17)
    const bufferSize = bodyLength + endpointLen + 23;
    const requestBuffer = Buffer.alloc(bufferSize);

    // 2. Generate the Session Seeds from Global Snapshot
    const old_SeedA = initialGlobals._g_SeedA;
    const old_SeedB = initialGlobals._g_SeedB;
    const old_SeedC = initialGlobals._g_SeedC;

    let ses_SeedC = mask24(old_SeedC + 0x11);
    let ses_SeedA = mask24(old_SeedA + 0x2b);
    let ses_SeedB = mask24(old_SeedB + 9);

    // 3. Assemble Unencrypted Headers (Magic Bytes & State Verification)
    requestBuffer.write('r', 0);
    requestBuffer.write('x', 1);
    requestBuffer[2] = ses_SeedC & 0xff;
    requestBuffer.write('b', 3);
    requestBuffer[4] = ses_SeedA & 0xff;
    requestBuffer.write('5', 5);
    requestBuffer[6] = ses_SeedB & 0xff;
    requestBuffer.write('d', 7);
    requestBuffer[8] = gameId & 0xff;
    requestBuffer[9] = 0x01; // Control flag
    requestBuffer[10] = 0x00;
    requestBuffer[11] = 0x00;
    requestBuffer[12] = 0x00;

    // 4. Compute and Pack Obfuscated Packet Metas
    ses_SeedA = mask24(ses_SeedA ^ ses_SeedC ^ ses_SeedB ^ (endpointLen & 0xff));
    requestBuffer[0xd] = ses_SeedA & 0xff;

    let uVar4 = (endpointLen >> 8) & 0xff;
    ses_SeedC = mask24(old_SeedA + (endpointLen & 0xff) + 0x61bfe);
    let uVar5 = (endpointLen >> 16) & 0xff;
    ses_SeedB = mask24(uVar4 + ses_SeedC + 0x61bd3);
    ses_SeedA = mask24(old_SeedB + (ses_SeedA & 0xff) + 0x46);
    
    // Core loop iteration key initialization
    let uVar9 = mask24(old_SeedC + 0x8205);
    
    let uVar3 = mask24(uVar5 + ses_SeedB + 0x61bd3);
    ses_SeedC = mask24(uVar4 ^ mask24(old_SeedC + 0x208e) ^ ses_SeedC ^ ses_SeedA);
    requestBuffer[0xe] = ses_SeedC & 0xff;

    ses_SeedC = mask24(ses_SeedA + (ses_SeedC & 0xff) + 0x3d);
    ses_SeedA = mask24(((endpointLen >> 24) & 0xff) + uVar3 + 0x61bd3);
    ses_SeedB = mask24(uVar5 ^ mask24(old_SeedC + 0x410b) ^ ses_SeedB ^ ses_SeedC);
    requestBuffer[0xf] = ses_SeedB & 0xff;

    ses_SeedC = mask24(ses_SeedC + (ses_SeedB & 0xff) + 0x3d);
    ses_SeedB = mask24(((endpointLen >> 24) & 0xff) ^ mask24(old_SeedC + 0x6188) ^ uVar3 ^ ses_SeedC);
    ses_SeedC = mask24(ses_SeedC + (ses_SeedB & 0xff) + 0x3d);
    requestBuffer[0x10] = ses_SeedB & 0xff;

    // 5. Loop 1: Encrypt Endpoint Path String
    let endpointBufferOffset = 0x11;
    for (let i = 0; i < endpointLen; i++) {
        let rawChar = endpointStr.charCodeAt(i);
        
        // Dynamic string look-ahead logic from Ghidra
        let lookAheadChar = (i + 1 < endpointLen) ? endpointStr.charCodeAt(i + 1) : 0;
        let current_ses_SeedB = rawChar;

        // Perform the 4-way character XOR obfuscation
        let encryptedChar = mask24(uVar9 ^ current_ses_SeedB ^ ses_SeedA ^ ses_SeedC);
        requestBuffer[endpointBufferOffset + i] = encryptedChar & 0xff;

        // State Machine Step Mutations
        let loop_old_SeedC = mask24(current_ses_SeedB + 0x61bd3);
        uVar9 = mask24(uVar9 + 0x207d);
        ses_SeedA = mask24(loop_old_SeedC + ses_SeedA);
        ses_SeedC = mask24(ses_SeedC + (encryptedChar & 0xff) + 0x3d);
    }

    // Advance buffer cursor past the endpoint string
    let currentBufferOffset = endpointBufferOffset + endpointLen;

    // 6. Pack Obfuscated Body Length Data
    let body_uVar5 = mask24(uVar9 ^ (bodyLength & 0xff) ^ ses_SeedA ^ ses_SeedC);
    ses_SeedA = mask24((bodyLength & 0xff) + 0x61bd3 + ses_SeedA);
    requestBuffer[currentBufferOffset] = body_uVar5 & 0xff;

    let body_endpointLen = (bodyLength >> 8) & 0xff;
    let body_uVar3 = mask24(body_endpointLen + 0x61bd3 + ses_SeedA);
    let body_uVar6 = (bodyLength >> 16) & 0xff;
    let body_uVar4 = mask24(body_uVar6 + 0x61bd3 + body_uVar3);
    
    let bodyOffset = currentBufferOffset + 4;
    ses_SeedB = mask24(uVar9 + 0x81f4);
    ses_SeedC = mask24(ses_SeedC + (body_uVar5 & 0xff) + 0x3d);
    
    ses_SeedA = mask24(mask24(uVar9 + 0x207d) ^ body_endpointLen ^ ses_SeedA ^ ses_SeedC);
    requestBuffer[currentBufferOffset + 1] = ses_SeedA & 0xff;
    
    ses_SeedC = mask24(ses_SeedC + (ses_SeedA & 0xff) + 0x3d);
    ses_SeedA = mask24(mask24(uVar9 + 0x40fa) ^ body_uVar6 ^ body_uVar3 ^ ses_SeedC);
    ses_SeedC = mask24(ses_SeedC + (ses_SeedA & 0xff) + 0x3d);
    requestBuffer[currentBufferOffset + 2] = ses_SeedA & 0xff;

    let body_uVar1 = mask24(mask24(uVar9 + 0x6177) ^ ((bodyLength >> 24) & 0xff) ^ body_uVar4 ^ ses_SeedC);
    ses_SeedA = mask24(((bodyLength >> 24) & 0xff) + 0x61bd3 + body_uVar4);
    ses_SeedC = mask24(ses_SeedC + (body_uVar1 & 0xff) + 0x3d);
    requestBuffer[currentBufferOffset + 3] = body_uVar1 & 0xff;

    // Update global state tracking for next packet frame
    initialGlobals._g_SeedC = ses_SeedB;
    initialGlobals._g_SeedA = ses_SeedA;
    initialGlobals._g_SeedB = ses_SeedC;

    // 7. Loop 2: Encrypt Request Body String
    for (let i = 0; i < bodyLength; i++) {
        let rawBodyChar = bodyStr.charCodeAt(i);

        let body_uVar3_loop = mask24(ses_SeedB ^ rawBodyChar);
        ses_SeedB = mask24(ses_SeedB + 0x207d);
        
        let encryptedBodyChar = mask24(body_uVar3_loop ^ ses_SeedA ^ ses_SeedC);
        ses_SeedA = mask24(rawBodyChar + 0x61bd3 + ses_SeedA);
        ses_SeedC = mask24(ses_SeedC + (encryptedBodyChar & 0xff) + 0x3d);
        
        requestBuffer[bodyOffset + i] = encryptedBodyChar & 0xff;
    }

    // 8. Append Packet End Checksums
    let finalOffset = bodyOffset + bodyLength;
    requestBuffer[finalOffset] = ses_SeedA & 0xff;
    requestBuffer[finalOffset + 1] = ses_SeedC & 0xff;

    return requestBuffer;
}

module.exports = { encryptTaPacket };