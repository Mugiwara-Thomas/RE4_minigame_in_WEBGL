import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class InputController {
    constructor() {
        this._Initialize();
        this.keyPressed = {};
    }

    _handleKeyDown = (e) => {
        if (!this.keyPressed[e.key.toLowerCase()]) {
            this.keyPressed[e.key.toLowerCase()] = new Date().getTime();
            console.log(`Tecla pressionada: ${e.key.toLowerCase()}`);
        }
    };

    _handleKeyUp = (e) => {
        delete this.keyPressed[e.key.toLowerCase()];
        console.log(`Tecla liberada: ${e.key.toLowerCase()}`);
    };

    _Initialize() {
        this.current = {
            leftButton: false,
            rightButton: false,
            mouseX: 0,
            mouseY: 0,
            mouseXDelta: 0,
            mouseYDelta: 0,
        };
        this.previous = null;
        this.previousKeys = {};

        document.addEventListener(
            "mousedown",
            (e) => this._OnMouseDown(e),
            false
        );
        document.addEventListener("mouseup", (e) => this._OnMouseUp(e), false);
        document.addEventListener(
            "mousemove",
            (e) => this._OnMouseMove(e),
            false
        );
        document.addEventListener("keydown", this._handleKeyDown, false);
        document.addEventListener("keyup", this._handleKeyUp, false);
    }

    _OnMouseDown(e) {
        switch (e.button) {
            case 0: {
                this.current.leftButton = true;
                if (this.current.leftButton) {
                    this.spawnObject();
                }
                break;
            }
            case 1: {
                this.current.rightButton = true;
                break;
            }
        }
    }

    _OnMouseUp(e) {
        switch (e.button) {
            case 0: {
                this.current.leftButton = false;
                break;
            }
            case 1: {
                this.current.rightButton = false;
                break;
            }
        }
    }

    _OnMouseMove(e) {
        this.current.mouseX = e.pageX - window.innerWidth / 2;
        this.current.mouseY = e.pageY - window.innerHeight / 2;

        if (this.previous === null) {
            this.previous = { ...this.current };
        }

        this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
        this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
    }

    spawnObject() {
        if (_APP) {
            const loader = new GLTFLoader();
            loader.load('../assets/9mm_bullet/scene.gltf', (gltf) => {
                const spawnedObject = gltf.scene;
                spawnedObject.scale.set(0.2, 0.2, 0.2);
                // Set the position of the spawned object in front of the weapon and a little to the right
                const offsetDistance = 5; // Adjust this value as needed
                const offsetY = -2; // Adjust this value to move the object more down
                const offsetX = 1; // Adjust this value to move the object more to the right
                const offset = new THREE.Vector3(offsetX, offsetY, -offsetDistance);
                offset.applyQuaternion(_APP._camera.quaternion).normalize().multiplyScalar(offsetDistance);
           
                const spawnPosition = new THREE.Vector3().copy(_APP._camera.position).add(offset);
                spawnedObject.position.copy(spawnPosition);
    
                // Set the rotation of the spawned object to match the camera's rotation
                spawnedObject.rotation.copy(_APP._camera.rotation);
    
                _APP._scene.add(spawnedObject);
    
                // Animation loop for moving the object forward
                const moveSpeed = 10; // Adjust this value as needed
                const animationStartTime = performance.now();
    
                function animate() {
                    const currentTime = performance.now();
                    const elapsedSeconds = (currentTime - animationStartTime) / 1000;
    
                    // Move the object forward
                    const forward = new THREE.Vector3(0, 0, -1);
                    forward.applyQuaternion(spawnedObject.quaternion).normalize().multiplyScalar(moveSpeed * elapsedSeconds);
                    spawnedObject.position.add(forward);
    
                    // Continue the animation loop until the object reaches its destination
                    if (elapsedSeconds < 5) { // Continue animation for 5 seconds
                        requestAnimationFrame(animate);
                    } else {
                        // Remove the object after 5 seconds
                        _APP._scene.remove(spawnedObject);
                    }
                }
    
                // Start the animation loop
                animate();
            });
        }
    }
    
    

    update() {
        if (this.previous !== null) {
            this.current.mouseXDelta =
                this.current.mouseX - this.previous.mouseX;
            this.current.mouseYDelta =
                this.current.mouseY - this.previous.mouseY;

            this.previous = { ...this.current };
            this.previousKeys = { ...this.keys };
        }
    }
}

class FirstPersonCamera {
    constructor(camera, object) {
        this._camera = camera;
        this._input = new InputController();
        this._rotation = new THREE.Quaternion();
        this._translation = new THREE.Vector3();
        this._phi = 0;
        this._theta = 0;

        this._movementSpeed = 20;
        this._altura = 5;
        this._object = object;
    }

    update(timeElapsedS) {
        this._input.update();
        this._UpdateRotation(timeElapsedS);
        this._UpdateCamera(timeElapsedS);
        this._UpdatePosition(timeElapsedS)
        this._UpdateGun(timeElapsedS)
    }

    _UpdateGun(_) {
        const offsetDistance = 3; 

        const offset = new THREE.Vector3(0, -0.3, -1); 
        offset.applyQuaternion(this._rotation).normalize().multiplyScalar(offsetDistance);

        this._object.position.copy(this._camera.position).add(offset);

        this._object.quaternion.copy(this._rotation);
    }

    _UpdateCamera(_) {
        this._camera.quaternion.copy(this._rotation);
    }

    _UpdatePosition(timeElapsedS) {
        const moveSpeed = this._movementSpeed * timeElapsedS;

        if (this._input.keyPressed["w"]) {
            console.log('Moving forward');
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this._rotation).normalize().multiplyScalar(moveSpeed);
            this._camera.position.add(forward);
        }

        if (this._input.keyPressed["s"]) {
            console.log('Moving Back');
            const forward = new THREE.Vector3(0, 0, 1);
            forward.applyQuaternion(this._rotation).normalize().multiplyScalar(moveSpeed);
            this._camera.position.add(forward);
        }

        if (this._input.keyPressed["a"]) {
            console.log('Moving Left');
            const forward = new THREE.Vector3(-1, 0, 0);
            forward.applyQuaternion(this._rotation).normalize().multiplyScalar(moveSpeed);
            this._camera.position.add(forward);
        }
        if (this._input.keyPressed["d"]) {
            console.log('Moving Left');
            const forward = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(this._rotation).normalize().multiplyScalar(moveSpeed);
            this._camera.position.add(forward);
        }

        this._camera.position.y = Math.max(this._camera.position.y, this._altura);
        this._camera.position.y = Math.min(this._camera.position.y, this._altura);

        this._object.position.y = Math.max(this._camera.position.y, this._altura - 1);
        this._object.position.y = Math.min(this._camera.position.y, this._altura - 1);
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    _UpdateRotation(_) {

        const rotationSpeed = 0.01; // Ajuste a velocidade de rotação conforme necessário

        if (this._input.keyPressed["arrowleft"]) {
          this._phi += rotationSpeed;
        }
      
        if (this._input.keyPressed["arrowright"]) {
          this._phi -= rotationSpeed;
        }
      

        const xh = this._input.current.mouseXDelta / window.innerWidth;
        const yh = this._input.current.mouseYDelta / window.innerHeight;

        this._phi += -xh * 5;
        this._theta = this.clamp(
            this._theta + -yh * 5,
            -Math.PI / 3,
            Math.PI / 3
        );

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this._phi);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this._theta);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this._rotation.copy(q);
    }
}

class World {
    constructor() {
        this._Initialize();
    }
    _Initialize() {
        this._threejs = new THREE.WebGLRenderer();
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );

        const fov = 60;
        const aspect = 1280 / 720;
        const near = 1.0;
        const far = 1000.0;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(75, 20, 0);

        this._scene = new THREE.Scene();

        this._addLights();

        let loader = new GLTFLoader();
        this._object;

        loader.load('../assets/fps-shotgun-gltf/scene.gltf', (gltf) => {
            this._object = gltf.scene;
            this._object.scale.set(3, 3, 3);
            this._scene.add(this._object);

            // Initialize controls after loading the object
            this.controls = new FirstPersonCamera(this._camera, this._object);

            // Call the update method here or wherever appropriate
            // this.controls.update(0);

            this._addGrid();

            this._RAF();
        });
    }

    _addGrid() {
        const grid = new THREE.GridHelper(10000, 1000)
        grid.receiveShadow = true;
        this._scene.add(grid);

        const axesHelper = new THREE.AxesHelper(15);
        this._scene.add(axesHelper);
    }
    _addBackground() {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            "../assets/posx.jpg",
            "../assets/negx.jpg",
            "../assets/posy.jpg",
            "../assets/negy.jpg",
            "../assets/posz.jpg",
            "../assets/negz.jpg",
        ]);
        this._scene.background = texture;
    }

    _addLights() {
        let light = new THREE.DirectionalLight("#fff", 1.0);
        light.position.set(20, 100, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this._scene.add(light);

        light = new THREE.AmbientLight(0x101010);
        this._scene.add(light);
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this._Step(t - this._previousRAF);
            this._threejs.render(this._scene, this._camera);
            this._previousRAF = t;
            this._RAF();
        });
    }

    _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;

        this.controls.update(timeElapsedS);
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new World();
});