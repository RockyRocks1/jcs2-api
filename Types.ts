export enum ObjectType {
    CHECKPOINT = 0,
    PROP_BOX = 1,
    HOOP = 2
}
export enum CarID {
    BUGGY = 0,
    ORIGINAL = 1,
    JET = 2,
    COMPACT = 3,
    SPORTS = 4,
    STOCK = 5,
    MONSTER = 6
}
export enum SkyID {
    SKYO = 0,
    SKY1 = 1,
    SKY3 = 2,
    SKY4 = 3,
    SKY5 = 4
}
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PathNode {
    position: Vector3;
    rotation: Vector3;
    nodeIndex?: number;
}

export interface BakedObject {
    position: Vector3;
    rotation: Vector3;
    objectTypeID: ObjectType;
    colorID: number;
    sizeID: number;
}

export interface GlobalSeeds {
    seedA: number;
    seedB: number;
    seedC: number;
}