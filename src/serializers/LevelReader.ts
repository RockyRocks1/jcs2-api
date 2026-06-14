import BufferReader from "../utils/BufferReader.js";
import Level from "../core/Level.js";
import { INITIAL_CIPHER_VALUE, MAGIC_LEVEL_HEADER, MAX_LEVEL_NAME_LENGTH } from "../core/Constants.js";
import type { BakedObject, PathNode, Vector3 } from "../core/Types.js";

const u16ToCoord = (rawVal: number, levelSpan: Vector3, levelMin: Vector3, coord: "x" | "y" | "z"): number => {
    return levelMin[coord] + (rawVal / 65536) * levelSpan[coord]
}
const u16ToAngle = (val: number) => {
    return (val / 65536) * 2 * Math.PI;
};
export default class LevelReader {
    public static read(buffer: Buffer): Level | undefined {
        const worker = new LevelReader(buffer);
        return worker.parse();
    }

    private buffer: Buffer;
    private level: Level;
    private bufferReader: BufferReader;
    private constructor(buffer: Buffer) { 
        this.buffer = buffer;
        this.level = new Level();
        this.bufferReader = new BufferReader(buffer, INITIAL_CIPHER_VALUE);
    }
    private parse(): Level | undefined { 
        if (!this.parseHeader()) 
            return;
        
        if (!this.parsePathNodes()) 
            return;
        
        if (!this.parseBakedObjects()) 
            return;
        
        return this.level;
    }
    private parseHeader(): boolean
    {
        this.bufferReader.setRollingCipher(false);
        const magicHeader = this.bufferReader.readString(4);
        if (magicHeader !== MAGIC_LEVEL_HEADER)
            return false;
        this.bufferReader.setRollingCipher(true);

        this.level.fileVersion = this.bufferReader.readU32();
        if (this.level.fileVersion !== 4)
            console.warn(`Warning: Level of file version #${this.level.fileVersion} are not supported! Proceeding anyway.`)
        
        // Skip padding
        this.bufferReader.readU32();
        this.bufferReader.readU32();

        const classStrLen = this.bufferReader.readU32();
        const classIdentifier = this.bufferReader.readString(classStrLen);
        if (classIdentifier !== "CAR ")
            return false;
        this.level.carID = this.bufferReader.readU32()

        this.level.timestamp = this.bufferReader.readString(19);
        this.bufferReader.skip(13);

        const levelNameLength = this.bufferReader.readU8();
        this.level.levelName = this.bufferReader.readString(levelNameLength);
        this.level.skyID = this.bufferReader.readU8();
        const paddingBytesToSkip = MAX_LEVEL_NAME_LENGTH - levelNameLength;
        this.bufferReader.skip(paddingBytesToSkip);

        this.level.minPos = {
            x: this.bufferReader.readFloat(), 
            y: this.bufferReader.readFloat(), 
            z: this.bufferReader.readFloat()
        }
        this.level.maxPos = {
            x: this.bufferReader.readFloat(), 
            y: this.bufferReader.readFloat(), 
            z: this.bufferReader.readFloat()
        }
        return true;
    }
    private parsePathNodes(): boolean
    {
        const levelSpan = this.level.levelSpan;
        const minPos = this.level.minPos;
        const maxNodeIndex = this.bufferReader.readU32();

        let lastNodeIndex = -1;
        let currentPath: PathNode[] = []
        while (true) {
            const pathNode: PathNode = {
                position: {
                    x: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "x"),
                    y: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "y"),
                    z: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "z")
                },
                rotation: {
                    x: u16ToAngle(this.bufferReader.readU16()),
                    y: u16ToAngle(this.bufferReader.readU16()),
                    z: u16ToAngle(this.bufferReader.readU16())
                },
                nodeIndex: this.bufferReader.readU16() & 0x7FFF,
            }

            currentPath.push(pathNode);
            
            if (pathNode.nodeIndex === lastNodeIndex) {
                this.level.paths.push(currentPath)
                currentPath = []

                if (pathNode.nodeIndex + 1 >= maxNodeIndex)
                    break;
            }


            lastNodeIndex = pathNode.nodeIndex!;
        }
        return true;
    }
    private parseBakedObjects(): boolean
    {
        const levelSpan = this.level.levelSpan;
        const minPos = this.level.minPos;
        const bakedObjectCount = this.bufferReader.readU32();

        for (let objectIndex = 0; objectIndex < bakedObjectCount; objectIndex++) {
            const bakedObject: BakedObject = {
                position: {
                    x: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "x"),
                    y: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "y"),
                    z: u16ToCoord(this.bufferReader.readU16(), levelSpan, minPos, "z")
                },
                rotation: {
                    x: u16ToAngle(this.bufferReader.readU16()),
                    y: u16ToAngle(this.bufferReader.readU16()),
                    z: u16ToAngle(this.bufferReader.readU16())
                },
                objectTypeID: this.bufferReader.readU8(),
                colorID: this.bufferReader.readU8(),
                sizeID: this.bufferReader.readU8(),
            }
            this.level.bakedObjects.push(bakedObject);
        }
        return true;
    }
}