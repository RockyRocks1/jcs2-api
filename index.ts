import * as fs from 'fs';
import * as path from 'path';
import LevelReader from './LevelReader.js';
import LevelWriter from './LevelWriter.js';
import { CarID, ObjectType } from './Types.js';
import { Verify } from 'crypto';

function binaryToHexFile(inputBinaryPath: string, outputTxtPath: string): string {
    try {
        // 1. Read the raw binary file into a Buffer
        const binaryBuffer = fs.readFileSync(inputBinaryPath)!;
       

        // 2. Convert the entire buffer into an array of 2-character hex strings
        const hexArray: string[] = [];
        for (let i = 0; i < binaryBuffer.length; i++) {
            // Convert byte to hex, ensure it's 2 characters long (e.g., 0 -> '00')
            const hexByte = binaryBuffer[i]!.toString(16).padStart(2, '0');
            hexArray.push(hexByte);
        }

        // 3. Join them with a space to make it clean and scannable
        const spaceSeparatedHex = hexArray.join(' ');

        // 4. Save the hex text string to a file
        fs.writeFileSync(outputTxtPath, spaceSeparatedHex, 'utf-8');

        console.log(`Successfully converted binary to hex string!`);
        console.log(`Total Bytes Processed: ${binaryBuffer.length}`);
        console.log(`Saved hex text file to: ${outputTxtPath}`);

        return spaceSeparatedHex;

    } catch (error) {
        console.error(`Error converting binary to hex:`, error);
        throw error;
    }
}

// === Execution Example ===
const levelDat = "./Levels/level1.dat"
const newLevelName = "New Track 76"
const levelBuffer = Buffer.from(fs.readFileSync(levelDat))!
const level = LevelReader.read(levelBuffer)!
level.levelName = newLevelName
level.carID = CarID.STOCK
level.skyID = 2
level.bakedObjects.map((obj) => {
    obj.objectTypeID = ObjectType.CHECKPOINT
})

const buff = LevelWriter.write(level)!
fs.writeFileSync("./Levels/output_map.map", buff)


binaryToHexFile("./Levels/output_map.map",'level_hex.txt');