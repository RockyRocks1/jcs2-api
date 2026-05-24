class World {
    constructor()
    {
        this.fileVersion = 0;
        this.carId = 0;
        this.timestamp = "";
        this.levelName = "";
        this.minPos = { x: 0.0, y: 0.0, z: 0.0 };
        this.maxPos = { x: 0.0, y: 0.0, z: 0.0 };
        this.placedObjects = []
        this.paths = []
    }
}

module.exports = World