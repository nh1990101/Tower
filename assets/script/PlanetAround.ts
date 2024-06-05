import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlanetAround')
export class PlanetAround extends Component {
    @property({ displayName: "自转速度" })
    /**自转速度 */
    public speed = 0.1;
    @property({ displayName: "自转速度" })
    /**绕哪个轴旋转 */
    public aroundCoord: Vec3 = new Vec3(0, 1, 0);
    private eulerAngle: Vec3;

    start() {
        this.eulerAngle = this.node.eulerAngles.clone();
        this.aroundCoord.multiplyScalar(this.speed)
    }

    update(deltaTime: number) {
        this.eulerAngle.add(this.aroundCoord);
        // if (this.eulerAngle.y >= 360) {
        //     this.eulerAngle.y = 0;
        // }
        this.node.eulerAngles = this.eulerAngle
    }
}


