if (_APP) {
      const loader = new GLTFLoader();
      loader.load("../assets/low_poly_bullet/scene.gltf", (gltf) => {
        const spawnedObject = gltf.scene;
        spawnedObject.scale.set(19.2, 19.2, 19.2);
  
        // Ajuste da rotação em torno do eixo Y
        const rotationOffset = THREE.MathUtils.degToRad(100);
        spawnedObject.rotation.set(0, rotationOffset, 0);
  
        const offsetDistance = 5; // Ajuste este valor conforme necessário
        const offsetY = -2; // Ajuste este valor para mover o objeto para baixo
        const offsetX = 1; // Ajuste este valor para mover o objeto para a direita
        const offset = new THREE.Vector3(offsetX, offsetY, -offsetDistance);
        offset
          .applyQuaternion(_APP._camera.quaternion)
          .normalize()
          .multiplyScalar(offsetDistance);
  
        const spawnPosition = new THREE.Vector3()
          .copy(_APP._camera.position)
          .add(offset);
        spawnedObject.position.copy(spawnPosition);
  
        _APP._scene.add(spawnedObject);
  
        // Animation loop para mover o objeto para a frente
        const moveSpeed = 5; // Ajuste este valor conforme necessário
        const animationStartTime = performance.now();
  
        function animate() {
          const currentTime = performance.now();
          const elapsedSeconds = (currentTime - animationStartTime) / 1000;
  
          // Obtenha a direção de movimento na direção para a qual a câmera está apontando
          const movementDirection = new THREE.Vector3(0, 0, -1);
          movementDirection.applyQuaternion(_APP._camera.quaternion);
  
          // Mova o objeto para a frente
          movementDirection.multiplyScalar(moveSpeed * elapsedSeconds);
          spawnedObject.position.add(movementDirection);
  
          // Continue o loop de animação até que o objeto atinja seu destino
          if (elapsedSeconds < 5) {
            // Continue a animação por 5 segundos
            requestAnimationFrame(animate);
          } else {
            // Remova o objeto após 5 segundos
            _APP._scene.remove(spawnedObject);
          }
        }
  
        // Inicie o loop de animação
        animate();
      });
    }