import FileWriter from "./FileWriter.js";
import { GAME_ID } from "./Globals.js";
import type Level from "./Level.js";
import { CarID, SkyID } from "./Types.js";

export default class TARequest {
    public gameID: number
    public endpoint: string // for exampel "/getServerStatus.php"
    public body: Buffer
    constructor(gameID: number, endpoint: string, body: Buffer) {
        this.gameID = gameID;
        this.endpoint = endpoint;
        this.body = body
    }
}

const magicUserLevelBodyHeader = 0x3e9;
export class TASendUserLevelBody {
    public gameID: number = GAME_ID;
    public userID: string = "";
    public sessionToken: string = "";
    public levelName: string = "";
    public carID: CarID = CarID.BUGGY;
    public mysteryNumber: number = 0
    public skyID: SkyID = SkyID.SKY5;
    public mapBuffer?: Buffer;
    
    createBuffer(): Buffer | undefined {
        if (this.mapBuffer === undefined)
            return;

        const fileWriter = new FileWriter();
        fileWriter.setCheckSum(false);
        fileWriter.setRollingCipher(false);
        
        fileWriter.writeU32(magicUserLevelBodyHeader);
        fileWriter.writeU32(this.gameID);

        fileWriter.writeU32(this.userID.length);
        fileWriter.writeString(this.userID);

        fileWriter.writeU32(Buffer.byteLength(this.sessionToken, 'utf8'));
        fileWriter.writeString(this.sessionToken);

        fileWriter.writeU32(Buffer.byteLength(this.levelName, 'utf8'));
        fileWriter.writeString(this.levelName);

        fileWriter.writeU32(this.carID)
        fileWriter.writeU32(this.mysteryNumber)
        fileWriter.writeU32(this.skyID)

        fileWriter.writeU32(this.mapBuffer.byteLength);
        for (let i = 0; i < this.mapBuffer.length; i++) {
            if(this.mapBuffer[i] === undefined)
                return
            fileWriter.writeU8(this.mapBuffer[i]!);
        }
        
        return fileWriter.getFinalizedBuffer();
    }
    getSomeInfoFromLevel(level: Level) {
        this.levelName = level.levelName;
        this.carID = level.carID
        this.skyID = level.skyID
    }
}