// three_base.js
var scene;
var camera;
var renderer;
var control;
var stats;
function three_init() {
  console.log("three_init");
  document.body.style.margin = 0;
  document.body.style.overflow = "hidden";
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdddddd);
  camera_init();
  render_init();
  spotLight_init();
  //control = {
  //  rotationSpeed: 0.005,
  //  opacity: 0.9,
  //  color: 0x33ff55};
  //add_control(control);
  //add_stats();
  //add_plane();
  //add_cube();
  add_lines();
  render();
}
function camera_init() {
  //camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera = new THREE.PerspectiveCamera(
    25,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.x = 2;
  camera.position.y = 1; //2;
  camera.position.z = 3; //3;
  camera.lookAt(scene.position);
  window.addEventListener("resize", camera_resize, false);
  //
}
function camera_resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function render_init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMapEnabled = true;
  document.body.appendChild(renderer.domElement);
}
function render() {
  var rotSpeed = 0.0; //control.rotationSpeed;
  camera.position.x =
    camera.position.x * Math.cos(rotSpeed) +
    camera.position.z * Math.sin(rotSpeed);
  camera.position.z =
    camera.position.z * Math.cos(rotSpeed) -
    camera.position.x * Math.sin(rotSpeed);
  camera.lookAt(scene.position);
  //robot_run(mesh_render);
  //xrobot_run('base_link', new THREE.Matrix4().makeTranslation(0, 0, 0));
  xrobot_run2();
  //test1();

  //xrobot_run2('base_link', new THREE.Matrix4().makeTranslation(0, 0, 0));
  //
  //mesh_render('evt_head.stl', [0,0,0], [0,0,0]);

  //mesh_render(mesh_name, [0,0,0], [0,0,0]);

  //stats.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
function spotLight_init() {
  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(10, 20, 20);
  spotLight.shadowCameraNear = 20;
  spotLight.shadowCameraFar = 50;
  spotLight.castShadow = true;
  scene.add(spotLight);
  // spotLight2
  spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(10, 20, -20);
  spotLight.shadowCameraNear = 20;
  spotLight.shadowCameraFar = 50;
  spotLight.castShadow = true;
  scene.add(spotLight);
  //
}
function add_control(controlObject) {
  var gui = new dat.GUI();
  gui.add(controlObject, "rotationSpeed", -0.01, 0.01);
  gui.add(controlObject, "opacity", 0.1, 1);
  gui.addColor(controlObject, "color");
}
function add_stats() {
  stats = new Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);
}
function add_line() {
  var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  var geometry = new THREE.Geometry();
  var ss = 6;
  geometry.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ss, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, ss, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, ss),
    new THREE.Vector3(0, 0, 0)
  );
  var line = new THREE.Line(geometry, material);
  scene.add(line);
}
function add_lines() {
  var ss = 5;
  var material1 = new THREE.LineBasicMaterial({ color: 0xff0000 });
  var geometry1 = new THREE.Geometry();
  var material2 = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  var geometry2 = new THREE.Geometry();
  var material3 = new THREE.LineBasicMaterial({ color: 0x0000ff });
  var geometry3 = new THREE.Geometry();
  geometry1.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ss, 0, 0)
  );
  geometry2.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, ss, 0)
  );
  geometry3.vertices.push(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, ss)
  );
  scene.add(new THREE.Line(geometry1, material1));
  scene.add(new THREE.Line(geometry2, material2));
  scene.add(new THREE.Line(geometry3, material3));
}
function add_plane() {
  var size = 20;
  var planeGeometry = new THREE.PlaneGeometry(size, size);
  var planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: 0.9,
  });
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.rotation.x = -0.5 * Math.PI;
  plane.position.x = 0;
  plane.position.y = -2 - 2;
  plane.position.z = 0;
  plane.shading = THREE.SmoothShading;
  scene.add(plane);
  /*
  var radius = 5;
  var segments = 64;
  var circleGeometry = new THREE.CircleGeometry(radius, segments);
  var circle = new THREE.Mesh(circleGeometry, new THREE.MeshLambertMaterial({color: 0xffff00}));
  circle.receiveShadow = true;
  circle.rotation.x = -0.5 * Math.PI;
  circle.position.x = 0;
  circle.position.y = -2;
  circle.position.z = 0;
  scene.add(circle);
  */
}
function add_cube() {
  var cubeGeometry = new THREE.BoxGeometry(6, 6, 6); // width height depth
  var cubeMaterial = new THREE.MeshLambertMaterial({
    color: "red",
    transparent: true,
    opacity: 0.1,
  });
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  //cube.castShadow = true;
  cube.name = "cube";
  //cube.position.x = 0;
  //cube.position.y = 0;
  //cube.position.z = 0;
  //console.log('cubeGeometry', cubeGeometry);
  cube.shading = THREE.SmoothShading;
  scene.add(cube);
  //add_vertex(cube);
}
function add_vertex(mesh) {
  var vertices = mesh.geometry.vertices;
  var vertexMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
  vertices.forEach(function (vertex) {
    var vertexSphere = new THREE.SphereGeometry(0.15);
    var vertexMesh = new THREE.Mesh(vertexSphere, vertexMaterial);
    vertexMesh.position = vertex;
    scene.add(vertexMesh);
  });
}
var mesh_name = null;
function load_mesh(name, xyz, rpy) {
  console.log("load_mesh(" + name + ")");
  mesh_name = name;
  var loader = new THREE.STLLoader();
  loader.load(name, function (geometry) {
    add_mesh(name, geometry, xyz, rpy);
  });
}
//
function mesh_load(name, mesh_path) {
  //console.log('mesh_load(' + name + ') ' + mesh_path);
  var loader = new THREE.STLLoader();
  loader.load(mesh_path, function (geometry) {
    add_mesh(name, geometry);
  });
}
function mesh_load_stl(name, mesh_path, scale, zyx) {
  //console.log('mesh_load_stl(' + name + ') ' + mesh_path);
  var loader = new THREE.STLLoader();
  loader.zyxSystem(zyx);
  loader.scale(scale);
  loader.load(mesh_path, function (object) {
    add_mesh(name, mesh_path, object);
  });
}
//
function add_mesh(name, mesh_path, object) {
  //var material = new THREE.MeshPhongMaterial({color: 0x33ff55, specular: 0x111111, shininess: 200, transparent:true, opacity:0.9});
  var material = new THREE.MeshPhongMaterial({
    color: 0x33ff55,
    specular: 0x111111,
    shininess: 200,
    transparent: true,
    opacity: 0.6,
  });
  if (mesh_path.indexOf("_led") > 0) {
    //console.log('mesh_path=' + mesh_path);
    material = new THREE.MeshPhongMaterial({
      color: 0x0000ff,
      specular: 0x111111,
      shininess: 200,
      transparent: false,
      opacity: 0.9,
    });
  }
  // 2018.04.29
  var color = xrobot.link[name].mesh_color ? 0x444444 : 0xeeeeee;
  if (mesh_path.indexOf("_led") > 0) color = 0x0000ff;
  material = new THREE.MeshPhongMaterial({
    color: color,
    specular: 0x111111,
    shininess: 200,
    transparent: false,
    opacity: 0.9,
  });
  //
  //object.computeBoundingBox();
  //object.computeVertexNormals();
  //object.center();
  ///////////////////////////////////////////////////////////////

  var attrib = object.getAttribute("position");
  if (attrib === undefined) {
    throw new Error(
      "a given BufferGeometry object must have a position attribute."
    );
  }
  var positions = attrib.array;
  var vertices = [];
  for (var i = 0, n = positions.length; i < n; i += 3) {
    var x = positions[i];
    var y = positions[i + 1];
    var z = positions[i + 2];
    vertices.push(new THREE.Vector3(x, y, z));
  }
  var faces = [];
  for (var i = 0, n = vertices.length; i < n; i += 3) {
    faces.push(new THREE.Face3(i, i + 1, i + 2));
  }

  var geometry = new THREE.Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  geometry.computeFaceNormals();
  geometry.mergeVertices();
  geometry.computeVertexNormals();

  ///////////////////////////////////////////////////////////////
  var item = new THREE.Mesh(geometry, material);
  item.castShadow = true;
  item.name = name;
  scene.add(item);
  //console.log('add_mesh(' + name + ')');
  xrobot.link[name].mesh_obj = item;
}
//
function add_face() {
  var x = 0.128 * 1.2; //* 0.65;
  var y = 0.072 * 1.2; //* 0.65;
  var planeGeometry = new THREE.PlaneGeometry(y, x);
  var planeMaterial = new THREE.MeshLambertMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.9,
  });
  //var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  var plane = new THREE.Mesh(planeGeometry, videomaterial);
  //
  scene.add(plane);
  //
  var rot = 0.5 * Math.PI;
  plane.rotation.x = 0;
  plane.rotation.y = 0;
  plane.rotation.z = 0;
  plane.position.x = 0;
  plane.position.y = 0;
  plane.position.z = 0;
  //
  var face_obj = {
    mesh_obj: plane,
  };
  xrobot.link["face"] = face_obj;
  //
}
//
function x_mesh_render(name, xyz, rpy) {
  var item = scene.getObjectByName(name);
  if (item == null) return;
  mesh_render_check(name, item);
  var mul = 10;
  var scale = mul * 0.02;
  item.scale.set(scale, scale, scale);
  item.rotation.x = rpy[0];
  item.rotation.y = rpy[1];
  item.rotation.z = rpy[2];
  var rotatex = 1;
  if (rotatex == 0) {
    item.position.x = xyz[0] * mul;
    item.position.y = xyz[1] * mul;
    item.position.z = xyz[2] * mul;
  } else {
    item.rotation.x += -0.5 * Math.PI;
    item.position.x = xyz[0] * mul;
    item.position.y = xyz[2] * mul;
    item.position.z = -xyz[1] * mul;
  }
  //item.position.y -= 4;
  console.log("mesh_render: " + name);
  //
}
//
var render_count = 0;
var face_count = 0;
var face_dir = 1;
function mesh_render_check(name, item) {
  // reverse led color
  if (item && name.indexOf("_led") < 0) {
    //item.material.opacity = control.opacity;
    //item.material.color = new THREE.Color(control.color);
  } else {
    //if(item)item.material.color = new THREE.Color(control.color ^ 0xFFFFFF); // 2018.04.24 color undefined
  }
  /* rotate head
  if(item)if((name == 'evt_head.stl') || (name == 'evt_led_head.stl')){
    item.rotation.z = face_count * Math.PI / 400; //-0.25 * Math.PI;
    render_count++;
    face_count += face_dir;
    if(face_count >= 100){
      face_dir = -1;
    }
    if(face_count <= -100){
      face_dir = 1;
    }
  }
  */
  /* cube
  var cube = scene.getObjectByName('cube');
  if(cube){
    cube.material.opacity = control.opacity;
    cube.material.color = new THREE.Color(control.color);
  }
  */
  // test
  {
  }
  //
}
//
function test1() {
  var m = new THREE.Matrix4().makeTranslation(3, 0, 0);
  var mx = new THREE.Matrix4().makeRotationZ(3.14 / 4);
  var mm = m.multiply(mx);

  var m2 = new THREE.Matrix4().makeTranslation(3, 0, 0);
  draw_matrix(m);
  draw_matrix(mm);
  mm = mm.multiply(m2);

  draw_matrix(mm);
  mm = mm.multiply(new THREE.Matrix4().makeRotationX(3.14 / 4));
  draw_matrix(mm);

  mm = mm.multiply(new THREE.Matrix4().makeTranslation(1, 0, 0));
  draw_matrix(mm);
}
function toString(matrix) {
  var str = "matrix=";
  for (var i = 0; i < 16; i++) {
    str += matrix.elements[i] + ",";
  }
  return str;
}
function v2String(vector) {
  return "vector(" + vector.x + "," + vector.y + "," + vector.z + ")";
}
function draw_matrix(matrix) {
  var position = new THREE.Vector3(
    matrix.elements[12],
    matrix.elements[13],
    matrix.elements[14]
  );
  var scale = 1;
  var v1 = matrix4vector(matrix.clone(), new THREE.Vector3(scale, 0, 0));
  //console.log( "matrix1="+toString(matrix ));
  var v2 = matrix4vector(matrix.clone(), new THREE.Vector3(0, scale, 0));
  //console.log( "matrix2="+toString(matrix ));
  var v3 = matrix4vector(matrix.clone(), new THREE.Vector3(0, 0, scale));
  //console.log( "position="+v2String(position ));
  //console.log( "v1="+v2String(v1 ));
  //console.log( "v2="+v2String(v2 ));
  //console.log( "v3="+v2String(v3 ));
  var material1 = new THREE.LineBasicMaterial({ color: 0xff0000 });
  var geometry1 = new THREE.Geometry();
  var material2 = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  var geometry2 = new THREE.Geometry();
  var material3 = new THREE.LineBasicMaterial({ color: 0x0000ff });
  var geometry3 = new THREE.Geometry();
  geometry1.vertices.push(
    new THREE.Vector3(position.x, position.y, position.z),
    new THREE.Vector3(position.x + v1.x, position.y + v1.y, position.z + v1.z)
  );
  geometry2.vertices.push(
    new THREE.Vector3(position.x, position.y, position.z),
    new THREE.Vector3(position.x + v2.x, position.y + v2.y, position.z + v2.z)
  );
  geometry3.vertices.push(
    new THREE.Vector3(position.x, position.y, position.z),
    new THREE.Vector3(position.x + v3.x, position.y + v3.y, position.z + v3.z)
  );
  scene.add(new THREE.Line(geometry1, material1));
  scene.add(new THREE.Line(geometry2, material2));
  scene.add(new THREE.Line(geometry3, material3));
}

function matrix4vector(matrix4, vector3) {
  //matrix4.setPosition(0,0,0);
  matrix4.elements[12] = 0;
  matrix4.elements[13] = 0;
  matrix4.elements[14] = 0;

  var m = new THREE.Matrix4().makeTranslation(vector3.x, vector3.y, vector3.z);
  m = matrix4.multiply(m);
  //console.log( "matrix1="+toString(m ));
  return new THREE.Vector3(m.elements[12], m.elements[13], m.elements[14]);
}
