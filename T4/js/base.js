/**
 * @description 生成生成场景
 * @date 2020-02-04
 * @class Base
 */
class Base {
    /**
     * @param {Object} option 基础参数值 
     */
    constructor(option) {
        this.baseConfig = {
            camera: {
                fov: 45,
                near: 1,
                far: 10000,
                scale: 2,
                position: [0, 0, 200]
            },
            controls: {
                enabled: true,
                mouseDownPrevent: false,
                enablePan: true,
                panSpeed: 1.0,
                enableZoom: true,
                zoomSpeed: 1,
                enableRotate: true,
                rotateSpeed: 0.3,
                distance: [0, 2000],
                polarAngle: [-Math.PI, 2 * Math.PI],
                azimuthAngle: [-Math.PI, Math.PI]
            },
            ...option
        };
        // 公共变量
        this.isAnimation = false;

        this.clock = null; // 帧数相差时间
        this.scene = null; // 场景
        this.camera = null; // 相机
        this.controls = null; // 控制
        this.renderer = null; // renderer
        this.animation = null; // animation function
        this._initiate(); // 初始化
    }
    /**
     * 开始初始化
     */
    _initiate() {
        const {
            camera = {},
                controls,
                id
        } = this.baseConfig;
        if (id === undefined) return false;
        // dom
        this.container = document.getElementById(id);

        // width and height
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 1);
        this.container.appendChild(this.renderer.domElement);

        // camera
        this.camera = new THREE.PerspectiveCamera(camera.fov, width / height, camera.near, camera.far);
        // camera position
        const cameraPosition = new THREE.Vector3(...camera.position);
        this.camera.position.copy(cameraPosition);
        // scene
        this.scene = new THREE.Scene();

        // Controls 
        if (THREE.OrbitControls) {
            this._Controls(controls);
        }
        this.clock = new THREE.Clock();
        this.isAnimation = true;
        // render
        this._renderers();
    }
    _setAnimation(callback) {
        typeof callback !== 'function' ? callback = () => {} : null;
        this.animation = callback;
    }

    _Controls(opts) {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update()
        this.controls.enabled = opts.enabled;
        this.controls.zoomSpeed = opts.zoomSpeed;
        this.controls.enablePan = opts.enablePan;
        this.controls.keyPanSpeed = opts.panSpeed;
        this.controls.enableZoom = opts.enableZoom;
        this.controls.rotateSpeed = opts.rotateSpeed;
        this.controls.enableRotate = opts.enableRotate;
        this.controls.minDistance = opts.distance[0];
        this.controls.maxDistance = opts.distance[1];
        this.controls.minPolarAngle = opts.polarAngle[0];
        this.controls.maxPolarAngle = opts.polarAngle[1];
        this.controls.minAzimuthAngle = opts.azimuthAngle[0];
        this.controls.maxAzimuthAngle = opts.azimuthAngle[1];
        this.controls.mouseDownPrevent = opts.mouseDownPrevent;
    }

    _renderers() {
        const thm = this;
        (function Animations() {
            if (thm.isAnimation) {
                thm._ref = window.requestAnimationFrame(Animations);
                var delta = thm.clock.getDelta();
                if (delta > 0 && thm.animation) thm.animation(delta);
                // if (stats) stats.update();
                if (TWEEN) TWEEN.update();
                thm.renderer.render(thm.scene, thm.camera);
                thm.controls.update();
            } else {
                df_raf && window.cancelAnimationFrame(thm._ref);
                thm.controls.dispose();
                thm.renderer.dispose();
                thm.renderer.forceContextLoss();
            }
        })();
    }
}