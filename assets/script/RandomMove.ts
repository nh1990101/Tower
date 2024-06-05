import { _decorator, Component, lerp, math, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RandomMove')
export class RandomMove extends Component {
    /**随机频率 */
    @property({ displayName: "随机距离范围" })
    public randomSpeed = 10;
    /**速度 */
    @property({ displayName: "速度" })
    public speed = 0.001;
    /**随机方向 */
    @property({ displayName: "随机方向" })
    public randomDir = new Vec3(1, 0, 1);
    /**总体方向 */
    @property({ displayName: "总体方向" })
    public targetDir = new Vec3(0, 1, 0)
    /**限制范围(默认不限制) */
    @property({ displayName: "限制范围(默认不限制)" })
    public range = new Vec3(0, 0, 0)

    private targetPos: Vec3;
    private moveTime = 0;
    private runTime = 0;
    private isRange = false;
    start() {
        this.targetPos = new Vec3();
        var pos = this.node.getWorldPosition();
        this.isRange = this.range.equals(Vec3.ZERO)
        this.range.add3f(Math.abs(pos.x), Math.abs(pos.y), Math.abs(pos.z))
        this.random();
    }

    update(deltaTime: number) {
        if (this.node.position.equals(this.targetPos, 0.05)) {
            this.random();
        }
        this.runTime += deltaTime;
        this.moveTime += deltaTime * this.speed;
        var pos = this.node.getWorldPosition();
        this.node.setPosition(this.lerpPos(pos.x, this.targetPos.x), this.lerpPos(pos.y, this.targetPos.y), this.lerpPos(pos.z, this.targetPos.z))
    }
    random() {
        var randDir = new Vec3(Math.sin(Math.random() * 10) * this.randomDir.x, Math.sin(Math.random() * 10) * this.randomDir.y, Math.sin(Math.random() * 10) * this.randomDir.z);
        this.moveTime = 0;
        var tempVec = this.targetPos.clone();
        Vec3.add(tempVec, randDir, this.targetDir)
        tempVec.multiplyScalar(this.randomSpeed)
        tempVec.add(this.node.getWorldPosition())
        if (this.isRange || (Math.abs(tempVec.x) <= this.range.x && Math.abs(tempVec.y) <= this.range.y && Math.abs(tempVec.z) <= this.range.z)) {
            this.targetPos = tempVec;
        }
    }
    lerpPos(fromPos: number, targetPos: number): number {
        return lerp(fromPos, targetPos, this.moveTime)
    }
}


