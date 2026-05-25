import { type Vector3 } from "./Types.js";
export const GAME_ID = 0x01 as const
export const CIPHER_KEY = 0xFB as const
export const INITIAL_CIPHER_VALUE = 1004 as const
export const INITIAL_CHECKSUM_VALUE = 0xAF as const;
export const MAGIC_LEVEL_HEADER = "L@MD" as const
export const MAX_LEVEL_NAME_LENGTH = 38 as const
export const STARTING_NODE_FLAG = 0x8000 as const
export const TA_DOMAIN = "https://connect.trueaxis.com"
export const TA_USERAGENT = "JetCarStunts2/1.0.26 CFNetwork/3826.600.41.2.1 Darwin/24.6.0" as const
export const MAIN_ENDPOINT = "/z1ugjI39.php" as const
export const ALT_ENDPOINT = "/x54sfgh4.php" as const

export const GLOBAL_SIZES: Vector3[] = [
    { x: 1,  y: 1,  z: 1  }, // Index 0
    { x: 12, y: 16, z: 8  }, // Index 1
    { x: 12, y: 16, z: 20 }, // Index 2
    { x: 16, y: 8,  z: 8  }, // Index 3
    { x: 8,  y: 8,  z: 8  }, // Index 4
    { x: 9,  y: 6,  z: 12 }  // Index 5
] as const;

export const GLOBAL_COLORS = [
    "AAAA00FF", // Index 0
    "101010FF", // Index 1
    "202020FF", // Index 2
    "AA0000FF", // Index 3
    "CC6600FF", // Index 4
    "000204FF", // Index 5
    "80808000", // Index 6
    "808080FF"  // Index 7
] as const;