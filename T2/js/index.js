class CreateEarth extends Base {
    constructor() {
        // tansfer options
        super({
            id: 'GL'
        });
        // render
        this._setAnimation(this.animation);

        this.Config = {
            radius: 50, // 半径
            rotate: 0.02, // 地球旋转速度  正 逆时针 负 顺时针
            dots: {
                size: [1, 4], // 大小
                color: 'rgba(255,255,255,0.9)', // 颜色 透明度
                height: 0.5 // 离地球的高度
            }
        }

        this.earthGroup = new THREE.Group(); // 用于添加地球相关
        this.scene.add(this.earthGroup);

        // 生成地球
        this.InitEarth();

        // 生成 数据点
        const dotsData = DotsDatas.filter((e, i) => i < 100);
        const dotsGroup = this.InitDots(dotsData);
        this.earthGroup.add(dotsGroup);
    }

    /**
     * 创建地球相关
     */
    InitEarth() {
        // config
        const {
            radius
        } = this.Config;
        // earth map
        const earthMap = new THREE.TextureLoader().load("./images/earth.png");
        // earth hgiht map
        const bumpMap = new THREE.TextureLoader().load("./images/bump.png");
        const geometry = new THREE.SphereBufferGeometry(radius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: earthMap,
            bumpMap: bumpMap, // 用于增加地球的高度感
            bumpScale: 1.5,
            specular: 0x000000,
            shininess: 40,

        });
        const sphere = new THREE.Mesh(geometry, material);
        this.earthGroup.add(sphere);

        // light
        const lightGroup = this.InitEarthLight();
        this.earthGroup.add(lightGroup);
    }

    /**
     * 创建地球所需要的光源
     */
    InitEarthLight() {
        const group = new THREE.Group();
        const spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(100, 250, 100);

        spotLight.castShadow = true;

        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        spotLight.shadow.camera.near = 400;
        spotLight.shadow.camera.far = 2000;
        spotLight.shadow.camera.fov = 20;

        group.add(spotLight);

        const lightClone = spotLight.clone();
        lightClone.position.x = -250;
        group.add(lightClone);

        const lightCloneT = spotLight.clone();
        lightCloneT.position.y = -250;
        group.add(lightCloneT);

        return group;
    }

    /**
     * 设置公共光源
     */
    setLight() {
        const light = new THREE.AmbientLight(0xffffff); // soft white light
        this.scene.add(light);
    }

    /**
     * 生成点
     * @param {Array} data 点数据 
     */
    InitDots(data) {
        const group = new THREE.Group();
        if (!Array.isArray(data)) return group;
        const {
            dots = {}
        } = this.Config; // 点配置
        // 点的材质
        const colorArr = this.getColorArr(dots.color);
        const map = new THREE.TextureLoader().load('./images/dot.png');
        const material = new THREE.MeshBasicMaterial({
            color: colorArr[0],
            opacity: colorArr[1],
            side: THREE.DoubleSide,
            transparent:true,
            depthWrite: false,
            map: map
        });
        // 添加点
        data.forEach((elem) => {
            const dot = this.addDtos(elem, dots, material);
            group.add(dot);
        })
        return group;
    }

    /**
     * 添加一个点
     * @param {Object} info 点信息
     * @param {Object} opts 点的相关配置
     * @param {Object} mat 材质
     * @returns {Object} 点
     */
    addDtos(info, opts, mat) {
        // 半径
        const radius = this.Config.radius + opts.height;
        // 坐标
        const position = this.latLongToVector3({
            lat: info.x,
            lon: info.y,
            radius: radius
        })
        // geometry
        const size = THREE.Math.randFloat(opts.size[0], opts.size[1]);
        const geometry = new THREE.PlaneGeometry(size, size, 1);
        // plane
        const plane = new THREE.Mesh(geometry, mat);
        plane.position.copy(position);
        plane.lookAt(new THREE.Vector3());
        return plane;
    }

    /**
     * render
     */
    animation = (dt) => {
        if (this.earthGroup) {
            const {
                rotate
            } = this.Config;
            this.earthGroup.rotation.y += dt * rotate;
        }
    }

    /**
     * 经纬度转换为3D坐标系
     * @param {Object} opts 经纬度 半径高度 
     */
    latLongToVector3(opts) {
        opts = opts || {};
        var lat = parseFloat(opts.lat),
            lon = parseFloat(opts.lon),
            radius = opts.radius,
            rotation = opts.rotation || Math.PI / 2;
        var phi = (lat) * Math.PI / 180;
        var theta = (lon) * Math.PI / 180 + rotation;
        var x = (radius) * Math.cos(phi) * Math.cos(theta);
        var y = (radius) * Math.sin(phi);
        var z = (radius) * Math.cos(phi) * Math.sin(theta);
        return new THREE.Vector3(z, y, x);
    }

    /**
     * 颜色 转为为 THREE 颜色向量 和 透明度
     * @param {String} str 颜色
     * @returns {Array} [color = {r,g,b} , opacity = 1.0]
     */
    getColorArr(str) {
        if (Array.isArray(str)) return str; //error
        var _arr = [];
        str = str + '';
        str = str.toLowerCase().replace(/\s/g, "");
        if (/^((?:rgba)?)\(\s*([^\)]*)/.test(str)) {
            var arr = str.replace(/rgba\(|\)/gi, '').split(',');
            var hex = [
                pad2(Math.round(arr[0] * 1 || 0).toString(16)),
                pad2(Math.round(arr[1] * 1 || 0).toString(16)),
                pad2(Math.round(arr[2] * 1 || 0).toString(16))
            ];
            _arr[0] = new THREE.Color('#' + hex.join(""));
            _arr[1] = Math.max(0, Math.min(1, (arr[3] * 1 || 0)));
        } else if ('transparent' === str) {
            _arr[0] = new THREE.Color();
            _arr[1] = 0;
        } else {
            _arr[0] = new THREE.Color(str);
            _arr[1] = 1;
        }

        function pad2(c) {
            return c.length == 1 ? '0' + c : '' + c;
        }
        return _arr;
    }
}