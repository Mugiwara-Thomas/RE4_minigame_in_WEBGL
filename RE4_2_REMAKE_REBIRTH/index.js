import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const squares = {};


let pontos = 0;

function atualizarPontosDisplay() {
  var pontosTextElement = document.getElementById('pontos-text');
  if (pontosTextElement) {
      pontosTextElement.innerText = 'Pontos: ' + pontos;
  }
}

atualizarPontosDisplay()
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

    this.shootingAudio = new Audio("../assets/shooting.mp3");
    this.shootingAudio.volume = 0.25;

    document.addEventListener("mousedown", (e) => this._OnMouseDown(e), false);
    document.addEventListener("mouseup", (e) => this._OnMouseUp(e), false);
    document.addEventListener("mousemove", (e) => this._OnMouseMove(e), false);
    document.addEventListener("keydown", this._handleKeyDown, false);
    document.addEventListener("keyup", this._handleKeyUp, false);
  }

  _OnMouseDown(e) {
    switch (e.button) {
      case 0: {
        if (!document.pointerLockElement) {
          document.body.requestPointerLock();
          return;
        }

        this.current.leftButton = true;
        if (this.current.leftButton) {
          this.spawnObject();
          this.shootingAudio.currentTime = 0;
          this.shootingAudio.play();
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
    this.current.mouseX += e.movementX;
    this.current.mouseY += e.movementY;

    if (this.previous === null) {
      this.previous = { ...this.current };
    }

    this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
    this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;
    //this.current.mouseXDelta = e.movementX;
    //this.current.mouseYDelta = e.movementY;
  }

  spawnObject() {
    if (_APP) {
      const loader = new GLTFLoader();
      // Carregamento do modelo GLTF
      loader.load("../assets/low_poly_bullet/bala.glb", (gltf) => {
        const spawnedObject = gltf.scene;
        spawnedObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const originalMaterial = child.material;
            const newMaterial = originalMaterial.clone();

            newMaterial.emissive.setHex(0xffd700);
            newMaterial.emissiveIntensity = 0.5; // Ajuste conforme necessário

            child.material = newMaterial;
          }
        });
        spawnedObject.scale.set(20, 20, 20); // Ajuste conforme necessário

        // Rotação inicial de 45 graus (convertidos para radianos)
        const initialRotation = new THREE.Euler(0, Math.PI / 4, 0);
        spawnedObject.rotation.copy(initialRotation);

        // Use a posição atual da câmera como posição de spawn
        const spawnPosition = _APP._camera.position.clone();

        // Ajuste para obter a direção de movimento com base na rotação da câmera
        const movementDirection = new THREE.Vector3(0, 0, -1);
        movementDirection.applyQuaternion(_APP._camera.quaternion);

        // Ajuste a distância do spawn em relação à câmera
        const spawnDistance = -4;
        spawnPosition.addScaledVector(movementDirection, spawnDistance);

        spawnedObject.position.copy(spawnPosition);

        // Obtenha a direção do tiro com base na rotação da câmera
        const shotDirection = movementDirection.clone();

        // Adição do tiro
        _APP._scene.add(spawnedObject);

        function detectCollision(object, rectangles) {
          const objectBox = new THREE.Box3().setFromObject(object);
      
          for (let i = 0; i < rectangles.length; i++) {
              const rectangle = rectangles[i];
              const rectangleBox = new THREE.Box3().setFromObject(rectangle);
      
              if (objectBox.intersectsBox(rectangleBox)) {
                  console.log("Colisão detectada!");
                  pontos += 1;
                  console.log(pontos);
      
                  // Atualize a exibição dos pontos
                  atualizarPontosDisplay();
      
                  _APP._scene.remove(rectangle);
                  rectangles.splice(i, 1);
              }
          }
      }
        animate();
        function animate() {
          const moveSpeed = 10;

          spawnedObject.position.addScaledVector(shotDirection, moveSpeed);

          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.lookAt(
            spawnedObject.position,
            spawnedObject.position.clone().add(shotDirection),
            new THREE.Vector3(0, 1, 0)
          );
          spawnedObject.rotation.setFromRotationMatrix(rotationMatrix);

          detectCollision(spawnedObject, squares);
          requestAnimationFrame(animate);
        }

        setTimeout(() => {
          _APP._scene.remove(spawnedObject);
        }, 5000); // Remova o objeto após 5 segundos (ajuste conforme necessário)
      });
    }
  }

  update() {
    if (this.previous !== null) {
      this.current.mouseXDelta = this.current.mouseX - this.previous.mouseX;
      this.current.mouseYDelta = this.current.mouseY - this.previous.mouseY;

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

    this._movementSpeed = 30;
    this._altura = 15;
    this._object = object;

    this.walkingAudio = new Audio("../assets/walking.mp3");
    this.walkingAudio.volume = 1;
  }

  update(timeElapsedS) {
    this._input.update();
    this._UpdateRotation(timeElapsedS);
    this._UpdateCamera(timeElapsedS);
    this._UpdatePosition(timeElapsedS);
    this._UpdateGun(timeElapsedS);
  }

  _UpdateGun(_) {
    const offsetDistance = 3;

    const offset = new THREE.Vector3(0, -0.3, -1);
    offset
      .applyQuaternion(this._rotation)
      .normalize()
      .multiplyScalar(offsetDistance);

    this._object.position.copy(this._camera.position).add(offset);

    this._object.quaternion.copy(this._rotation);
  }

  _UpdateCamera(_) {
    this._camera.quaternion.copy(this._rotation);
  }

  _UpdatePosition(timeElapsedS) {
    const moveSpeed = this._movementSpeed * timeElapsedS;

    // Store the current position for collision detection
    const currentPosition = this._camera.position.clone();

    if (this._input.keyPressed["w"]) {
      const forward = new THREE.Vector3(0, 0, -1);
      forward
        .applyQuaternion(this._rotation)
        .normalize()
        .multiplyScalar(moveSpeed);
      this._camera.position.add(forward);
      this.walkingAudio.play();
    }

    if (this._input.keyPressed["s"]) {
      const backward = new THREE.Vector3(0, 0, 1);
      backward
        .applyQuaternion(this._rotation)
        .normalize()
        .multiplyScalar(moveSpeed);
      this._camera.position.add(backward);
      this.walkingAudio.play();
    }

    if (this._input.keyPressed["a"]) {
      const left = new THREE.Vector3(-1, 0, 0);
      left
        .applyQuaternion(this._rotation)
        .normalize()
        .multiplyScalar(moveSpeed);
      this._camera.position.add(left);
      this.walkingAudio.play();
    }

    if (this._input.keyPressed["d"]) {
      const right = new THREE.Vector3(1, 0, 0);
      right
        .applyQuaternion(this._rotation)
        .normalize()
        .multiplyScalar(moveSpeed);
      this._camera.position.add(right);
      this.walkingAudio.play();
    }

    // Check for collisions with the scene boundaries
    this._checkSceneCollision(currentPosition);

    this._camera.position.y = Math.max(this._camera.position.y, this._altura);
    this._camera.position.y = Math.min(this._camera.position.y, this._altura);

    this._object.position.y = Math.max(
      this._camera.position.y,
      this._altura - 1
    );
    this._object.position.y = Math.min(
      this._camera.position.y,
      this._altura - 1
    );
  }

  _checkSceneCollision(currentPosition) {
    // Define your scene boundaries
    const minX = 25;
    const maxX = 135;
    const minZ = -20;
    const maxZ = 20;

    // Check if the new position is outside the boundaries
    if (
      this._camera.position.x < minX ||
      this._camera.position.x > maxX ||
      this._camera.position.z < minZ ||
      this._camera.position.z > maxZ
    ) {
      // If outside boundaries, revert to the previous position
      this._camera.position.copy(currentPosition);
    }
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
    this._theta = this.clamp(this._theta + -yh * 5, -Math.PI / 3, Math.PI / 3);

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

    this._uiCamera = new THREE.OrthographicCamera(
      -1,
      1,
      1 * aspect,
      -1 * aspect,
      1,
      1000
    );
    this._uiScene = new THREE.Scene();

    this._addLights();

    let loader = new GLTFLoader();
    this._cenario;

    loader.load("../assets/cenario/cenario.glb", (gltf) => {
      this._cenario = gltf.scene;
      this._cenario.scale.set(10, 10, 10);
       this._cenario.position.y += 1;
       this._cenario.position.x = this._camera.position.x;
       this._cenario.position.z = this._camera.position.z - 80;
       this._scene.add(this._cenario);
    });

    this._object;
    // Função para criar um quadrado

    const squarePosition = new THREE.Vector3(0, 5, 10);
    const squareInfo = {
      movable: true,
      movementLimits: {
        left: -50,
        right: 50
      },
      axis: 'x'
    };
    
    const newSquare = this._createTarget(squarePosition, "../assets/target/scene.gltf", squareInfo);
    
    const squarePosition2 = new THREE.Vector3(30, 5, 30);
    const squareInfo2 = {
      movable: true,
      movementLimits: {
        left: -1,
        right: -1
      },
      axis: 'x'
    };
    
    const newSquare2 = this._createTarget(squarePosition2, "../assets/target/scene.gltf", squareInfo2);
    
    const squarePosition3 = new THREE.Vector3(60, 5, 40);
    const squareInfo3 = {
      movable: true,
      movementLimits: {
        left: -100,
        right: 100
      },
      axis: 'z'
    };
    
    const newSquare3 = this._createTarget(squarePosition3, "../assets/target/scene.gltf", squareInfo3);
    
    
    loader.load("../assets/fps-shotgun-gltf/scene.gltf", (gltf) => {
      this._object = gltf.scene;
      this._object.scale.set(3, 3, 3);
      this._scene.add(this._object);

      this._addCrosshair();

      this.controls = new FirstPersonCamera(this._camera, this._object);

      this._addGrid();
      
      this._RAF();
    });
  }
  _createTarget(position, modelPath, info) {
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;
      model.position.copy(position);
      model.scale.set(0.05, 0.05, 0.05);
      this._scene.add(model);
  
      const movable = info.movable !== undefined ? info.movable : false;
      const movementLimits = info.movementLimits || { left: -Infinity, right: Infinity };
      const axis = info.axis || 'x'; // Defina 'x' como padrão se nenhum eixo for fornecido
  
      squares[model.uuid] = {
        model,
        info: { ...info, movable, movementLimits, axis } // Armazene a informação do eixo
      };
    });
  }
  

  _moveTargets() {
    Object.keys(squares).forEach((key) => {
      const square = squares[key].model;
      const info = squares[key].info;
      const moveSpeed = info.movable ? 2 : 0;
      const axis = info.axis || 'x'; // Obtenha o eixo do alvo ou use 'x' como padrão
  
      if (moveSpeed > 0) {
        const { left, right } = info.movementLimits;
        
        // Atualize a posição apenas no eixo especificado
        if (axis === 'x') {
          square.position.x -= moveSpeed;
          if (square.position.x < left) {
            square.position.x = right;
          } else if (square.position.x > right) {
            square.position.x = left;
          }
        } else if (axis === 'y') {
          square.position.y -= moveSpeed;
          if (square.position.y < left) {
            square.position.y = right;
          } else if (square.position.y > right) {
            square.position.y = left;
          }
        } else if (axis === 'z') {
          square.position.z -= moveSpeed;
          if (square.position.z < left) {
            square.position.z = right;
          } else if (square.position.z > right) {
            square.position.z = left;
          }
        }
      }
    });
  }
  


  _addCrosshair() {
    const loader = new THREE.TextureLoader();
    const crosshair = loader.load("../assets/mira.png");
    this._crosshairSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: crosshair,
        color: 0xffffff,
        fog: false,
        depthTest: false,
        depthWrite: false,
      })
    );
    this._crosshairSprite.scale.set(0.06, 0.1 * this._camera.aspect, 1);
    this._crosshairSprite.position.set(0, 0, -10);
    this._uiScene.add(this._crosshairSprite);
  }

  _addGrid() {
    const grid = new THREE.GridHelper(10000, 1000);
    grid.receiveShadow = true;
    this._scene.add(grid);

    // const axesHelper = new THREE.AxesHelper(15);
    // this._scene.add(axesHelper);
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

    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    light.intensity = 75;
    this._scene.add(light);
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();

    this._uiCamera_.left = -this._camera.aspect;
    this._uiCamera_.right = this._camera.aspect;
    this._uiCamera_.updateProjectionMatrix();

    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._Step(t - this._previousRAF);
      this._threejs.autoClear = true;
      this._threejs.render(this._scene, this._camera);
      this._threejs.autoClear = false;
      this._threejs.render(this._uiScene, this._uiCamera);
      this._previousRAF = t;
      this._RAF();
    });
    this._moveTargets();

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
