import { type Vector3, type PathNode, type BakedObject, CarID, SkyID } from "./Types.js";
export default class Level {
    public fileVersion: number = 0;
    public carID: CarID = CarID.BUGGY;
    public timestamp: string = "";
    public levelName: string = "New Track";
    public skyID: SkyID = SkyID.SKY5
    public minPos: Vector3 = { x: 0, y: 0, z: 0 };
    public maxPos: Vector3 = { x: 0, y: 0, z: 0 };
    
    public paths: PathNode[][] = [];
    public bakedObjects: BakedObject[] = [];

    constructor() {
        this.timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    public get levelSpan(): Vector3 {
        return {
            x: this.maxPos.x - this.minPos.x,
            y: this.maxPos.y - this.minPos.y,
            z: this.maxPos.z - this.minPos.z
        };
    }
}