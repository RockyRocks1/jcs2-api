const fs = require("fs");
const http = require("http");
const path = require("path");
const WorldReader = require("./WorldReader");
//Test_Level2__dont_play_.dat
const PORT = 3000;
const LEVEL_PATH = "file8.dat";

// 1. Helper function to read and parse the live level file
function getParsedMapData() {
    
    const buffer = fs.readFileSync(LEVEL_PATH);
    const world = new World(buffer);
    return {
        success: true,
        levelBounds: {
            min: world.minPos,
            max: world.maxPos
        },
        objects: world.placedObjects,
        paths: world.paths
    };
}
function decodeMapDataNormalizedRaw(rawData) {
    const decodeAngle = (val) => {
        return Number(((val / 65536) * 360).toFixed(2));
    };
    const decodeCoord = (vec3, coord) => {
        return Number(((vec3[coord] / 65536) * (rawData.levelBounds.max[coord] - rawData.levelBounds.min[coord])).toFixed(4))
    }

    const readableData = JSON.parse(JSON.stringify(rawData));
    
    readableData.paths = readableData.paths.map(obj => {
        return {
            x: decodeCoord(obj, "x"),
            y: decodeCoord(obj, "y"),
            z: decodeCoord(obj, "z"),
            
            pitch: decodeAngle(obj.pitch),
            yaw: decodeAngle(obj.yaw),
            roll: decodeAngle(obj.roll),
            
            groupIndex: obj.groupIndex
        };
    });

    readableData.objects = readableData.objects.map(obj => {
        return {
            x: decodeCoord(obj, "x"),
            y: decodeCoord(obj, "y"),
            z: decodeCoord(obj, "z"),
            
            pitch: decodeAngle(obj.pitch),
            yaw: decodeAngle(obj.yaw),
            roll: decodeAngle(obj.roll),
            
            objectTypeID: obj.objectTypeID,
            colorID: obj.colorID,
            sizeID: obj.sizeID
        };
    });

    return readableData;
}

const server =http.createServer()
server.on("request", (req, res) => {
    console.log("A")
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const rawJson = getParsedMapData()
    let stuff = JSON.stringify(decodeMapDataNormalizedRaw(rawJson))
    fs.writeFileSync("map.json", stuff)
    
    res.end(stuff);
})
server.listen(PORT);