import FileWriter from "../../utils/BufferWriter.js";
import { GAME_ID } from "../../core/Constants.js";
import type Level from "../../core/Level.js";
import { CarID, SkyID } from "../../core/Types.js";

const MAGIC_USER_LEVEL_BODY_HEADER = 0x3e9;
export default class TASendUserLevelBody {
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
        
        fileWriter.writeU32(MAGIC_USER_LEVEL_BODY_HEADER);
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