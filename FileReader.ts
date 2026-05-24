// Little Endian
const KEY = 0xFB
class FileReader {
   constructor(buffer, cipherValue = 0, xorChecksumVal = 0) {
        this.bytesBuffer = buffer;
        this.bytesRead = 0;
        this.cipherValue = cipherValue;
        this.xorChecksumVal = xorChecksumVal;
        this.addChecksumVal = 0;
        this.useRollingCipher = true;
        this.useCheckSum = true;
    }
    toChar = (value) => (value << 24) >> 24;
    toUChar = (value) => value & 0xFF;
    toUInt = (value) => value >>> 0;
    readBytesGeneric(size)
    {
        let readOffset = this.bytesRead;
        if (readOffset + size > this.bytesBuffer.length) {
            throw new Error("Read out of bounds");
        }

        let decryptedValue = 0;
        for (let byteNum = 0; byteNum < size; byteNum++) {
            const encryptedByte = this.bytesBuffer[this.bytesRead];
            let decryptedByte = encryptedByte;

            if (this.useRollingCipher) {
                const currentSeed = this.cipherValue;
                const key = (currentSeed >> 8) & 0xFF;
                const sub = currentSeed & 0xFF;
                decryptedByte = this.toUChar((encryptedByte ^ key) - sub);
                
                this.cipherValue = this.toUInt(currentSeed + KEY);
            }
            if (this.useCheckSum) {
                this.xorChecksumVal = this.toUChar(decryptedByte ^ this.xorChecksumVal);
                this.addChecksumVal = this.toUInt(this.addChecksumVal + this.xorChecksumVal);
            }
            decryptedValue |= (decryptedByte << (8 * byteNum));
            this.bytesRead++;
        }
        return this.toUInt(decryptedValue);
    }
    readU16()   { return this.readBytesGeneric(2) }
    readU32()   { return this.readBytesGeneric(4) }
    readS32()   { return this.readBytesGeneric(4) }
    readFloat() {
        const uint32 = this.readU32()
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, uint32);
        const float32 = view.getFloat32(0); 
        return float32
    }
    readString(stringLength) {
        if (stringLength <= 0) 
            return "";

        let decryptedString = "";
        for (let i = 0; i < stringLength; i++) {
            const charCode = this.readBytesGeneric(1);
            if (charCode !== 0) {
                decryptedString += String.fromCharCode(charCode);
            }
        }
        return decryptedString;
    }
    skip(bytesToSkip)
    {
        if (bytesToSkip <= 0)
            return
        this.readBytesGeneric(bytesToSkip)
    }
}
module.exports = FileReader