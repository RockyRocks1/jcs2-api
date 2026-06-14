// LevelExporter.ts
import * as fs from "fs";
import Level from "../core/Level.js";
import type { ObjectType } from "../core/Types.js";

export default class LevelExporter {
    public static exportToJSON(filePath: string, level: Level): void {
        const jsonOutput = {
            metadata: {
                fileVersion: level.fileVersion,
                carID: level.carID,
                timestamp: level.timestamp,
                levelName: level.levelName,
                skyID: level.skyID
            },
            bounds: {
                minPos: level.minPos,
                maxPos: level.maxPos,
                levelSpan: level.levelSpan
            },
            paths: level.paths,
            bakedObjects: level.bakedObjects.map(obj => ({
                position: obj.position,
                rotation: obj.rotation,
                objectTypeID: obj.objectTypeID,
                colorID: obj.colorID,
                sizeID: obj.sizeID
            }))
        };

        fs.writeFileSync(filePath, JSON.stringify(jsonOutput, null, 2), "utf-8");
    }
}