import FileReader from "./FileReader.js";
import Level from "./Level.js";
import { INITIAL_CIPHER_VALUE, MAGIC_LEVEL_HEADER, MAX_LEVEL_NAME_LENGTH } from "./Globals.js";
import type { BakedObject, PathNode, Vector3 } from "./Types.js";

const u16ToCoord = (rawVal: number, levelSpan: Vector3, levelMin: Vector3, coord: "x" | "y" | "z"): number => {
    return levelMin[coord] + (rawVal / 65536) * levelSpan[coord]
}
const u16ToAngle = (val: number) => {
    return (val / 65536) * 2 * Math.PI;
};
export default class LevelReader {
    // A clean, static entryway function
    public static read(buffer: Buffer): Level | undefined {
        const worker = new LevelReader(buffer);
        return worker.parse();
    }

    private buffer: Buffer;
    private fileReader: FileReader;
    private constructor(buffer: Buffer) { 
        this.buffer = buffer;
        this.fileReader = new FileReader(buffer, INITIAL_CIPHER_VALUE);
    }
    private parse(): Level | undefined { 
        const level = new Level();
        
        if (!this.parseHeader(level)) 
            return;
        
        if (!this.parsePathNodes(level)) 
            return;
        
        if (!this.parseBakedObjects(level)) 
            return;
        
        return level;
    }
    private parseHeader(level: Level): boolean
    {
        this.fileReader.setRollingCipher(false);
        const magicHeader = this.fileReader.readString(4);
        if (magicHeader !== MAGIC_LEVEL_HEADER)
            return false;
        this.fileReader.setRollingCipher(true);

        level.fileVersion = this.fileReader.readU32();
        if (level.fileVersion !== 4)
            console.warn(`Warning: Level of file version #${level.fileVersion} are not supported! Proceeding anyway.`)
        
        // Skip padding
        this.fileReader.readU32();
        this.fileReader.readU32();

        const classStrLen = this.fileReader.readU32();
        const classIdentifier = this.fileReader.readString(classStrLen);
        if (classIdentifier !== "CAR ")
            return false;
        level.carID = this.fileReader.readU32()

        level.timestamp = this.fileReader.readString(19);
        this.fileReader.skip(13);

        const levelNameLength = this.fileReader.readU8() 
        level.levelName = this.fileReader.readString(levelNameLength);
        level.skyID = this.fileReader.readU8() // Unknown byte? sky?
        const paddingBytesToSkip = MAX_LEVEL_NAME_LENGTH - levelNameLength;
        this.fileReader.skip(paddingBytesToSkip);

        level.minPos = {
            x: this.fileReader.readFloat(), 
            y: this.fileReader.readFloat(), 
            z: this.fileReader.readFloat()
        }
        level.maxPos = {
            x: this.fileReader.readFloat(), 
            y: this.fileReader.readFloat(), 
            z: this.fileReader.readFloat()
        }
        return true;
    }
    private parsePathNodes(level: Level): boolean
    {
        const levelSpan = level.levelSpan
        const minPos = level.minPos
        const maxNodeIndex = this.fileReader.readU32();

        let lastNodeIndex = -1;
        let currentPath: PathNode[] = []
        while (true) {
            const pathNode: PathNode = {
                position: {
                    x: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "x"),
                    y: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "y"),
                    z: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "z")
                },
                rotation: {
                    x: u16ToAngle(this.fileReader.readU16()),
                    y: u16ToAngle(this.fileReader.readU16()),
                    z: u16ToAngle(this.fileReader.readU16())
                },
                nodeIndex: this.fileReader.readU16() & 0x7FFF,
            }

            currentPath.push(pathNode);
            
            if (pathNode.nodeIndex === lastNodeIndex) {
                level.paths.push(currentPath)
                currentPath = []

                if (pathNode.nodeIndex + 1 >= maxNodeIndex)
                    break;
            }


            lastNodeIndex = pathNode.nodeIndex as number
        }
        return true
    }
    private parseBakedObjects(level: Level): boolean
    {
        const levelSpan = level.levelSpan
        const minPos = level.minPos
        const bakedObjectCount = this.fileReader.readU32();

        for (let objectIndex = 0; objectIndex < bakedObjectCount; objectIndex++) {
            const bakedObject: BakedObject = {
                position: {
                    x: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "x"),
                    y: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "y"),
                    z: u16ToCoord(this.fileReader.readU16(), levelSpan, minPos, "z")
                },
                rotation: {
                    x: u16ToAngle(this.fileReader.readU16()),
                    y: u16ToAngle(this.fileReader.readU16()),
                    z: u16ToAngle(this.fileReader.readU16())
                },
                objectTypeID: this.fileReader.readU8(),
                colorID: this.fileReader.readU8(),
                sizeID: this.fileReader.readU8(),
            }
            level.bakedObjects.push(bakedObject)
        }
        return true
    }
}