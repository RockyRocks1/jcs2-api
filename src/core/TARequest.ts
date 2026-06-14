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