import { _decorator, Component, Node, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    start() {
        console.log("begin")
    }

    update(deltaTime: number) {
        this.node.rotate(math.Quat.IDENTITY)
        var mainView: MainView = new MainView();
        this.updateView(mainView,"init")

    }
    updateView<T, K extends keyof T>(caller: T, func: K) {
        console.log(typeof caller)

        var call = caller[func];
        if (typeof call == "function") {
            call();
        }
    }
}
export class MainView {

    public update(): void {
        console.log("update")

    }
    public init(): void {
        console.log("init")
    }
}

