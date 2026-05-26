import  fs from 'fs';
import TARequest, { TASendUserLevelBody } from './TARequest.js';
import TARequestWriter from './TARequestWriter.js';
import { ALT_ENDPOINT, GAME_ID, MAIN_ENDPOINT, TA_DOMAIN, TA_USERAGENT } from './Globals.js';
import LevelReader from './LevelReader.js';
import LevelWriter from './LevelWriter.js';
import { CarID, ObjectType, SkyID } from './Types.js';
import LevelExporter from './LevelExporter.js';
let levelBuffer = Buffer.from(fs.readFileSync("./Levels/stolen.dat")) as Buffer
const level = LevelReader.read(levelBuffer)!
level.levelName = "hoopTest2"
level.carID = CarID.COMPACT
LevelExporter.exportToJSON("./level.json", level)
import http from 'http';

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Check if the request is a GET method
  if (req.method === 'GET' && req.url === '/api/data') {
    // Set the response header to indicate JSON content
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    // Define the JSON data
    const responseData = fs.readFileSync("./level.json")
    
    // Send the JSON response (must be stringified)
    res.end(responseData);
  } else {
    // Handle 404 Not Found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/api/data`);
});