import { existsSync } from "fs"
import fs from "fs/promises"
import path from "path"

type DataVaseRes = {
    success: boolean,
    changed: number,
    result: undefined | object,
}

class DataVase {
    private _DVase: {[index: string]:any}
    private _TTL: number
    private _BACKUP: string
    constructor() {
        this._DVase = new Object()
        this._TTL = 5000
        this._BACKUP = "./archives"
    }

    set TTL(data: number) {
        this._TTL = data
    }

    set BackupDir(data: string) {
        this._BACKUP = data
    }

    insert(collection: string, data: object){
        return this._insert(collection,data)
    }

    private async _archive(collection: string, ID: string):Promise<void> {
        await fs.writeFile(`${this._BACKUP}/${collection}.${ID}.archive.json`, JSON.stringify(this._DVase[collection][ID])).finally(()=>{
            this._DVase[collection][ID] = undefined
        })
    }

    private async _IDGen():Promise<string>{
        return new Promise((resolve) => {
            const epoch = 946688400;
            const timestamp = epoch - Date.now();
            const uniqueId = Math.floor(Math.random() * 1024);
            const snowflakeId = (timestamp << 10) | uniqueId;
            resolve(snowflakeId.toString());
          });
    }

    private async _insert(collection: string, data: object): Promise<DataVaseRes> {
        let TS = Date.now() + this._TTL
        if(!this._DVase[collection]) this._DVase[collection] = {}
        //await this._IDGen().catch((h)=>{console.log(h)})
        let ID = await this._IDGen()

        this._DVase[collection][ID] = data
        return await new Promise(async (resolve, reject) => {
            if (this._DVase[collection][ID] == data) {
                resolve({ success: true, changed: 1, result:{} })
                setTimeout(async () => await this._archive(collection, ID), this._TTL)
            } else {
                reject({ success: false, changed: 0, result:{} })
            }
        })
    }

}