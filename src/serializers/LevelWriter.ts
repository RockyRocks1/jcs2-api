import BufferWriter from "../utils/BufferWriter.js";
import { INITIAL_CHECKSUM_VALUE, INITIAL_CIPHER_VALUE, MAGIC_LEVEL_HEADER, MAX_LEVEL_NAME_LENGTH, STARTING_NODE_FLAG } from "../core/Constants.js";
import type Level from "../core/Level.js";
import type { PathNode, Vector3 } from "../core/Types.js";
const coordToU16 = (coordVal: number, levelSpan: Vector3, levelMin: Vector3, coord: "x" | "y" | "z"): number => {
    return Math.round((coordVal - levelMin[coord]) * 65536 / levelSpan[coord])
}
const angleToU16 = (angle: number) => {
    return Math.round(angle / (2 * Math.PI) * 65536)
}

export default class LevelWriter {
    public static write(level: Level): Buffer | undefined {
        const worker = new LevelWriter(level)
        return worker.compile();
    }

    private level: Level;
    private bufferWriter: BufferWriter;
    private constructor(level: Level) {
        this.level = level;
        this.bufferWriter = new BufferWriter(0x10000, INITIAL_CIPHER_VALUE, INITIAL_CHECKSUM_VALUE)
        this.bufferWriter.addThatHackyThing = true
    }
    private compile(): Buffer | undefined {
        if (!this.compileHeader())
            return;
        if (!this.compilePathNodes())
            return;
        if (!this.compileBakedObjects())
            return;
        this.bufferWriter.writeCheckSum();
        return this.bufferWriter.getFinalizedBuffer();
    }
    private compileHeader(): boolean {
        this.bufferWriter.setRollingCipher(false);
        this.bufferWriter.writeString(MAGIC_LEVEL_HEADER);
        this.bufferWriter.setRollingCipher(true);

        this.bufferWriter.writeU32(this.level.fileVersion);
        this.bufferWriter.writeU32(0xFFFFFFFF);
        this.bufferWriter.writeU32(0xFFFFFFFF);

        const classIdentifier = "CAR ";
        this.bufferWriter.writeU32(classIdentifier.length);
        this.bufferWriter.writeString(classIdentifier);
        this.bufferWriter.writeU32(this.level.carID);

        this.bufferWriter.writeString(this.level.timestamp);
        this.bufferWriter.addPadding(13);

        this.bufferWriter.writeU8(this.level.levelName.length);
        this.bufferWriter.writeString(this.level.levelName);
        this.bufferWriter.writeU8(this.level.skyID);
        this.bufferWriter.addPadding(MAX_LEVEL_NAME_LENGTH - this.level.levelName.length);
        
        const floatsToWrite = [
            this.level.minPos.x,
            this.level.minPos.y,
            this.level.minPos.z,
            this.level.maxPos.x,
            this.level.maxPos.y,
            this.level.maxPos.z,
        ];
        for (let float of floatsToWrite)
            this.bufferWriter.writeFloat(float);
        return true;
    }
    private compilePathNodes(): boolean {
        const levelSpan = this.level.levelSpan;
        const minPos = this.level.minPos;

        let globalSequenceIndex = 0;
        const u16ValuesToWrite = [];
        let previousRawIndex = -1;
        for (const path of this.level.paths) {
            for (let pathNodeIndex = 0; pathNodeIndex < path.length; pathNodeIndex++) {
                const node = path[pathNodeIndex];
                if (!node) 
                    return false;

                const isStartingNode = pathNodeIndex === 0;
                const isEndingNode = pathNodeIndex === path.length - 1;

                let finalIndex = node.nodeIndex || globalSequenceIndex;

                if (isStartingNode) {
                    previousRawIndex = finalIndex; 
                    finalIndex |= STARTING_NODE_FLAG;
                } else if (isEndingNode && previousRawIndex !== -1) 
                    finalIndex = previousRawIndex;
                else 
                    previousRawIndex = finalIndex;
                
                u16ValuesToWrite.push(
                    coordToU16(node.position.x, levelSpan, minPos, "x"),
                    coordToU16(node.position.y, levelSpan, minPos, "y"),
                    coordToU16(node.position.z, levelSpan, minPos, "z"),
                    angleToU16(node.rotation.x),
                    angleToU16(node.rotation.y),
                    angleToU16(node.rotation.z),
                    finalIndex
                );

                globalSequenceIndex++;
            }
        }
        this.bufferWriter.writeU32(previousRawIndex)
        for (const u16 of u16ValuesToWrite) 
            this.bufferWriter.writeU16(u16);
        return true
    }
    private compileBakedObjects(): boolean {
        const levelSpan = this.level.levelSpan
        const minPos = this.level.minPos
        const bakedObjectCount = this.level.bakedObjects.length
        this.bufferWriter.writeU32(bakedObjectCount)
        
        for (let bakedObject of this.level.bakedObjects) {
            const u16ValuesToWrite = [
                coordToU16(bakedObject.position.x, levelSpan, minPos, "x"),
                coordToU16(bakedObject.position.y, levelSpan, minPos, "y"),
                coordToU16(bakedObject.position.z, levelSpan, minPos, "z"),
                angleToU16(bakedObject.rotation.x),
                angleToU16(bakedObject.rotation.y),
                angleToU16(bakedObject.rotation.z)
            ];
            
            const u8ValuesToWrite = [
                bakedObject.objectTypeID,
                bakedObject.colorID,
                bakedObject.sizeID
            ];
            for (const u16 of u16ValuesToWrite) 
                this.bufferWriter.writeU16(u16);
            for (const u8 of u8ValuesToWrite) 
                this.bufferWriter.writeU8(u8);
        }
        return true;
    }
}