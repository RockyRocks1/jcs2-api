// Little Endian
import { CIPHER_KEY } from "./Globals.js";
export default class FileWriter {
    private readonly bytesBuffer: Buffer
    private bytesWritten: number
    private cipherValue: number
    private xorChecksumVal: number
    private addChecksumVal: number
    private useRollingCipher: boolean
    private useCheckSum: boolean
    constructor(bytesToAllocate = 0x10000, cipherValue = 0, xorChecksumVal = 0) {
        this.bytesBuffer = Buffer.alloc(bytesToAllocate);
        this.bytesWritten = 0;
        this.cipherValue = cipherValue;
        this.xorChecksumVal = xorChecksumVal;
        this.addChecksumVal = 0;
        this.useRollingCipher = true;
        this.useCheckSum = true;
    }
    toChar = (value: number) => (value << 24) >> 24;
    toUChar = (value: number) => value & 0xFF;
    toUInt = (value: number) => value >>> 0;
    private writeBytesGeneric(bytes: number[])
    {
        if (this.bytesWritten + bytes.length > this.bytesBuffer.length)
            throw new Error("Write out of bounds");
    
        for (let byteNum = 0; byteNum < bytes.length; byteNum++) {
            const decryptedByte = bytes[byteNum];
            if (decryptedByte === undefined)
                throw new Error(`Unassigned byte at ${byteNum}`)

            let encryptedByte = decryptedByte;
           
            if (this.useRollingCipher) {
                const currentSeed = this.cipherValue;
                const key = (currentSeed >> 8) & 0xFF;
                const sub = currentSeed & 0xFF;
                encryptedByte = this.toUChar((decryptedByte + sub) ^ key);
                
                this.cipherValue = this.toUInt(currentSeed + CIPHER_KEY);
            }
            if (this.useCheckSum) {
                this.xorChecksumVal = this.toUChar(encryptedByte ^ this.xorChecksumVal);
                this.addChecksumVal = this.toUInt(this.addChecksumVal + this.xorChecksumVal);
            }
            if (Math.abs(this.bytesWritten - 0x7C)  == 0)
                encryptedByte += 0x3
            this.bytesBuffer[this.bytesWritten] = encryptedByte;
            this.bytesWritten++;
        }
    }
    writeU8(uint8Value: number) {
        this.writeBytesGeneric([
            uint8Value & 0xFF
        ]);
    }
    writeU16(uint16Value: number) { 
        this.writeBytesGeneric([
            uint16Value & 0xFF,
            (uint16Value >> 8) & 0xFF
        ]);
    }
    writeU32(uint32Value: number) { 
        this.writeBytesGeneric([
            uint32Value & 0xFF,
            (uint32Value >> 8) & 0xFF,
            (uint32Value >> 16) & 0xFF,
            (uint32Value >> 24) & 0xFF
        ]);
    }
    writeS32(uint32Value: number) {
        this.writeBytesGeneric([
            uint32Value & 0xFF,
            (uint32Value >> 8) & 0xFF,
            (uint32Value >> 16) & 0xFF,
            (uint32Value >> 24) & 0xFF
        ]);
    }
    writeFloat(float32Value: number) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, float32Value, true); 
        const uint32Value = view.getUint32(0, true);

        this.writeU32(uint32Value);
    }
    writeString(str: string) {
        if (!str || str.length === 0) 
            return;
    
        const byteArray = [];
        for (let i = 0; i < str.length; i++) {
            byteArray.push(str.charCodeAt(i));
        }
        this.writeBytesGeneric(byteArray);
    }
    writeCheckSum() {
        this.setCheckSum(false);
        this.writeBytesGeneric([this.xorChecksumVal, this.toUChar(this.addChecksumVal)]);
        this.setCheckSum(true);
    }
    addPadding(numBytes: number) {
        // Looks oddly familiar...
        if (numBytes <= 0) 
            return;
        const byteArray = [];
        for (let i = 0; i < numBytes; i++) {
            byteArray.push(0);
        }
        this.writeBytesGeneric(byteArray);
    }
    setRollingCipher(state: boolean) {
        this.useRollingCipher = state;
    }
    setCheckSum(state: boolean) {
        this.useCheckSum = state
    }
    getFinalizedBuffer(): Buffer {
        return this.bytesBuffer.subarray(0, this.bytesWritten);
    }
}