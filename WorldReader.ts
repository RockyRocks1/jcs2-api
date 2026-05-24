// World.js
const FileReader = require("./FileReader");

class WorldReader {
    constructor(buffer) {
        this.fileVersion = 0;
        this.carId = 0;
        this.timestamp = "";
        this.levelName = "";
        this.minPos = { x: 0.0, y: 0.0, z: 0.0 };
        this.maxPos = { x: 0.0, y: 0.0, z: 0.0 };
        this.placedObjects = []
        this.paths = []
        this.load(buffer)
    }


    load(fileBuffer, seed = 1004) {
        const file = new File(fileBuffer, seed);
        file.useRollingCipher = false; 
        const magicHeader = file.readString32BitAligned(4);
        if (magicHeader !== "L@MD") 
            throw new Error("Invalid level map file identifier context.");
        
        file.useRollingCipher = true;

        this.fileVersion = file.readU32();
        if (this.fileVersion !== 4)
            throw new Error("File versions other than file version 4 are not supported")
        file.readU32(); // Skip 0xFFFFFFFF
        file.readU32(); // Skip 0xFFFFFFFF again idk why it is there

        const classStrLen = file.readU32();
        const classIdentifier = file.readString32BitAligned(classStrLen);
        
        if (classIdentifier !== "CAR ")
            throw new Error(`Expected class layout tag 'CAR ', got '${classIdentifier}'`);

        this.carId = file.readU32(); 
        this.timestamp = file.readString(19);
        file.skip(13);
        const levelNameLength = file.readBytesGeneric(1); 
        this.levelName = file.readString(levelNameLength);
        const mysteryByte = file.readBytesGeneric(1);
        const paddingBytesToSkip = 0x26 - levelNameLength;
        file.skip(paddingBytesToSkip);
        this.minPos.x = file.readFloat();
        this.minPos.y = file.readFloat();
        this.minPos.z = file.readFloat();
        this.maxPos.x = file.readFloat();
        this.maxPos.y = file.readFloat();
        this.maxPos.z = file.readFloat();
    
        const maxNodeIndex = file.readU32();

        let lastNodeIndex = -1
        while (true) {
            const x = file.readU16(); 
            const y = file.readU16(); 
            const z = file.readU16();
            const pitch = file.readU16();
            const yaw = file.readU16();
            const roll = file.readU16();
            const nodeIndex = file.readU16();
            this.paths.push({
                x,
                y,
                z,
                pitch,
                yaw,
                roll,
                nodeIndex,
            });
            if (nodeIndex + 1 == maxNodeIndex && nodeIndex == lastNodeIndex)
                break
            lastNodeIndex = nodeIndex
        }
        const pathCount = file.readU32()
        for (let i = 0; i < pathCount; i++) {
            const x = file.readU16()
            const y = file.readU16()
            const z = file.readU16()
            const pitch = file.readU16()
            const yaw = file.readU16()
            const roll = file.readU16()
            const objectTypeID = file.readBytesGeneric(1)
            const colorID = file.readBytesGeneric(1)
            const sizeID = file.readBytesGeneric(1)
            this.placedObjects.push({
                x,
                y,
                z,
                pitch,
                yaw,
                roll,
                objectTypeID,
                colorID,
                sizeID
            });
        }

        
        file.useCheckSum = false
        const finalChecksumBytes = [
            file.readBytesGeneric(1),
            file.readBytesGeneric(1)
        ];
        console.log(finalChecksumBytes)
        console.log([file.xorChecksumVal & 0xFF, file.addChecksumVal & 0xFF])
    }
}

module.exports = WorldReader;