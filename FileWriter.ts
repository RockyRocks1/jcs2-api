// Little Endian
const KEY = 0xFB
class FileWriter {
   constructor(bytesToAllocate=0x10000, cipherValue = 0, xorChecksumVal = 0) {
        this.bytesBuffer = Buffer.alloc(bytesToAllocate);
        this.bytesWritten = 0;
        this.cipherValue = cipherValue;
        this.xorChecksumVal = xorChecksumVal;
        this.addChecksumVal = 0;
        this.useRollingCipher = true;
        this.useCheckSum = true;
    }
    toChar = (value) => (value << 24) >> 24;
    toUChar = (value) => value & 0xFF;
    toUInt = (value) => value >>> 0;
    writeBytesGeneric(bytes)
    {
        
        
        if (this.bytesWritten + bytes.length > this.bytesBuffer.length)
            throw new Error("Write out of bounds");
    

        for (let byteNum = 0; byteNum < bytes.length; byteNum++) {
            const decryptedByte = bytes[byteNum];
            let encryptedByte = decryptedByte;

            if (this.useRollingCipher) {
                const currentSeed = this.cipherValue;
                const key = (currentSeed >> 8) & 0xFF;
                const sub = currentSeed & 0xFF;
                encryptedByte = this.toUChar((decryptedByte + sub) ^ key);
                
                this.cipherValue = this.toUInt(currentSeed + KEY);
            }
            if (this.useCheckSum) {
                this.xorChecksumVal = this.toUChar(encryptedByte ^ this.xorChecksumVal);
                this.addChecksumVal = this.toUInt(this.addChecksumVal + this.xorChecksumVal);
            }
            this.bytesBuffer[this.bytesWritten] = encryptedByte;
            this.bytesWritten++;
        }
    }
    writeU16(uint16Value) { 
        this.writeBytesGeneric([
            uint16Value & 0xFF,
            (uint16Value >> 8) & 0xFF
        ]) ;
    }
    writeU32(uint32Value) { 
        this.writeBytesGeneric([
            uint32Value & 0xFF,
            (uint32Value >> 8) & 0xFF,
            (uint32Value >> 16) & 0xFF,
            (uint32Value >> 24) & 0xFF
        ]);
    }
    writeS32(uint32Value) {
        this.writeBytesGeneric([
            uint32Value & 0xFF,
            (uint32Value >> 8) & 0xFF,
            (uint32Value >> 16) & 0xFF,
            (uint32Value >> 24) & 0xFF
        ]);
    }
    writeFloat(float32Value) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, float32Value, true); 
        const uint32Value = view.getUint32(0, true);

        this.writeU32(uint32Value);
    }
    readString(str) {
        if (!str || str.length === 0) 
            return;
    
        const byteArray = [];
        for (let i = 0; i < str.length; i++) {
            byteArray.push(str.charCodeAt(i));
        }

        this.writeBytesGeneric(byteArray);
    }
    
}
module.exports = FileWriter