import { _decorator, BoxCollider, BoxCollider2D, Camera, Canvas, cclegacy, Collider, Color, Component, debug, DebugMode, director, DistanceJoint2D, EColliderType, ERigidBody2DType, ERigidBodyType, EventMouse, EventTouch, find, game, geometry, Graphics, HingeConstraint, HingeJoint2D, ICollisionEvent, Input, instantiate, IQuatLike, JsonAsset, Layers, lerp, MeshRenderer, misc, Node, ParticleSystemComponent, PhysicsSystem, PlaneCollider, PointToPointConstraint, Prefab, profiler, Quat, resources, RigidBody, RigidBody2D, SceneGlobals, Scheduler, Size, Sprite, tween, Tween, UITransform, Vec2, Vec3, Widget } from 'cc';
import { AssetMgr } from './AssetMgr';
import { Mass } from './Mass';
import { MainUI } from './MainUI';
import { StarMgr } from './StarMgr';
import { GameConfig } from './GameConfig';
import { ReGameWin } from './ReGameWin';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property({ displayName: "是否编辑模式" })
    @property(Boolean)
    public isEditState: boolean = true;
    @property(AssetMgr)
    public assetMgr: AssetMgr;
    @property(StarMgr)
    public starMgr: StarMgr;

    @property(Node)
    public skyBox: Node;
    @property(Node)
    public skyBox2: Node;
    @property(MainUI)
    public mainUI: MainUI;
    @property(Camera)
    public worldCamera: Camera;
    @property(Node)
    public craneGrowTemp: Node;
    @property(Node)
    public holderRock: Node;
    @property(Node)
    public holderLine: Node;
    @property(Node)
    public holderCarry: Node;
    @property(Node)
    public lineEndPoint: Node;
    @property(Node)
    public holderTemp: Node;
    @property(Node)
    public craneHolder: Node;
    @property(Node)
    public floorTemp: Node;
    @property(Node)
    public SkyObj: Node;
    @property(Node)
    public floorContainer: Node;
    @property(Node)
    public firstFloorGuideSquar: Node;
    @property(Node)
    public hold: Node;
    @property({ displayName: "命中准确系数" })
    /**命中准确系数 */
    public dropScan = 1;
    @property({ displayName: "锤摆最大角度" })
    /**锤摆最大角度 */
    public rockMaxAngle = 15.0;
    @property({ displayName: "吊绳水平摇摆最大距离" })
    /**吊绳水平摇摆最大距离 */
    public craneMoveMaxX = 0.0001;
    @property({ displayName: "吊绳缩放比" })
    /**吊绳垂直摇摆最大距离 */
    public craneMoveMaxY = 0.3;
    @property({ displayName: "吊绳不动" })
    /**吊绳垂直摇摆最大距离 */
    public isNotMove = false;
    /**高楼最大锤摆角 */
    public maxRockRotation = 0.0;
    @property({ displayName: "摄像机移动速度" })
    public rotateSpeed: number = 0.5;
    @property({ displayName: "长按观察时间（毫秒）" })
    public touchPressTime: number = 300;
    /**掉落判断偏移值 */
    private dropDistance: number;
    private floorContainerRockFrequency: number = 1;
    private floorRockTick: number = 0;
    private sky1Height: number;
    private sky2Height: number;
    public cityNode: Node;

    // private readonly MAIN_CAMERA_POS = new Vec3(0, 3, 14)
    private readonly MAIN_CAMERA_POS = new Vec3(0, 3, 18)
    private readonly TOUCH_AROUND_TIME = 0.2;
    private craneGrows: Node[];
    private floorSpeed: Vec3;
    private _floorNodes: Node[];
    private _isCanCreateNext: boolean = false;

    private _connectFloors: RigidBody[] = [];

    private _floorOffNum = 0;
    private _floorOffset = 0;
    private _dropBox: RigidBody;
    private _isUseJerryState: boolean = false;
    private _dropBoxPos: Vec3;
    private _holderEurAngle: Vec3;
    private _holderPos: Vec3;
    private _holderLineScale: Vec3;
    private _holderLineOldScale: Vec3;
    private _skyObjList: Node[];

    private roTime = 0;

    private ray: geometry.Ray;


    private floorFirstName: string = "floor_1_1"
    private floorName: string = "floor_1_0";
    private readonly CITYMODEL_NAME = "cityModel"
    private readonly EARTHMODEL_NAME = "earth";


    private curHp: number = 0;
    private maxHp: number = 0;
    private resultWin: ReGameWin;
    private numMoveTime = 0;

    private upVec = new Vec3(0, 1, 0)

    private craneHolderPos: Vec3
    private isStart: boolean;
    private isClick: boolean

    private _yaw = 0;
    private _pitch = 0;
    private touchTime = 0;
    private isWatchState: boolean;
    private twGuide: Tween<Color>
    /**获取最后一层楼高度 */
    public get floorHeight(): number {
        var len = this._floorNodes.length
        var floorNode: Node;
        if (len > 1) {
            floorNode = this._floorNodes[len - 2];
        } else if (len > 0) {
            floorNode = this.getLastFloor();
        } else {
            return 0;
        }
        return this.getMeshSize(floorNode).y * 2
    }
    private initData() {

        this._floorNodes = [];
        this._skyObjList = [];
        this.craneGrows = [];
        this._floorOffNum = 0;
        this._floorOffset = 0;
        this.worldCamera.node.setPosition(this.MAIN_CAMERA_POS)
        this.SkyObj.setWorldPosition(this.worldCamera.node.getWorldPosition())
        this.mainUI.initData();
        this.mainUI.showGuide("点击任意位置开始游戏", 1)


        this.createNewBox();
        this.craneHolder.setWorldPosition(this.craneHolderPos)
        this.cityModelChange(true);
        this.skyBoxHandler();
    }
    start() {
        this.assetMgr.preLoadBundles().then(this.loadBundlesComplete.bind(this));

        profiler.hideStats();
        // this.initData();
        this.craneHolderPos = this.craneHolder.getWorldPosition();
        var floorCollider = this.floorTemp.getComponent(PlaneCollider)
        floorCollider.material.restitution = 0;
        floorCollider.sharedMaterial.restitution = 0;
        this.floorSpeed = new Vec3();
        this._holderEurAngle = new Vec3();

        // this.mainUI.node.on(Input.EventType.MOUSE_UP, this.onEndTouch, this)
        this.mainUI.node.on(Input.EventType.TOUCH_END, this.onEndTouch, this)
        this.mainUI.node.on(Input.EventType.TOUCH_CANCEL, this.onEndTouch, this)
        this.mainUI.node.on(Input.EventType.TOUCH_START, this.onClickStart, this)
        this.mainUI.node.on(Input.EventType.TOUCH_MOVE, this.onMouseMove, this)
        this._holderPos = this.holderRock.getPosition();
        this._holderLineOldScale = this.holderLine.getWorldScale().clone();
        this._holderLineScale = this._holderLineOldScale.clone();

        this.mainUI.setupGameCtrl(this)
        this.ray = new geometry.Ray();
        this.mainUI.GM.active = this.isEditState;


    }
    loadBundlesComplete() {
        this.assetMgr.getRes("config", JsonAsset, "config").then(data => {
            GameConfig.initConfig(data.json["config"]);
            this.initData();
        })

    }
    subHp() {
        this.curHp = this.mainUI.subHp();

        if (this.curHp < 1) {
            console.log("游戏结束")
            this.mainUI.finishContinue();
            if (!this.resultWin) {
                this.assetMgr.createPrefab("ReGameWin", "components", Vec3.ZERO, this.node).then(data => {
                    this.resultWin = (data as Node).getComponent(ReGameWin);
                    this.resultWin.showWin(this._floorNodes.length, this.mainUI.maxRate, this.mainUI.money, this.again.bind(this), this.advFunc.bind(this))
                    this.isStart = false;
                })
            } else {
                this.resultWin.showWin(this._floorNodes.length, this.mainUI.maxRate, this.mainUI.money, this.again.bind(this), this.advFunc.bind(this))
                this.isStart = false;
            }
        }
    }
    again() {
        var len = this._floorNodes.length;
        for (var i = 0; i < len; i++) {
            this.assetMgr.removeInstant(this._floorNodes[i])
        }
        len = this._skyObjList.length;
        for (var i = 0; i < len; i++) {
            this.assetMgr.removeInstant(this._skyObjList[i])
        }
        len = this.craneGrows.length;
        for (var i = 0; i < len; i++) {
            this.assetMgr.removeInstant(this.craneGrows[i])
        }
        this.initData();
    }
    advFunc() {
        this.isStart = true;
        this.mainUI.addHP(1)
        this.createNewBox();
        this.canCreateFunc();
        this.resetCameraPos(this.getLastFloor(), 1.0).start();
    }
    rotateByPoint(target: Vec3, center: Vec3, angle: number, axis: Vec3 = Vec3.UP): Vec3 {
        let quat = new Quat();
        let dir = new Vec3();
        let rotated = new Vec3();
        // 逐元素向量减法: 目标位置 - 中心位置 = 由中心位置指向目标位置的向量
        Vec3.subtract(dir, target, center);
        // 角度转弧度
        let rad = misc.degreesToRadians(angle);
        // 根据旋转轴和旋转弧度计算四元数: 绕指定轴旋转指定弧度后的四元数
        Quat.fromAxisAngle(quat, axis, rad);
        // 向量四元数乘法: 向量 * 四元数 = 该向量按照四元数旋转后的向量
        Vec3.transformQuat(rotated, dir, quat);
        // 逐元素向量加法: 中心点 + 旋转后的向量 = 旋转后的点
        Vec3.add(rotated, center, rotated);

        return rotated;
    }

    update(deltaTime: number) {


        this.roTime += deltaTime;
        if (!this.isStart) {
            var pos = this.rotateByPoint(this.worldCamera.node.position, this.craneHolder.position, deltaTime * 10);
            this.worldCamera.node.lookAt(this.craneHolder.position)
            this.numMoveTime += 1;
            pos.add(this.upVec.clone().multiplyScalar(0.1 * Math.sin(this.numMoveTime * 0.01)));
            pos.add(this.worldCamera.node.forward.multiplyScalar(Math.sin(this.numMoveTime * 0.01) * 0.01));
            this.worldCamera.node.setPosition(pos)
        }
        this.floorRockTick += deltaTime;

        if (this.touchTime > 0 && game.totalTime - this.touchTime > this.touchPressTime) {
            // this.isWatchState = true;
            this.mainUI.watchState(true)
        }

        this.floorContainer.angle = Math.sin(this.floorRockTick * this.floorContainerRockFrequency) * this.maxRockRotation;
        if (!this.isNotMove) {
            this._holderEurAngle.x = Math.sin(this.roTime * 2) * this.rockMaxAngle;
            this.holderRock.eulerAngles = this._holderEurAngle;
            this._holderPos.z += this.craneMoveMaxX * Math.sin(this.roTime * 2)

            this._holderLineScale.y = this._holderLineOldScale.y + this.craneMoveMaxY * this._holderLineOldScale.y * Math.cos(this.roTime * 2)//(1 + this.craneMoveMaxY * Math.sin(this.roTime * 2));
        }
        this.holderLine.setWorldScale(this._holderLineScale)
        this.holderRock.setPosition(this._holderPos)
        this.holderCarry.setWorldPosition(this.lineEndPoint.getWorldPosition())
        if (this._isCanCreateNext && this._dropBox && this._dropBox.node && this._dropBox.node.parent == this.holderTemp) {

            if (this._dropBoxPos) {

                Vec3.subtract(this._dropBoxPos, this._dropBox.node.worldPosition, this._dropBoxPos)
                // if (this._dropBoxPos.y < 0) {//防止上一帧dropBox已经掉落导致位置问题

                Vec3.multiplyScalar(this.floorSpeed, this._dropBoxPos, 1 / deltaTime)
                this.floorSpeed.x *= 3
                this.floorSpeed.y = -10;

                // }
            }
            this._dropBoxPos = this._dropBox.node.worldPosition.clone();

        }
    }

    initFloorData(obj: Node, pos: Vec3, speed: Vec3) {
        var preFloor = this.getLastFloor();
        if (!preFloor) {
            preFloor = obj;
        }
        this._floorNodes.push(obj);
        obj.setParent(this.node, true)


        var rig = obj.getComponent(RigidBody)
        rig.angularFactor = Vec3.UNIT_Z;
        rig.getComponent(Collider).isTrigger = false;
        rig.useGravity = true;
        rig.setLinearVelocity(new Vec3(speed.x / 7, speed.y, 0))

        let collider = obj.getComponent(Collider);

        // 监听触发事件
        collider.once("onCollisionEnter", this.onEnterCollision, this);

    }
    private onEnterCollision(event: ICollisionEvent) {
        var lastFloor = this.getLastFloor();
        lastFloor.setParent(this.floorContainer, true)
        lastFloor.eulerAngles = Vec3.ZERO;
        this.onCollision(event)
        // tween(lastFloor).to(0.1, { eulerAngles: Vec3.ZERO }).call(this.onCollision.bind(this)).start();
    }
    private getFloorName(): string {
        if (this._floorNodes.length < 1) {
            return this.floorFirstName;
        }
        return this.floorName;
    }
    /**固定楼层 */
    private frozenFloor(rightBody: RigidBody): void {

        rightBody.type = ERigidBodyType.STATIC;
        rightBody.linearFactor = Vec3.ZERO
        rightBody.angularFactor = Vec3.ZERO

        // rightBody.node.eulerAngles = Vec3.ZERO;
    }
    private connectFloor(floor: Node, preFoor: Node): void {
        var ppc = preFoor.addComponent(PointToPointConstraint)
        var rig = floor.getComponent(RigidBody);
        rig.useGravity = false;
        ppc.connectedBody = rig
        ppc.pivotA = new Vec3(floor.worldPosition.x - preFoor.worldPosition.x, 1, 0)
        this._connectFloors.push(rig)
    }
    removeFloor(floor: Node) {
        this.assetMgr.removeInstant(floor)
        var index = this._floorNodes.indexOf(floor)
        this._floorNodes.splice(index, 1)
    }
    onCollision(event: ICollisionEvent) {
        var lenFloor = this._floorNodes.length
        if (lenFloor > 0) {
            var lastFloor = this.getLastFloor();

            var flogPos = lastFloor.getWorldPosition();
            // flogPos.z = 2;

            var rightBody = lastFloor.getComponent(RigidBody);

            if (lenFloor > 1) {
                var preFloor = this._floorNodes[lenFloor - 2];
                var forceDir = lastFloor.worldPosition.x - preFloor.worldPosition.x;
                var lastFloorMeshSize = this.getMeshSize(lastFloor)
                var boxH = lastFloorMeshSize.y + this.floorHeight * 0.5
                var boxWHalf = lastFloorMeshSize.x;
                var dis = Vec3.distance(preFloor.position, lastFloor.position)//Math.abs(preFloor.worldPosition.x - lastFloor.worldPosition.x);
                this.dropDistance = Math.sqrt(boxH * boxH + boxWHalf * boxWHalf) * this.dropScan;
                console.log("距离：" + dis + ",最大距离差：" + this.dropDistance)
                var offset = dis - this.dropDistance
                if (offset >= 0) {
                    lastFloor.getComponent(Collider).isTrigger = true;
                    rightBody.clearState();// = Vec3.ZERO
                    rightBody.angularFactor = Vec3.ZERO
                    lastFloor.setParent(this.node, true)
                    var offAngle = (10.0 + (offset / this.dropDistance) * 90);
                    // rightBody.linearFactor = Vec3.ONE
                    // var forcePos = new Vec3(0, 0, 0);
                    var targetAngle: number;
                    if (preFloor.worldPosition.x < lastFloor.worldPosition.x) {
                        targetAngle = -offAngle;
                        rightBody.setLinearVelocity(new Vec3(1, -9, 5))
                        // Vec3.multiplyScalar(rightBody.linearFactor, Vec3.UNIT_X, 50);
                        // forcePos.x = 10;
                        console.log("往右掉下来")
                    } else {
                        // forcePos.x = -10;
                        targetAngle = offAngle
                        rightBody.setLinearVelocity(new Vec3(-1, -9, 5))
                        // Vec3.multiplyScalar(rightBody.linearFactor, Vec3.UNIT_X, -50);
                        console.log("往左掉下来")
                    }
                    this.curHp--

                    tween(lastFloor).to(0.5, { angle: targetAngle }).start();
                    this.scheduleOnce(() => {
                        this.removeFloor(lastFloor)
                        this.subHp()
                        if (this.curHp > 0) {
                            this.createNewBox();
                            this.canCreateFunc();
                        }
                    }, 1)
                } else {

                    this.frozenFloor(rightBody)
                    var pos = lastFloor.position;
                    //防止碰撞检测延时所以固定了Y

                    lastFloor.setPosition(pos.x, preFloor.position.y + this.floorHeight, pos.z)
                    lastFloor.rotation = preFloor.rotation;
                    var bolPerfect = false;
                    if (this.checkIsPerfactPos(lastFloor.position.x, preFloor.position.x)) {//完美命中
                        var lastPos = lastFloor.position;
                        lastFloor.setPosition(preFloor.position.x, lastPos.y, lastPos.z)
                        console.log("完美命中")
                        this.rockHandler(0);
                        bolPerfect = true;
                        this.mainUI.showContinue()
                    } else {
                        console.log("命中")
                        this.rockHandler(forceDir);
                        this.mainUI.addMoney(GameConfig.config.perFloorScore * (1 - Math.abs(offset) / this.dropDistance))
                    }
                    this.createFrog(flogPos, bolPerfect)
                    this.focuseLastFloorPos(lastFloor)
                    this.createNewBox();
                }
            } else {
                this.focuseLastFloorPos(lastFloor)
                this.frozenFloor(rightBody)
                this.createNewBox();
                this.showBeginGuide(false)
            }
        }
    }

    checkIsPerfactPos(matchX: number, targetX: number) {
        return Math.abs(matchX - targetX) < 0.08
    }
    getMeshSize(node: Node, scaleVec: Vec3 = Vec3.ONE): Vec3 {
        let mesh = node.getComponent(MeshRenderer)
        if (mesh) {
            var modelHalf = mesh.model.modelBounds.halfExtents.clone();
            modelHalf.multiply(node.getWorldScale());//*= node.scale.y;
            modelHalf.multiply(scaleVec);
            return modelHalf;
        }
    }
    createCraneGrow(isTween: boolean) {
        this.assetMgr.getRes("CraneGrow", Prefab, "components").then(data => {
            var obj = this.assetMgr.instantiate(data);
            obj.setParent(this.craneGrowTemp)
            var modelSize = this.getMeshSize(obj);
            var scale = this.floorHeight / (modelSize.z * 2);
            obj.setScale(obj.scale.x, obj.scale.y, scale);
            var pos = obj.getWorldPosition();
            this.craneGrows.push(obj);
            pos.y = obj.parent.worldPosition.y + (this.craneGrows.length - 1) * this.floorHeight;
            var targetPos = new Vec3(pos.x, pos.y + this.floorHeight, pos.z)
            if (isTween) {

                obj.setWorldPosition(pos)
                // obj.setWorldPosition(pos.x, pos.y + (this.craneGrows.length) * this.floorHeight , pos.z);
                tween(obj).to(0.2, { worldPosition: targetPos }).start();
            } else {
                obj.setWorldPosition(targetPos)
            }
        })
    }
    private canCreateFunc() {
        this._isCanCreateNext = true;
    }
    resetCameraPos(floor: Node, during = 0.2) {
        if (!floor) {
            return;
        }
        var wolrdPos = floor.getWorldPosition();
        wolrdPos.x = this.MAIN_CAMERA_POS.x;
        wolrdPos.z = this.MAIN_CAMERA_POS.z;
        wolrdPos.y += 1.8;



        return tween(this.worldCamera.node).to(during, { worldPosition: wolrdPos, eulerAngles: Vec3.ZERO })
    }

    /**相机跟踪最后一块楼层 */
    focuseLastFloorPos(floor: Node, isTween: boolean = true) {
        this.createCraneGrow(isTween);
        this.checkSkyObjCreate();
        var wolrdPos = floor.getWorldPosition();
        wolrdPos.x = this.MAIN_CAMERA_POS.x;
        wolrdPos.z = this.MAIN_CAMERA_POS.z;
        wolrdPos.y += 1.8;

        this.resetCameraPos(floor).call(this.canCreateFunc.bind(this)).start();
        // this.worldCamera.node.lookAt(floor.getWorldPosition())
        var cranePos = this.craneHolder.getWorldPosition();
        cranePos.y += this.floorHeight;
        if (isTween) {
            tween(this.craneHolder).to(0.2, { worldPosition: cranePos }).start();
            tween(this.SkyObj).to(0.2, { worldPosition: wolrdPos }).start();
        } else {
            this.craneHolder.setWorldPosition(cranePos)
            this.SkyObj.setWorldPosition(wolrdPos)
        }
        this.skyBoxHandler();

    }
    skyBoxHandler() {

        if (!this.sky1Height) {
            let modelCenter = this.getMeshSize(this.skyBox)
            this.sky1Height = modelCenter.y
        }
        if (!this.sky2Height) {
            let modelCenter = this.getMeshSize(this.skyBox2)
            this.sky2Height = modelCenter.y
        }
        var numFloor = this._floorNodes.length;
        this.mainUI.setFloorNum(numFloor);
        this.starMgr.checkShow(numFloor);
        //天空1处理
        var rate = this.floorHeight / this.sky1Height;
        var alpha = numFloor * rate;
        this.changeSkyBoxAlpha(this.skyBox, 1 - alpha, false)

        //天空2处理
        if (alpha >= 1) {//已冲破第一层天空
            var rate2 = this.floorHeight / (this.sky2Height - this.sky1Height);
            alpha = (numFloor - (1 / rate)) * rate2
            this.changeSkyBoxAlpha(this.skyBox2, 1 - alpha, false)
        } else {//还在第一层
            // this.changeSkyBoxAlpha(this.skyBox2, 0, true)
        }
        if (numFloor == 100) {
            this.cityModelChange(false)
        }
        if (numFloor == 10) {
            // this.mainUI.showGuide("可长按滑动观察", 2)
        }
    }
    cityModelChange(isShowCity: boolean) {
        if (isShowCity) {
            if (!this.cityNode || (this.cityNode && this.cityNode.name != this.CITYMODEL_NAME)) {
                if (this.cityNode) {

                    this.assetMgr.removeInstant(this.cityNode)
                }
                this.assetMgr.createPrefab(this.CITYMODEL_NAME, "components", Vec3.ZERO, this.node).then(data => {
                    this.cityNode = data as Node;
                })
            }
        } else {
            if (this.cityNode && this.cityNode.name != this.EARTHMODEL_NAME) {
                this.assetMgr.removeInstant(this.cityNode)
                this.assetMgr.createPrefab(this.EARTHMODEL_NAME, "components", Vec3.ZERO, this.node).then(data => {
                    this.cityNode = data as Node;
                })
            }
        }
    }
    createNewBox() {
        // this.assetMgr.getRes("BaseBox", Prefab, "components").then(data => { this.createBox(data) })
        this._dropBoxPos = null;
        this.assetMgr.getRes(this.getFloorName(), Prefab, "components").then(data => { this.createFloorBox(data) })
    }
    createFloorBox(box: Prefab) {
        if (box) {
            var obj = this.assetMgr.instantiate(box);
            if (obj) {

                var rig = obj.getComponent(RigidBody);
                rig.angularFactor = Vec3.ZERO;
                rig.getComponent(Collider).isTrigger = true;
                rig.useGravity = false;
                this._dropBox = rig;

                obj.setParent(this.holderTemp)
            }
        }
    }
    createFrog(pos: Vec3, isPerfect: boolean = false) {
        this.assetMgr.getRes(isPerfect ? "frogParticle" : "frogParticle2", Prefab, "effect").then(data => { this.createFrogData(data, pos) })
    }
    createFrogData(frog: Prefab, pos: Vec3) {
        if (frog) {
            var obj = this.assetMgr.instantiate(frog);
            if (obj) {
                var pa = obj.getComponent(ParticleSystemComponent)
                obj.setParent(this.getLastFloor())
                obj.setWorldPosition(pos)
                // pa.play()
            }
        }
    }
    getLastFloor(): Node {
        var len = this._floorNodes.length
        if (this._floorNodes.length > 0) {
            return this._floorNodes[len - 1];
        }
        return null;
    }
    onEndTouch() {
        console.log("endTouch")
        if (!this.isClick) {

            var floor = this.getLastFloor();
            if (floor) {
                this.resetCameraPos(floor, 1.0).start();
            }
        } else {
            this.isClick = false;
        }
        this.touchTime = 0;
        this.mainUI.watchState(false)
    }
    onClickMainUI(touch: EventTouch, event) {
        this.isClick = game.totalTime - this.touchTime < 300;
        if (!this.isClick) {
            return;
        }
        console.log("点击了")
        touch.preventSwallow = true;
        if (this._isCanCreateNext) {
            if (this.isEditState) {
                var pos = touch.getLocation();
                this.worldCamera.screenPointToRay(pos.x, pos.y, this.ray)

                const mask = 0xffffffff;
                const maxDistance = 10000000;
                const queryTrigger = true;

                if (PhysicsSystem.instance.raycast(this.ray, mask, maxDistance, queryTrigger)) {
                    const results = PhysicsSystem.instance.raycastResults;
                    for (let i = 0; i < results.length; i++) {
                        const result = results[i];
                        const collider = result.collider;
                        if (this._skyObjList.indexOf(collider.node) > -1) {
                            const distance = result.distance;
                            const hitPoint = result.hitPoint;
                            const hitNormal = result.hitNormal;
                            console.log("选中了：" + collider.node.name)
                            this.mainUI.setSelectObj(collider.node)
                            return;
                        }
                    }
                }
            }

            var dropFloor = this._dropBox.node
            if (dropFloor) {
                this._isCanCreateNext = false;
                this.initFloorData(dropFloor, dropFloor.worldPosition, this.floorSpeed)
                this.mainUI.hideGuide()
            }
        } else if (!this.isStart) {//点击开始游戏
            this.isStart = true;
            this.canCreateFunc();
            // this.mainUI.showNotice(false);
            this.resetCameraPos(this._dropBox.node).start();
            this.mainUI.showGuide("点击任意地方下落", 1)
            this.showBeginGuide(true)
        }
    }
    showBeginGuide(bol: boolean) {
        this.firstFloorGuideSquar.active = bol;
        if (this.twGuide) {
            this.twGuide.stop();
        }
        if (bol) {
            var meshRender = this.firstFloorGuideSquar.getComponent(MeshRenderer)
            var mat = meshRender.materials[0]
            var pass = mat.passes[0];
            var ab = pass.getHandle("albedo");
            if (ab) {
                var color: Color = new Color();
                pass.getUniform(ab, color)
                this.twGuide = tween(color).to(0.3, { a: 0 }, {
                    onUpdate: (value, ratio) => {

                        pass.setUniform(ab, color);
                    }
                }).to(0.3, { a: 255 }, {
                    onUpdate: (value, ratio) => {

                        pass.setUniform(ab, color);
                    }
                }).union().repeatForever().start();
            }
        }
    }
    onClickStart(e: EventTouch) {

        this.touchTime = game.totalTime
        this._yaw = 0
        this._pitch = 0
    }

    onMouseMove(event: EventTouch) {
        if (game.totalTime - this.touchTime < 300) {
            return;
        }
        if (this._floorNodes.length > 0) {
            const deltaX = event.getDeltaX();
            const deltaY = -event.getDeltaY();
            // console.log("deltaX="+deltaX+",deltaY="+deltaY)
            // 根据鼠标移动量更新摄像机的旋转角度
            this._yaw += deltaX * this.rotateSpeed;
            this._pitch += deltaY * this.rotateSpeed;
            this._pitch = Math.max(-90, Math.min(90, this._pitch));

            // 更新摄像机的位置和旋转
            this.updateCameraPosition();
            this.mainUI.hideGuide();
        }
    }

    updateCameraPosition() {
        // 计算摄像机的新位置
        const radiansYaw = this._yaw * Math.PI / 180 + Math.PI / 2;
        const radiansPitch = this._pitch * Math.PI / 180;
        const cameraPosition = new Vec3();
        cameraPosition.x = this.MAIN_CAMERA_POS.z * Math.cos(radiansPitch) * Math.cos(radiansYaw);
        cameraPosition.y = this.MAIN_CAMERA_POS.z * Math.sin(radiansPitch);
        cameraPosition.z = this.MAIN_CAMERA_POS.z * Math.cos(radiansPitch) * Math.sin(radiansYaw);

        // 将计算出的位置添加到目标点的位置上，确保摄像机与目标点的相对位置不变
        var centerVec = this.getLastFloor().getWorldPosition().clone();
        centerVec.y += 1.8
        const targetPosition = centerVec;
        cameraPosition.add(targetPosition);

        // 设置摄像机的位置和旋转
        this.worldCamera.node.setPosition(cameraPosition);
        this.worldCamera.node.setRotationFromEuler(0, -this._yaw, -this._pitch);

        // 将摄像机看向目标点
        this.worldCamera.node.lookAt(centerVec);
    }

    /**根据偏移值进行处理摇摆效果 */
    rockHandler(offset: number) {
        var lenFloor = this._floorNodes.length;
        var rate = 1.5 - lenFloor * 0.003
        if (rate < 0) {
            rate = 0;
        }
        this._floorOffNum += Math.abs(offset) * rate;
        this._floorOffset += offset;

        // this.floorRockTick = this.floorContainerRockFrequency
        this.floorContainerRockFrequency = this.limit(1 + lenFloor * 0.01, 1, 3)
        // this.floorContainer.angle = Math.sin(this.floorRockTick * this.floorContainerRockFrequency) * this.maxRockRotation;
        var pos = this.getLastFloor().getWorldPosition()
        this.maxRockRotation = Math.atan(this._floorOffNum / pos.y);
        var angle = this.floorContainer.angle / this.maxRockRotation
        if (this.maxRockRotation && angle >= -1 && angle <= 1) {
            this.floorRockTick = Math.asin(angle) / this.floorContainerRockFrequency;
        }
    }
    limit(num: number, min: number, max: number) {
        return Math.min(Math.max(num, min), max);
    }
    changeSkyBoxAlpha(node: Node, alpha: number, addMode: boolean) {
        if (!addMode && alpha < 0) {
            alpha = 0;
        } else if (addMode && alpha > 1) {
            alpha = 1;
        }
        if (node) {
            var mr = node.getComponent(MeshRenderer);
            var mat = mr.material;
            var pass = mat.passes[0];
            pass.setUniform(pass.getHandle("transparencyFactor"), alpha);

        }
    }
    /**根据楼层高度动态创建物体 */
    checkSkyObjCreate() {
        var len = this._floorNodes.length;
        var skyObj = GameConfig.getCfgByIdx(len)
        var cameraPos: Vec3 = new Vec3;
        if (skyObj) {
            var list = skyObj.list;
            list.forEach(item => {
                this.assetMgr.getRes(item.name, Prefab, "skyNode").then(data => {
                    var obj = this.assetMgr.instantiate(data);
                    if (obj) {
                        if (this.isEditState) {
                            var collider = obj.getComponent(Collider);
                            if (collider) {
                                collider.enabled = true;
                            }
                        }
                        this.getLastFloor().getWorldPosition(cameraPos);
                        cameraPos.add3f(item.pos[0], item.pos[1], item.pos[2])
                        obj.setWorldPosition(cameraPos)
                        obj.setParent(this.node)
                        this._skyObjList.push(obj);
                    }
                })
            });
        }
        var uiSize = this.mainUI.getComponent(UITransform)

        this._skyObjList.forEach(item => {
            this.getLastFloor().getWorldPosition(cameraPos);
            cameraPos = this.worldCamera.convertToUINode(cameraPos, this.mainUI.node)
            var itemPos = this.worldCamera.convertToUINode(item.worldPosition, this.mainUI.node)
            if (cameraPos.y > itemPos.y + uiSize.contentSize.height || Math.abs(itemPos.x) > uiSize.contentSize.width) {
                this.assetMgr.removeInstant(item);
                this._skyObjList.splice(this._skyObjList.indexOf(item), 1)
            }
        })
    }
    async createFloorList(num: number) {

        var lenFloor = this._floorNodes.length;
        var createNum = num - lenFloor;
        if (createNum > 0) {
            for (var i = 0; i < createNum; i++) {
                await this.createFloorListItem();
            }
        }

    }
    async createFloorListItem() {
        var lastFloor = this.getLastFloor();
        return this.assetMgr.getRes(this.getFloorName(), Prefab, "components").then(data => {
            var obj = this.assetMgr.instantiate(data);
            if (obj) {
                var scale = lastFloor.getWorldScale();
                obj.setScale(scale)
                obj.setParent(this.floorContainer, true)
                var pos = lastFloor.position;
                //防止碰撞检测延时所以固定了Y

                obj.setPosition(pos.x, pos.y + this.floorHeight, pos.z)
                obj.rotation = lastFloor.rotation;
                this.frozenFloor(obj.getComponent(RigidBody))
                this._floorNodes.push(obj);
                this.focuseLastFloorPos(this.getLastFloor(), false)
            }
        })
    }
}

