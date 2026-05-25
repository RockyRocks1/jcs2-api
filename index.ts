import  fs from 'fs';
import TARequest, { TASendUserLevelBody } from './TARequest.js';
import TARequestWriter from './TARequestWriter.js';
import { ALT_ENDPOINT, GAME_ID, MAIN_ENDPOINT, TA_DOMAIN, TA_USERAGENT } from './Globals.js';
import LevelReader from './LevelReader.js';
import LevelWriter from './LevelWriter.js';
import { CarID, ObjectType, SkyID } from './Types.js';
let levelBuffer = Buffer.from(fs.readFileSync("./Levels/level2.dat")) as Buffer
const level = LevelReader.read(levelBuffer)!
level.levelName = "hoopTest2"
level.carID = CarID.COMPACT
level.bakedObjects.map((value) => {
    if (value.objectTypeID != ObjectType.CHECKPOINT)
        value.objectTypeID = ObjectType.HOOP
})
levelBuffer = LevelWriter.write(level)!
console.log(LevelReader.read(levelBuffer))
fs.writeFileSync("./Levels/eliminate.dat", levelBuffer)
console.log(levelBuffer.length)
const things = new TASendUserLevelBody()
things.levelName = "hoopTest2"
things.sessionToken = "tdc2ZfDlKD1XU2hh7pxrcf4TuV5HjSPrklhTMqzWn0J5aeSTnfMg7rzGOixVcl2h_lJz729v2FgNc18sqx9smQ"
things.userID = "20757838"
things.attributes = [CarID.COMPACT, 0, 4]
things.mapBuffer = levelBuffer
const bodyBuffer = things.createBuffer()!

const req = new TARequest(GAME_ID, "/sendUserLevel.php", bodyBuffer)

let re = TARequestWriter.write(req)

const response = await fetch(TA_DOMAIN+ALT_ENDPOINT, {
    method: 'POST',
    headers: {
        "Content-Type": "application/octet-stream",
        "User-Agent": TA_USERAGENT,
        "Connection": "keep-alive",
        "Accept": "*/*",
        "Accept-Language": "en-us",
        "Accept-Encoding": "gzip, deflate, br"
    },
    body: re!
});
console.log(response)