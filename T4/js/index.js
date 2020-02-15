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

        // 全局灯
        this.setLight();
        // 生成地球
        this.InitEarth();

        // 生成 数据点
        const dotsData = DotsDatas.filter((e, i) => i < 100);
        const dotsGroup = this.InitDots(dotsData);
        this.earthGroup.add(dotsGroup);

        // 飞机航线
        this.airFbx = null;
        this.isLoadAir = null; // 是否已经加载好飞机
        this.airSpeed = 2; // 飞行速度
        this.airWait = []; // 候机
        this.airFly = []; // 正在飞行的飞机 
        const lineGroup = this.initAirLine(airLine);
        this.earthGroup.add(lineGroup);
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

        spotLight.shadow.camera.near = 1000;
        spotLight.shadow.camera.far = 1000;
        spotLight.shadow.camera.fov = 45;

        group.add(spotLight);

        const lightClone = spotLight.clone();
        lightClone.position.x = -250;
        group.add(lightClone);

        const lightCloneT = spotLight.clone();
        lightCloneT.position.z = -250;
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
            transparent: true,
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
     * 生成飞机航线
     * @param {Array} data 航线数据
     */
    initAirLine(data) {
        const group = new THREE.Group();
        group.name = 'AirLineGroup';
        if (!Array.isArray(data)) return group;

        let material = new THREE.MeshBasicMaterial({
            color: 0xcccaaa,
            transparent: true,
            depthWrite: false,
            opacity: 0.5,
        });
        const lineGroup = new THREE.Group();
        const airGroup = new THREE.Group();
        group.add(lineGroup, airGroup);
        // 所有飞机航线
        data.forEach((elem) => {
            const {
                line,
                points
            } = this.addAirLine(elem, material);
            lineGroup.add(line);
            this.airWait.push(points); // 添加
        })

        // 加载飞机
        this.loadAirFbx((obj) => {
            this.airFbx = obj.clone();
            this.isLoadAir = true;
            this.createdFlight(airGroup); // 开始生成已经存储的所有的航班
        })

        return group;
    }

    /**
     * 把等待的所有航班开始飞行
     */
    createdFlight(group) {
        if (this.airWait.length === 0) return false;
        for (let i = this.airWait.length - 1; i >= 0; i--) {
            const air = this.airWait[i];
            const airMesh = this.addAir(air);
            group.add(airMesh);
            this.airFly.push(airMesh); // 添加正在飞行的飞机
            this.airWait.splice(i, 1);
        }
    }

    /**
     * 根据飞行路线生成航班信息
     * @param {Array} airPath 航线飞行数据
     */
    addAir(airPath) {
        const airMesh = this.airFbx.clone();
        airMesh._isAir = true;
        airMesh.userData = {
            path: airPath, // 所有路径
            index: 0, // 当前位置索引
        }
        const current = airPath[0];
        const next = airPath[1];
        const qtn = this.setAirPosture(next, current, next);
        airMesh.position.copy(airPath[0]);
        airMesh.quaternion.copy(qtn);

        return airMesh;
    }

    /**
     * 添加飞行航线
     * @param {option} opts 飞行参数 起始点 结束点
     */
    addAirLine(opts, mat) {
        const {
            src,
            dst
        } = opts;
        const {
            radius
        } = this.Config;
        // 起始点位置
        const source = this.latLongToVector3({
            lat: src.x,
            lon: src.y,
            radius: radius
        })
        // 结束点位置
        const target = this.latLongToVector3({
            lat: dst.x,
            lon: dst.y,
            radius: radius
        })
        // 生成线条
        const centerPart = source.clone().lerp(target, 0.33).setLength(radius);
        const centerPartNext = source.clone().lerp(target, 0.66).setLength(radius);
        // 生成曲线
        var curve = new THREE.CatmullRomCurve3([
            source, centerPart, centerPartNext, target
        ]);
        const height = 10; // 高度
        const dpi = 4; // shu
        const len = Math.floor(source.distanceTo(target) * dpi);
        // 设置线条高度等
        const points = curve.getPoints(len).map((elem, index) => {
            const h = Math.sin(index / len * 2 * Math.PI / 2) * height;
            elem.setLength(radius + h)
            return elem;
        });;

        // 生成线条
        const geometry = new THREE.Geometry();
        geometry.vertices.push(...points);
        const line = new THREE.Line(geometry, mat);

        return {
            line,
            points
        };
    }

    /**
     * 加载
     */
    loadAirFbx(callback) {
        var floader = new THREE.FBXLoader();
        floader.load('./model/air.fbx', function (obj) {
            // roatate air
            obj.children[0].rotation.x -= Math.PI;
            typeof callback === 'function' ? callback(obj) : false;
        })
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
        // 如果当前有飞行飞机
        if (this.airFly.length !== 0) {
            for (let i = this.airFly.length - 1; i >= 0; i--) {
                const air = this.airFly[i];
                const {
                    index,
                    path
                } = air.userData;
                if (index >= path.length - 2) {
                    air.userData.index = 0;
                    continue
                };
                const _index = Math.floor(index);
                const current = path[_index];
                const next = path[_index + 1];
                const qtn = this.setAirPosture(next, current, next);
                air.position.copy(path[_index]);
                air.quaternion.copy(qtn);
                air.userData.index += dt * this.airSpeed;
            }
        }
    }

    /**
     * 设置飞行状态的四元数  设置朝向
     * @param {Object} current 当前位置
     * @param {Object} next 下一次位置
     * @param {Object} next1 下一个位置
     */
    setAirPosture(current, next, next1) {
        var _mat = new THREE.Matrix4();
        var _qtn = new THREE.Quaternion();
        _mat.identity().lookAt(current, next, next1)
        _qtn.setFromRotationMatrix(_mat);
        return _qtn;
    }

    /**
     * 销毁
     * @param {Object} obj 对象
     */
    disposeObj(obj) {
        if (obj instanceof THREE.Object3D) {
            objectTraverse(obj, function (child) {
                //- geometry
                if (child.geometry) {
                    if (child.geometry._bufferGeometry) {
                        child.geometry._bufferGeometry.dispose();
                    }
                    child.geometry.dispose();
                    child.geometry = null;
                    //- material
                    if (Array.isArray(child.material)) {
                        child.material.forEach(function (mtl) {
                            disposeMaterial(mtl);
                        });
                    } else {
                        disposeMaterial(child.material);
                    }
                    child.material = null;
                }
                if (child.parent) child.parent.remove(child);
                child = null;
            });
        }
    }

    /**
     * 销毁材质
     * @param {object} mtl 材质
     */
    disposeMaterial(mtl) {
        if (mtl.uniforms) {
            for (var i in mtl.uniforms) {
                var uniform = mtl.__webglShader ? mtl.__webglShader.uniforms[i] : undefined;
                if (uniform && uniform.value) {
                    uniform.value.dispose && uniform.value.dispose();
                    uniform.value = null;
                }
                uniform = mtl.uniforms[i];
                if (uniform.value) {

                    uniform.value.dispose && uniform.value.dispose();
                    uniform.value = null;
                }
            }
        }
        if (mtl.map) {
            mtl.map.dispose();
            mtl.map = null;
            if (mtl.__webglShader) {
                mtl.__webglShader.uniforms.map.value.dispose();
                mtl.__webglShader.uniforms.map.value = null;
            }
        }
        mtl.dispose();
        mtl = null;
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