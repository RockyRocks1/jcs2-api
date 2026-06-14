import FileWriter from "../utils/BufferWriter.js";
import TARequest from "../core/TARequest.js";
import type { GlobalSeeds } from "../core/Types.js";
function mask24(value: number) {
    return (value & 0xffffff) >>> 0;
}
export default class RequestWriter {
    public static write(request: TARequest, globalSeeds: GlobalSeeds = {seedA: 1, seedB: 2, seedC: 3}): Buffer | undefined {
        const worker = new RequestWriter(request, globalSeeds);
        return worker.compile();
    }
    
    private request: TARequest;
    private globalSeeds: GlobalSeeds;
    private fileWriter: FileWriter;

    private constructor(request: TARequest, globalSeeds: GlobalSeeds) {
        this.request = request;
        this.globalSeeds = globalSeeds;
        this.fileWriter = new FileWriter(0x10000);
        this.fileWriter.setCheckSum(false);
        this.fileWriter.setRollingCipher(false);
    }
    private compile(): Buffer | undefined {
        const bodyString = this.request.body;
        const endpointString = this.request.endpoint;
        const fileWriter = this.fileWriter;
        const oldGlobalSeeds = { ...this.globalSeeds };
        let sesSeeds: GlobalSeeds = {
            seedC: mask24(this.globalSeeds.seedC + 0x11),
            seedA: mask24(this.globalSeeds.seedA + 0x2B),
            seedB: mask24(this.globalSeeds.seedB + 0x09)
        };
        fileWriter.writeString("rx");
        fileWriter.writeU8(sesSeeds.seedC);
        fileWriter.writeString("b");
        fileWriter.writeU8(sesSeeds.seedA);
        fileWriter.writeString("5");
        fileWriter.writeU8(sesSeeds.seedB);
        fileWriter.writeString("g");
        fileWriter.writeU8(this.request.gameID);
        fileWriter.writeU32(1);
        console.log(endpointString.length);
        const endpointLenBytes: [number, number, number, number] = [
            fileWriter.toUChar(endpointString.length),
            fileWriter.toUChar(endpointString.length >> 8),
            fileWriter.toUChar(endpointString.length >> 16),
            fileWriter.toUChar(endpointString.length >> 24)
        ];

        sesSeeds.seedA = mask24(sesSeeds.seedA ^ sesSeeds.seedC ^ sesSeeds.seedB ^ endpointLenBytes[0]);
        fileWriter.writeU8(sesSeeds.seedA);

        sesSeeds.seedC = mask24(oldGlobalSeeds.seedA + endpointLenBytes[0] + 0x61bfe);
        sesSeeds.seedB = mask24(endpointLenBytes[1] + sesSeeds.seedC + 0x61bd3);
        sesSeeds.seedA = mask24(oldGlobalSeeds.seedB + fileWriter.toUChar(sesSeeds.seedA) + 0x46);

        let uVar9 = mask24(oldGlobalSeeds.seedC + 0x8205);
        const uVar3 = mask24(endpointLenBytes[2] + sesSeeds.seedB + 0x61bd3);

        sesSeeds.seedC = mask24(endpointLenBytes[1] ^ mask24(oldGlobalSeeds.seedC + 0x208e) ^ sesSeeds.seedC ^ sesSeeds.seedA);
        fileWriter.writeU8(sesSeeds.seedC);

        sesSeeds.seedC = mask24(sesSeeds.seedA + fileWriter.toUChar(sesSeeds.seedC) + 0x3d);
        sesSeeds.seedA = mask24(endpointLenBytes[3] + uVar3 + 0x61bd3);
        sesSeeds.seedB = mask24(endpointLenBytes[2] ^ mask24(oldGlobalSeeds.seedC + 0x410b) ^ sesSeeds.seedB ^ sesSeeds.seedC);
        fileWriter.writeU8(sesSeeds.seedB);

        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(sesSeeds.seedB) + 0x3d);
        sesSeeds.seedB = mask24(endpointLenBytes[3] ^ mask24(oldGlobalSeeds.seedC + 0x6188) ^ uVar3 ^ sesSeeds.seedC);
        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(sesSeeds.seedB) + 0x3d);
        fileWriter.writeU8(sesSeeds.seedB);

        for (let i = 0; i < endpointString.length; i++) {
            const rawChar = endpointString.charCodeAt(i);
            const encryptedChar = mask24(uVar9 ^ rawChar ^ sesSeeds.seedA ^ sesSeeds.seedC);
            fileWriter.writeU8(encryptedChar);

            uVar9 = mask24(uVar9 + 0x207d);
            sesSeeds.seedA = mask24(mask24(rawChar + 0x61bd3) + sesSeeds.seedA);
            sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(encryptedChar) + 0x3d);
        }

        const bodyLenBytes: [number, number, number, number] = [
            fileWriter.toUChar(bodyString.byteLength),
            fileWriter.toUChar(bodyString.byteLength >> 8),
            fileWriter.toUChar(bodyString.byteLength >> 16),
            fileWriter.toUChar(bodyString.byteLength >> 24)
        ];

        const body_uVar5 = mask24(uVar9 ^ bodyLenBytes[0] ^ sesSeeds.seedA ^ sesSeeds.seedC);
        sesSeeds.seedA = mask24(bodyLenBytes[0] + 0x61bd3 + sesSeeds.seedA);
        fileWriter.writeU8(body_uVar5);
        
        const body_uVar3 = mask24(bodyLenBytes[1] + 0x61bd3 + sesSeeds.seedA);
        const body_uVar4 = mask24(bodyLenBytes[2] + 0x61bd3 + body_uVar3);

        sesSeeds.seedB = mask24(uVar9 + 0x81f4);
        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(body_uVar5) + 0x3d);

        sesSeeds.seedA = mask24((uVar9 + 0x207d) ^ bodyLenBytes[1] ^ sesSeeds.seedA ^ sesSeeds.seedC);
        fileWriter.writeU8(sesSeeds.seedA);

        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(sesSeeds.seedA) + 0x3d);
        sesSeeds.seedA = mask24((uVar9 + 0x40fa) ^ bodyLenBytes[2] ^ body_uVar3 ^ sesSeeds.seedC);
        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(sesSeeds.seedA) + 0x3d);
        fileWriter.writeU8(sesSeeds.seedA);

        const body_uVar1 = mask24((uVar9 + 0x6177) ^ bodyLenBytes[3] ^ body_uVar4 ^ sesSeeds.seedC);
        sesSeeds.seedA = mask24(bodyLenBytes[3] + 0x61bd3 + body_uVar4);
        sesSeeds.seedC = mask24(sesSeeds.seedC + fileWriter.toUChar(body_uVar1) + 0x3d);
        fileWriter.writeU8(body_uVar1);

        this.globalSeeds.seedC = sesSeeds.seedB;
        this.globalSeeds.seedA = sesSeeds.seedA;
        this.globalSeeds.seedB = sesSeeds.seedC;

        console.log(bodyString.byteLength)
        for (let i = 0; i < bodyString.byteLength; i++) {
            const rawBodyChar = bodyString[i];
            if (rawBodyChar === undefined)
                return;
            const encryptedBodyChar = mask24(mask24(sesSeeds.seedB ^ rawBodyChar) ^ sesSeeds.seedA ^ sesSeeds.seedC);
            sesSeeds.seedB = mask24(sesSeeds.seedB + 0x207d);
            sesSeeds.seedA = mask24(rawBodyChar + 0x61bd3 + sesSeeds.seedA);
            sesSeeds.seedC = mask24(sesSeeds.seedC + (encryptedBodyChar & 0xFF) + 0x3d);
            
            fileWriter.writeU8(encryptedBodyChar);
        }
        
        fileWriter.writeU8(sesSeeds.seedA);
        fileWriter.writeU8(sesSeeds.seedC);

        return fileWriter.getFinalizedBuffer();
    }
}
