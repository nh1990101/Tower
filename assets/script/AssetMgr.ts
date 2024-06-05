
export const BUNDLE_NAMES = ["components", "effect", "config", "skyNode"] as const
type BUNDLE_NAME<S extends string> = S

import { _decorator, Asset, assetManager, AssetManager, Component, director, instantiate, Node, Prefab, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('AssetMgr')
export class AssetMgr extends Component {
    public mapBundleAssets = new Map<string, AssetManager.Bundle>();
    start() {

    }

    update(deltaTime: number) {

    }
    /**预加载资源 */
    public preLoadBundles() {
        var arrPromise = []
        var len = BUNDLE_NAMES.length;
        for (let i = 0; i < len; i++) {
            arrPromise.push(this.loadBundles(BUNDLE_NAMES[i]));
        }
        return Promise.all(arrPromise)
    }
    public loadBundles(bundleName: BUNDLE_NAME<typeof BUNDLE_NAMES[number]>): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, data) => {
                if (err) {
                    console.error("bundle加载失败：" + err.message);
                    reject(err);
                } else {
                    this.mapBundleAssets.set(data.name, data)
                    resolve(data);
                }
            });
        })
    }
    public getRes<T extends Asset>(name: string, cls: new () => T, bundleName?: BUNDLE_NAME<typeof BUNDLE_NAMES[number]>) {
        if (!bundleName) {
            bundleName = BUNDLE_NAMES[0]
        }
        if (bundleName) {
            let bundle = this.mapBundleAssets.get(bundleName)
            if (bundle) {
                return this.getResByBundle(name, cls, bundle)
            } else {
                this.loadBundles(bundleName).then(data => {
                    return this.getResByBundle(name, cls, data)
                })
            }
        }
    }
    public getResByBundle<T extends Asset>(name: string, cls: new () => T, bundle: AssetManager.Bundle): Promise<T> {
        if (bundle) {
            return new Promise<T>((resolve, reject) => {
                bundle.load(name, cls, null, (err, data) => {
                    if (err) {
                        console.error(err.message);
                        reject(err);
                    } else {
                        resolve(data);
                    }
                })
            })
        }

    }
    public createPrefab(name: string, bundleName: BUNDLE_NAME<typeof BUNDLE_NAMES[number]>, pos: Vec3, parent: Node) {
        return new Promise((resolve, reject) => {
            this.getRes(name, Prefab, bundleName).then(data => {
                if (data) {
                    var obj = this.instantiate(data);
                    if (obj) {
                        obj.setWorldPosition(pos);
                        obj.setParent(parent, true);
                        resolve(obj);
                    } else {
                        reject("Failed to instantiate prefab.");
                    }
                } else {
                    reject("Failed to load prefab data.");
                }
            }).catch(error => {
                reject(error);
            });
        });
    }
    public instantiate(data: Prefab) {
        return instantiate(data);
    }
    public removeInstant(node: Node) {
        if (node) {
            return node.destroy()
        }
    }

}
