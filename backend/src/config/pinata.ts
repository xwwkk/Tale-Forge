export interface PinataKeyConfig {
    name: string;
    apiKey: string;
    apiSecret: string;
    jwt: string;
}

/**
 * 注意这个文件是pinata的配置文件，为了访问不受限，所以需要使用注册账户生成的pinata的gateway
 * 
 * 
 */
// 使用注册账户生成的pinata的gateway
export const PINATA_GATEWAY = 'blue-casual-wombat-745.mypinata.cloud';

//https://blue-casual-wombat-745.mypinata.cloud/ipfs/QmWPjcauYwEecqotQbw8UETAMp5tqdrDio5nyGR8xv35UZ

// 使用注册账户生成的pinata的keys
export const PINATA_KEYS: PinataKeyConfig[] = [
    {
        name: 'TaleForgeAdminKey',
        apiKey: '0cca224bc993fcad2cb5',
        apiSecret: '3ff03a7c09f41aa984345a203662153a6b08a4570b7718440cfe116c36859d8b',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MDQwMWZhMS00Mzg1LTRkNDAtYTk5Ny0zNWUzYjk0OGEzNTkiLCJlbWFpbCI6IjU4MjkwMTYwNUBxcS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMGNjYTIyNGJjOTkzZmNhZDJjYjUiLCJzY29wZWRLZXlTZWNyZXQiOiIzZmYwM2E3YzA5ZjQxYWE5ODQzNDVhMjAzNjYyMTUzYTZiMDhhNDU3MGI3NzE4NDQwY2ZlMTE2YzM2ODU5ZDhiIiwiZXhwIjoxNzcyNzE2NDI3fQ.5piBN5LGVxFcU4s22AGWeDcqkZ7oHIHj9lXvZ-qpN9o'
    },
    {
        name: 'TaleForgeAdminKey01',
        apiKey: '533cf0e87ce675dd937e',
        apiSecret: '6d4389a494ea4073a4a301326bb1b7018603a6105bf1f7015dbe4b116deb0093',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1MDQwMWZhMS00Mzg1LTRkNDAtYTk5Ny0zNWUzYjk0OGEzNTkiLCJlbWFpbCI6IjU4MjkwMTYwNUBxcS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTMzY2YwZTg3Y2U2NzVkZDkzN2UiLCJzY29wZWRLZXlTZWNyZXQiOiI2ZDQzODlhNDk0ZWE0MDczYTRhMzAxMzI2YmIxYjcwMTg2MDNhNjEwNWJmMWY3MDE1ZGJlNGIxMTZkZWIwMDkzIiwiZXhwIjoxNzcyNzIyNzkwfQ.cl9HEJQD501A5ySAjhE49OSyDVeHe6uA4n3Kxb_ROrs'
    }
]; 