import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('StarMgr')
export class StarMgr extends Component {
    @property(Node)
    public star1: Node;
    @property(Node)
    public star2: Node;
    @property({ displayName: "显示星星1的层数" })
    public star1Show: number = 30;
    @property({ displayName: "显示星星2的层数" })
    public star2Show: number = 100;
    start() {
        this.star1.active = this.star2.active = false;
    }
    public checkShow(floorNum: number) {

        this.star1.active = floorNum >= this.star1Show;

        this.star2.active = floorNum >= this.star2Show;

    }
    update(deltaTime: number) {

    }
}


