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