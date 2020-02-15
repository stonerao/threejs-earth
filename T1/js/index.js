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
            rotate: 0.02 // 地球旋转速度  正 逆时针 负 顺时针
        }

        this.earthGroup = new THREE.Group(); // 用于添加地球相关
        this.scene.add(this.earthGroup);

        this.InitEarth();
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

        spotLight.shadow.mapSize.width = 512;
        spotLight.shadow.mapSize.height = 512;

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

    animation = (dt) => {
        if (this.earthGroup) {
            const { rotate } = this.Config;
            this.earthGroup.rotation.y += dt * rotate;
        }
    }
}