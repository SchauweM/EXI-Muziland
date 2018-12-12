module.exports = class Tree extends THREE.Object3D {
  constructor() {
    super();
    let loader = new THREE.GLTFLoader();
    loader.load('./assets/models/three-big/three-big.gltf', function ( threeBig ) {
      console.log(`loaded: `, threeBig); 
      // threeBig.scene.scale.x = threeBig.scene.scale.y = threeBig.scene.scale.z = 1.25; 
      return threeBig;
    }, undefined, function ( error ) {
      console.error(`Not loaded:`, error );
    });
  }
}