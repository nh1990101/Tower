import { _decorator, Component, lerp, math, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
export class GameConfig {
    public static config: ConfigCfg;
    private static _floorKey: Map<number, SkyObjCfg>;
    public static initConfig(value: Object) {
        GameConfig.config = new ConfigCfg;
        GameConfig.config.decode(value)
        this._floorKey = new Map<number, SkyObjCfg>();
        GameConfig.config.skyObj.forEach(item => {
            this._floorKey.set(item.index, item)
        })
    }
    public static getCfgByIdx(index: number): SkyObjCfg {
        return this._floorKey.get(index)
    }
}
export class BaseConfig extends Object {
    // constructor(){

    // }
    decode(value: Object) {
        for (var key in value) {
            if (this.hasOwnProperty(key)) {
                var objValue = value[key]
                if (objValue)
                    this[key] = objValue;
            }
        }
    }
}
export class ConfigCfg extends BaseConfig {
    public skyObj: SkyObjCfg[]
    public maxHp: number;
    public perFloorScore: number;//每层加分数
    public continuteAwardRate: number;//连击倍数奖励
    public continuteCountTime: number;//连击结束时间
}
export interface SkyObjCfg extends BaseConfig {
    index: number;
    list: SkyListItem[];
}
export interface SkyListItem {
    name: string;
    pos: number[];

}