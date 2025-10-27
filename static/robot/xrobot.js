// xrobot.js
var xrobot_nuwa = "/NUWA";
var xrobot = null;
var xhardware = null;
function xhardware_load(url) {
  //console.log('xhardware_load');
  var http = new XMLHttpRequest();
  http.onreadystatechange = function () {
    if (http.readyState == 4 && http.status == 200) {
      xhardware_paser(
        new DOMParser().parseFromString(http.responseText, "text/xml")
          .documentElement.firstElementChild
      );
    }
  };
  http.open("GET", url);
  http.send(null);
}
function xhardware_paser(next) {
  //console.log('xhardware_paser');
  xhardware = {
    motor: {},
  };
  while (next) {
    switch (next.tagName) {
      case "motor":
        var motor = new Motor();
        motor.name = next.getAttribute("name");
        motor.rotateDirection = parseFloat(
          next.getAttribute("rotateDirection")
        );
        var s = next.getAttribute("mayaDirection");
        if (s != null) {
          //console.log('m.name' + motor.name + ',s='+s);
          motor.mayaDirection = parseFloat(next.getAttribute("mayaDirection"));
        }
        xhardware.motor[motor.name] = motor;
        //name
        //console.log('m.name' + motor.name + '>');
        break;
      default:
        console.log("unknown tag<" + next.tagName + ">");
        break;
    }
    next = next.nextElementSibling;
  }
  console.log("xhardware", xhardware);
}
function xrobot_init() {
  //motion_load(xrobot_nuwa + '/assets/motion/987_J2_GoDance.xml');
  console.log("====");
  // xhardware_load(xrobot_nuwa + '/system/mibo/hardware.xml');
  // xrobot_load(xrobot_nuwa + '/system/mibo/robot.xml');
  xhardware_load("./hardware.xml");
  xrobot_load("./robot.xml");
}
function xrobot_load(url) {
  var http = new XMLHttpRequest();
  http.onreadystatechange = function () {
    if (http.readyState == 4 && http.status == 200)
      xrobot_onload(
        new DOMParser().parseFromString(http.responseText, "text/xml")
          .documentElement.firstElementChild
      );
  };
  http.open("GET", url);
  http.send(null);
}
function xrobot_onload(next) {
  xrobot = {
    link: {},
    joint: {},
  };
  while (next) {
    switch (next.tagName) {
      case "joint":
        joint_add(next.getAttribute("name"), next.firstElementChild);
        break;
      case "link":
        link_add(next.getAttribute("name"), next.firstElementChild);
        break;
      default:
        console.log("unknown tag<" + next.tagName + ">");
        break;
    }
    next = next.nextElementSibling;
  }
  Object.keys(xrobot.joint).map(function (name, index) {
    var joint = xrobot.joint[name];
    if (joint.parent && joint.child) {
      xrobot.link[joint.parent].links.push(joint.child);
      xrobot.link[joint.child].parent = joint.parent;
    }
  });
  Object.keys(xrobot.joint).map(function (name, index) {
    var joint = xrobot.joint[name];
    if (joint.parent) {
      xrobot.link[joint.parent].childJoints.push(joint);
    }
  });
  Object.keys(xrobot.link).map(function (name, index) {
    var link = xrobot.link[name];
    if (link.mesh) {
      if (link.mesh.endsWith(".stlx"))
        mesh_load_stl(name, link.mesh, 0.1, true);
      if (link.mesh.endsWith(".stl"))
        mesh_load_stl(name, link.mesh, 0.01, false);
    }
  });
  add_face();
}
function input_rotate(name) {
  if (xrobot && xrobot.joint && xrobot.joint[name]) {
    var joint = xrobot.joint[name];
    joint.rotate[0] += joint.xyz_axis[0] * 0.1;
    joint.rotate[1] += joint.xyz_axis[1] * 0.1;
    joint.rotate[2] += joint.xyz_axis[2] * 0.1;
  }
}
function input_rotate2(name, val) {
  if (xrobot && xrobot.joint && xrobot.joint[name]) {
    var joint = xrobot.joint[name];
    joint.rotate[0] = joint.xyz_axis[0] * 0.2 * val;
    joint.rotate[1] = joint.xyz_axis[1] * 0.2 * val;
    joint.rotate[2] = joint.xyz_axis[2] * 0.2 * val;
  }
}
var rot_init = -Math.PI / 4;
var rot_speed = 0; //-0.01;
var rot_curr = 0;
var scale = 2;
var mscale = 0;
var platform_theta = 0;
var playform_x = 0;
var playform_y = 0;
var wx =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;
var wy =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight;
console.log("window=" + wx + "x" + wy);
function xrobot_run2() {
  texture_update();
  var matrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  if (wx > wy)
    matrix = matrix.multiply(
      new THREE.Matrix4().makeTranslation(0.5, -0.75, 0)
    ); //move
  if (scale > 0) {
    mscale = new THREE.Matrix4().makeScale(scale, scale, scale);
    matrix = matrix.multiply(mscale);
  }
  if (rot_init != 0) {
    var rotationZ = new THREE.Matrix4().makeRotationZ(rot_init);
    matrix = matrix.multiply(rotationZ);
  }
  if (rot_speed != 0) {
    var rotationZ = new THREE.Matrix4().makeRotationZ(rot_curr);
    rot_curr += rot_speed;
    matrix = matrix.multiply(rotationZ);
  }
  // platform_theta
  matrix.multiply(new THREE.Matrix4().makeRotationZ(platform_theta));
  // playform_x + playform_y ???
  if (0) {
    var pscale = 1;
    var translation = new THREE.Matrix4().makeTranslation(
      playform_x * pscale,
      playform_y * pscale,
      0
    );
    matrix = matrix.multiply(translation);
  }
  //
  if (xrobot && xrobot.link) {
    xrobot_run_link(xrobot.link["base_link"], matrix);
  }
  //
  motion_poll();
}
function xrobot_run_link(link, matrix) {
  if (link) {
    if (link.mesh_obj) {
      link.mesh_obj.matrixAutoUpdate = false;
      if (link.xyz) {
        // 2018.04.30
        var translation = new THREE.Matrix4().makeTranslation(
          link.xyz[0],
          link.xyz[1],
          link.xyz[2]
        );
        matrix = matrix.multiply(translation);
      }
      link.mesh_obj.matrix = matrix;
    }
    if (link.childJoints)
      for (var i = 0; i < link.childJoints.length; i++)
        xrobot_run_joint(link.childJoints[i], matrix.clone());
  }
}
function xrobot_run_joint(joint, matrix) {
  if (joint) {
    var scale = 1;
    var translation = new THREE.Matrix4().makeTranslation(
      joint.xyz[0] * scale,
      joint.xyz[1] * scale,
      joint.xyz[2] * scale
    );
    matrix = matrix.multiply(translation);
    var rotationX = new THREE.Matrix4().makeRotationX(
      joint.rpy[0] + joint.rotate[0]
    );
    matrix = matrix.multiply(rotationX);
    var rotationY = new THREE.Matrix4().makeRotationY(
      joint.rpy[1] + joint.rotate[1]
    );
    matrix = matrix.multiply(rotationY);
    var rotationZ = new THREE.Matrix4().makeRotationZ(
      joint.rpy[2] + joint.rotate[2]
    );
    matrix = matrix.multiply(rotationZ);
    if (joint.child) {
      xrobot_run_link(xrobot.link[joint.child], matrix);
    }
    if (joint.name == "face_end" && xrobot.link.face) {
      // add_face
      var link = xrobot.link.face;
      var rot = new THREE.Matrix4().makeRotationY(Math.PI / 2);
      link.mesh_obj.matrixAutoUpdate = false;
      link.mesh_obj.matrix = matrix.multiply(rot);
    }
  }
}
function v3_float(str) {
  var v3 = [];
  var ss = str.split(" ");
  for (var i = 0; i < ss.length; i++) v3.push(parseFloat(ss[i]));
  return v3;
}
function joint_add(name, next) {
  var obj = {};
  while (next) {
    switch (next.tagName) {
      case "parent":
        obj.parent = next.getAttribute("link");
        break;
      case "child":
        obj.child = next.getAttribute("link");
        break;
      case "origin":
        obj.xyz = v3_float(next.getAttribute("xyz"));
        obj.rpy = v3_float(next.getAttribute("rpy"));
        break;
      case "axis":
        obj.xyz_axis = v3_float(next.getAttribute("xyz"));
        break;
      default:
        console.log("unknown tag<" + next.tagName + ">");
        break;
    }
    obj.rotate = [0, 0, 0];
    next = next.nextElementSibling;
  }
  obj.name = name;
  xrobot.joint[name] = obj;
}
function link_add(name, next) {
  var obj = {};
  while (next) {
    switch (next.tagName) {
      case "visual":
        visual_add(obj, next.firstElementChild);
        break;
      case "inertial":
        break;
      default:
        console.log("unknown tag<" + next.tagName + ">");
        break;
    }
    next = next.nextElementSibling;
  }
  obj.name = name;
  obj.links = [];
  obj.childJoints = [];
  xrobot.link[name] = obj;
}
function visual_add(obj, next) {
  while (next) {
    switch (next.tagName) {
      case "origin":
        obj.xyz = v3_float(next.getAttribute("xyz"));
        obj.rpy = v3_float(next.getAttribute("rpy"));
        break;
      case "geometry":
        // obj.mesh = xrobot_nuwa + next.firstElementChild.getAttribute('filename');
        if (window.location.hostname === "dev-dss.nuwarobotics.com") {
          obj.mesh =
            "/developerUser/static/" +
            next.firstElementChild.getAttribute("filename");
        } else {
          obj.mesh =
            "/static/" + next.firstElementChild.getAttribute("filename");
        }
        obj.mesh = obj.mesh.replace("/assets", "");
        break;
      case "material":
        obj.mesh_color = v3_float(next.firstElementChild.getAttribute("rgba"));
        break;
      default:
        console.log("unknown tag<" + next.tagName + ">");
        break;
    }
    next = next.nextElementSibling;
  }
}
//
class Motor {
  constructor(x, y) {
    this.name = "name";
    this.rotateDirection = 1;
    this.mayaDirection = 1;
  }
}
