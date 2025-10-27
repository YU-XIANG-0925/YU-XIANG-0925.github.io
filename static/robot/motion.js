// motion.js
var motion = null;
var motion_start_t = 0;
var motion_count = 0;
//
function motion_start_stop() {
  if (motion_start_t) motion_stop();
  else motion_start();
}
function motion_start() {
  if (motion_start_t) motion_stop();
  motion_start_t = new Date().getTime();
  motion_count = 0;
  console.log("motion_start ", motion_start_t);
  if (motion && motion.media_path) {
    var path = motion.media_path;
    path = path.replace("/assets", "");
    // video_start(xrobot_nuwa + motion.media_path);
    video_start(path);
  }
}
function motion_stop() {
  if (motion_start_t == 0) return;
  var d = new Date().getTime() - motion_start_t;
  console.log("motion_stop time=", d);
  motion_start_t = 0;
  fps_show(0);
  //
  video_stop();
  //
}
function fps_show(fps) {
  //console.log('fps_show', fps);
  document.getElementById("fps").innerHTML = fps
    ? "FPS(" + Math.floor(fps) + ")"
    : "";
}
//
var motors = [
  "neck_z",
  "neck_y",
  "left_shoulder_z",
  "left_shoulder_y",
  "left_shoulder_x",
  "left_shoulder_x2",
  "left_elbow_y",
  "right_shoulder_z",
  "right_shoulder_y",
  "right_shoulder_x",
  "right_shoulder_x2",
  "right_elbow_y",
  "platform_x",
  "platform_y",
  "platform_theta",
];
function motion_poll() {
  if (motion_start_t == 0) return;
  var time = new Date().getTime() - motion_start_t;
  motion_count++;
  if (motion_count % 100 == 0) fps_show((1000 * motion_count) / time);
  //console.log('time='+(time/1000*24)+'motion[endFrame]'+motion['endFrame']);
  if ((time / 1000) * 24 > motion["endFrame"]) {
    motion_stop();
  }
  for (var i = 0; i < motors.length; i++) motor_poll(motors[i], time);
}
//function motor_poll(motor, joint, d) {
function motor_poll(name, time) {
  var bezierlayer = motion[name];
  var joint = xrobot.joint[name];
  var motor = xhardware.motor[name];
  // playform
  if (motion[name]) {
    if (name == "platform_theta") {
      platform_theta = (bezierlayer.evaluate(time / 1000) / 180) * Math.PI;
      return;
    }
    if (name == "platform_x") {
      platform_x = (bezierlayer.evaluate(time / 1000) / 180) * Math.PI;
      return;
    }
    if (name == "platform_y") {
      platform_y = (bezierlayer.evaluate(time / 1000) / 180) * Math.PI;
      return;
    }
  }
  //
  if (joint == null || bezierlayer == null || bezierlayer.keys.length == 0) {
    if (bezierlayer) {
      console.log("motor not found(" + name + ")");
    }
    return;
  }
  //console.log('motor_poll name'+name+'time='+ time);
  var val = (bezierlayer.evaluate(time / 1000) / 180) * Math.PI;
  val *= motor.mayaDirection;
  joint.rotate[0] = joint.xyz_axis[0] * val;
  joint.rotate[1] = joint.xyz_axis[1] * val;
  joint.rotate[2] = joint.xyz_axis[2] * val;
}
/*
 * obj
 */
// function motion_load(url) {
//   var http = new XMLHttpRequest();
//   http.onreadystatechange = function() {
//     if(http.readyState == 4 && http.status == 200){
//       var hash = CryptoJS.MD5(basicToken);
//       var hex = hash.toString(CryptoJS.enc.Hex).toUpperCase();
//       var obj = {};
//       var t = JSON.parse(http.responseText);
//       var bytes  = CryptoJS.AES.decrypt(t.data, CryptoJS.enc.Utf8.parse(hex), {
//         mode: CryptoJS.mode.ECB
//       });
//       var decrypted = bytes.toString(CryptoJS.enc.Utf8);
//       parse_motion(obj, (new DOMParser()).parseFromString(decrypted, 'text/xml').documentElement);
//       console.log('motion', obj);
//       motion = obj;
//       //console.log(JSON.stringify(obj, null, '  '));
//       //motion_test(motion, "neck_z");
//       if (motion && motion.media_path) {
//         var path = motion.media_path;
//         path = path.replace('/assets', '');
//         // video_load(xrobot_nuwa + motion.media_path);
//         video_load(path);
//       }
//       //
//     }
//   };
//   http.open('GET', url);
//   http.send(null);
// }
function motion_load(url) {
  // url 現在是本地相對路徑
  var http = new XMLHttpRequest();
  http.onreadystatechange = function () {
    if (http.readyState == 4) {
      if (http.status == 200) {
        try {
          // 使用 API_TOKEN 計算金鑰
          if (typeof API_TOKEN === "undefined" || !API_TOKEN) {
            throw new Error(
              "API_TOKEN 未定義或為空，無法解密。請在 robot.html 中定義 API_TOKEN。"
            );
          }
          var hash = CryptoJS.MD5(API_TOKEN);
          var hexKey = hash.toString(CryptoJS.enc.Hex).toUpperCase();
          var secretKey = CryptoJS.enc.Utf8.parse(hexKey);
          // 金鑰計算結束

          var responseText = http.responseText;
          var jsonData = JSON.parse(responseText);
          var base64Data = jsonData.data;
          if (!base64Data) {
            throw new Error("檔案內容缺少 'data' 欄位。");
          }
          var encryptedWordArray = CryptoJS.enc.Base64.parse(base64Data);
          var decryptedWordArray = CryptoJS.AES.decrypt(
            { ciphertext: encryptedWordArray },
            secretKey,
            {
              mode: CryptoJS.mode.ECB,
              padding: CryptoJS.pad.Pkcs7,
            }
          );
          var xmlString = decryptedWordArray.toString(CryptoJS.enc.Utf8);

          if (!xmlString) {
            throw new Error(
              "解密失敗或結果為空字串。請檢查 API_TOKEN 是否正確且未過期？"
            );
          }

          var parser = new DOMParser();
          var xmlDoc = parser.parseFromString(xmlString, "text/xml");

          if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            var parseError =
              xmlDoc.getElementsByTagName("parsererror")[0].textContent;
            console.error("解析 XML 時出錯:", parseError);
            throw new Error("解密後的字串無法被解析為有效的 XML。");
          }

          var obj = {};
          parse_motion(obj, xmlDoc.documentElement);
          console.log("motion (本地解密)", obj);
          motion = obj;

          if (motion && motion.media_path) {
            var path = motion.media_path;
            path = path.replace("/assets", "");
            video_load(path);
          }
        } catch (error) {
          console.error("處理動作檔案時發生錯誤:", error);
          document.getElementById("nowPlaying").innerHTML =
            "錯誤: " + error.message;
          document.getElementById("nowPlaying").className = "red";
          motion_stop();
        }
      } else {
        console.error(
          "載入本地動作檔案失敗。狀態碼:",
          http.status,
          http.statusText
        );
        document.getElementById("nowPlaying").innerHTML =
          "錯誤: 無法載入本地檔案 (" +
          http.status +
          ") - 請檢查路徑 " +
          url +
          " 是否正確。";
        document.getElementById("nowPlaying").className = "red";
        motion_stop();
      }
    }
  };
  http.open("GET", url);
  http.send(null);
}
function motion_test(motion, motor) {
  var frames = motion[motor].frames;
  console.log("motion_test(" + motor + ")");
  for (var i = 0; i < frames.length; i++) {
    var e = frames[i];
    console.log("frame=" + e.frame + " value=" + e.value);
  }
}
function obj_attrs(item) {
  var obj = {};
  var attrs = item.attributes;
  for (var i = 0; i < attrs.length; i++)
    obj[attrs[i].nodeName] = attrs[i].nodeValue;
  return obj;
}
function obj_arr(next) {
  var arr = [];
  while (next) {
    arr.push(obj_attrs(next));
    next = next.nextElementSibling;
  }
  return arr;
}
function parse_bezierlayer(node) {
  //console.log('bezierlayer tagName=' + node.tagName);
  var bezierlayer = new BezierLayer();
  //var arr = [];
  var next = node.firstElementChild;
  while (next) {
    bezierlayer.keys.push(parse_bezierkey(next));
    next = next.nextElementSibling;
  }
  bezierlayer.initKeys();
  return bezierlayer;
}
function parse_bezierkey(node) {
  //console.log('parse_bezierkey tagName=' + node.tagName);
  var bezierkey = new BezierKey();
  bezierkey.set(
    parseFloat(node.getAttribute("frame")),
    parseFloat(node.getAttribute("value")),
    node.getAttribute("in"),
    node.getAttribute("out")
  );
  return bezierkey;
}
function parse_motion(obj, root) {
  var next = root.firstElementChild;
  obj["endFrame"] = root.getAttribute("endFrame");
  //console.log('>' + root.tagName, root);
  while (next) {
    //console.log('>' + next.tagName, next);
    switch (next.tagName) {
      case "mediaTimeline":
        parse_media(obj, next);
        break;
      case "motorTimeline":
        parse_motor(obj, next);
        break;
      case "platformTimeline":
        parse_platform(obj, next);
        break;
      default:
        console.log("unknown tag(" + next.tagName + ")");
        break;
    }
    next = next.nextElementSibling;
  }
  return obj;
}
function parse_media(obj, root) {
  var next = root.firstElementChild;
  //console.log('>' + root.tagName, root);
  while (next) {
    switch (next.tagName) {
      case "mediaLayer":
        var media_path = next.getAttribute("assetsPath");
        //console.log('media_path=' + media_path);
        obj.media_path = media_path;
        break;
      default:
        console.log("unknown tag(" + next.tagName + ")");
        break;
    }
    next = next.nextElementSibling;
  }
}
function parse_motor(obj, root) {
  var next = root.firstElementChild;
  while (next) {
    switch (next.tagName) {
      case "bezierLayer":
        // create new obj for joint
        var tag = next.getAttribute("tag");
        //console.log('bezierLayer tag=' + tag);
        var bezierlayer = parse_bezierlayer(next);
        obj[tag] = bezierlayer;
        break;
      default:
        console.log("unknown tag(" + next.tagName + ")");
        break;
    }
    next = next.nextElementSibling;
  }
}
function parse_platform(obj, root) {
  var next = root.firstElementChild;
  while (next) {
    switch (next.tagName) {
      case "bezierLayer":
        // create new obj for joint
        var tag = next.getAttribute("tag");
        //console.log('bezierLayer tag=' + tag);
        var bezierlayer = parse_bezierlayer(next);
        obj[tag] = bezierlayer;
        break;
      default:
        console.log("unknown tag(" + next.tagName + ")");
        break;
    }
    next = next.nextElementSibling;
  }
}
var BezierLayer = function (manager) {
  this.tag = "tag";
  this.keys = [];
  this.index = 0;
  this.weighted = false;
};
BezierLayer.prototype.initKeys = function () {
  for (var i = 0; i < this.keys.length; i++) {
    var data = this.keys[i].data;
    var front;
    var behind;
    if (i >= 1) {
      front = this.keys[i - 1].data;
    }
    if (i <= this.keys.length - 2) {
      behind = this.keys[i + 1].data;
    }
    this.keys[i].init(front, behind, this.weighted);
  }
};
BezierLayer.prototype.evaluate = function (time) {
  //time = time*24.0;

  if (this.keys.length < 1) return 0;
  var key;
  key = this.keys[0];
  if (time * 24 <= key.frame) {
    return key.value;
  }
  key = this.keys[this.keys.length - 1];
  if (time * 24 >= key.frame) {
    return key.value;
  }
  var cnt = 0;
  var cnt_max = 1000;
  while (true) {
    //
    if (this.index < 0) {
      this.index = 0;
      //console.log("time="+time+",this.index="+this.index);
      return this.keys[this.index].value;
    } else if (this.index >= this.keys.length - 1) {
      this.index = this.keys.length - 1;
      //console.log("time="+time+",this.index="+this.index);
      return this.keys[this.index].value;
    }
    //console.log("time="+time+",this.index="+this.index);
    var keyA = this.keys[this.index];
    var keyB = this.keys[this.index + 1];
    if (time * 24 < keyA.frame) {
      this.index--;
    } else if (keyB.frame < time * 24) {
      this.index++;
    } else {
      var point0 = keyA.data;
      var point1 = keyA.outData;
      var point2 = keyB.inData;
      var point3 = keyB.data;
      //console.log("time="+time*24+",KeyFrame[A,B]="+keyA.frame+","+keyB.frame);

      //console.log("point0="+ point0.frame+","+point0.value);
      //console.log("point1="+ point1.frame+","+point1.value);
      //console.log("point2="+ point2.frame+","+point2.value);
      //console.log("point3="+ point3.frame+","+point3.value);

      //float value = BezierCurve.getCurveY(timeInSec, point0, point1, point2, point3);
      return getCurveY(time * 24, point0, point1, point2, point3);
    }
    //
    if (cnt > cnt_max) {
      break;
    }
    //console.log("loop");
    cnt++;
  }
  console.log("fail");
  return 0;
};
BezierKey = function (manager) {
  this.frame = 0;
  this.value = 0;
  this.in = "in";
  this.out = "out";
};

BezierKey.prototype.set = function (_frame, _value, _in, _out) {
  this.frame = _frame;
  this.value = _value;
  this.in = _in;
  this.out = _out;

  this.data = new BezierData(this.frame, this.value);

  this.inData = BezierData.parse(_in);
  this.outData = BezierData.parse(_out);
  //this.inData=new BezierData( this.frame,this.value);
  //this.outData=new BezierData( this.frame,this.value);
  //this.inData.type = this.in;
  //this.outData.type = this.out;
};
/*BezierKey.prototype.evaluate = function( time) {
  return 0;
}
BezierKey.prototype.getData = function() {
  return this.data;
}*/
class BezierData {
  constructor(x, y) {
    this.frame = x;
    this.value = y;
    this.length = 0;
    this.degree = 0;
    this.weight = 0;
    this.type = BezierType.AUTO;
  }

  static createType(t) {
    var v = new BezierData(0, 0);
    v.type = t;
    return v;
  }
  static createType3(a, b, t) {
    var v = new BezierData(0, 0);
    v.degree = a;
    v.weight = b;
    v.type = t;
    return v;
  }
  static parse(str) {
    var strList = str.split(" ");

    if (strList.length == 1) {
      return BezierData.createType(strList[0]);
    } else if (strList.length == 3) {
      //console.log("createType3");
      return BezierData.createType3(
        parseFloat(strList[1]),
        parseFloat(strList[2]),
        strList[0]
      );
    } else {
      console.log("unknown in type=" + inData.type);
    }
    return new BezierData(BezierType.AUTO);
  }
}
/*
var BezierData = function ( x,y ) {
  this.frame = x;
  this.value = y;
  this.length = 0;
  this.degree = 0;
  this.type = BezierType.AUTO;
};
BezierData.prototype.parse = function( str ) {

  var strList = str.split(" ");

  if(strList.length==1){

  }
  if(type== BezierType.AUTO){

  }else if( type.startsWith(BezierType.AUTO)){
  }else{
    console.log("converterType unknown type="+type);
  }
}*/
var BezierType = function () {};
BezierType.AUTO = "AUTO";
BezierType.FIXED = "FIXED";
BezierType.SPLINE = "SPLINE";
BezierType.CLAMPED = "CLAMPED";
BezierType.LINEAR = "LINEAR";

//this.weighted*/
function toRadians(degree) {
  return (degree / 180) * Math.PI;
}
BezierKey.prototype.init = function (front, behind, weighted) {
  var EDGE_LENGTH = 0;

  //------------------------------------------------------
  //in
  //------------------------------------------------------
  if (this.inData.type == BezierType.AUTO) {
    var theda = this.getTangentAutoInDegree(front, behind);
    if (front != null) {
      this.inData.length = Math.abs(
        (this.frame - front.frame) / 3 / Math.cos(toRadians(theda) + Math.PI)
      );
    } else {
      this.inData.length = EDGE_LENGTH;
    }
    this.inData.degree = theda;
  } else if (this.inData.type == BezierType.FIXED) {
    if (weighted) {
      this.inData.length = this.inData.weight;
    } else {
      if (front != null) {
        this.inData.length = Math.abs(
          (this.frame - front.frame) /
            3 /
            Math.cos(toRadians(this.inData.degree) + Math.PI)
        );
      } else this.inData.length = EDGE_LENGTH;
    }
  } else if (
    this.inData.type == BezierType.SPLINE ||
    this.inData.type == BezierType.CLAMPED
  ) {
    var theda = this.getTangentClampedInDegree(front, behind);
    if (front != null) {
      this.inData.length = Math.abs(
        (this.frame - front.frame) / 3 / Math.cos(toRadians(theda) + Math.PI)
      );
    } else this.inData.length = EDGE_LENGTH;
    this.inData.degree = theda;
  } else if (this.inData.type == BezierType.LINEAR) {
    this.inData.degree = 0;
    if (front != null) {
      this.inData.degree = this.getDegree(
        front,
        new BezierData(this.frame, this.value)
      );
      this.inData.length = Math.abs(
        (this.frame - front.frame) /
          3 /
          Math.cos(toRadians(this.inData.degree) + Math.PI)
      );
    } else this.inData.length = EDGE_LENGTH;
  } else {
    console.log("unknown in type=" + this.inData.type);
  }
  //------------------------------------------------------
  //out
  //------------------------------------------------------
  if (this.outData.type == BezierType.AUTO) {
    var theda = this.getTangentAutoInDegree(front, behind);
    if (front != null) {
      this.outData.length = Math.abs(
        (behind.frame - this.frame) / 3 / Math.cos(toRadians(theda) + Math.PI)
      );
    } else this.outData.length = EDGE_LENGTH;
    this.outData.degree = theda;
  } else if (this.outData.type == BezierType.FIXED) {
    if (weighted) {
      this.outData.length = this.outData.weight;
    } else {
      if (behind != null) {
        this.outData.length = Math.abs(
          (behind.frame - this.frame) /
            3 /
            Math.cos(toRadians(this.outData.degree))
        );
      } else this.outData.length = EDGE_LENGTH;
    }
  } else if (
    this.outData.type == BezierType.SPLINE ||
    this.outData.type == BezierType.CLAMPED
  ) {
    var theda = this.getTangentClampedInDegree(front, behind);
    if (front != null) {
      this.outData.length = Math.abs(
        (behind.frame - this.frame) / 3 / Math.cos(toRadians(theda) + Math.PI)
      );
    } else this.outData.length = EDGE_LENGTH;
    this.outData.degree = theda;
  } else if (this.outData.type == BezierType.LINEAR) {
    this.outData.degree = 0;
    if (behind != null) {
      this.outData.degree = this.getDegree(
        new BezierData(this.frame, this.value),
        behind
      );
      this.outData.length = Math.abs(
        (behind.frame - this.frame) /
          3 /
          Math.cos(toRadians(this.outData.degree))
      );
    } else this.outData.length = EDGE_LENGTH;
  } else {
    console.log("unknown out type=" + this.outData.type);
  }
  //------------------------------------------------------

  //console.log("this.frame="+this.frame);
  this.inData.length = this.inData.length;
  this.inData.frame =
    this.frame +
    this.inData.length * Math.cos(toRadians(this.inData.degree) + Math.PI);
  this.inData.value =
    this.value +
    this.inData.length * Math.sin(toRadians(this.inData.degree) + Math.PI);

  this.outData.frame =
    this.frame + this.outData.length * Math.cos(toRadians(this.outData.degree));
  this.outData.value =
    this.value + this.outData.length * Math.sin(toRadians(this.outData.degree));
};
BezierKey.prototype.getTangentClampedInDegree = function (front, behind) {
  return this.getTangentSplineInDegree(front, behind);
};
BezierKey.prototype.getTangentSplineInDegree = function (front, behind) {
  var result = 0;
  if (front == null && behind == null) {
    return result;
  }
  if (front == null && behind != null) {
    return this.getDegree(new BezierData(this.frame, this.value), behind);
  }
  if (front != null && behind == null) {
    return this.getDegree(front, new BezierData(this.frame, this.value));
  }
  if (front.frame > this.frame || this.frame > behind.frame) return result;

  return (
    (Math.atan(
      (behind.value - front.value) / Math.abs(front.frame - behind.frame)
    ) /
      Math.PI) *
    180.0
  );
};
BezierKey.prototype.getDegree = function (front, behind) {
  return (
    (Math.atan(
      (behind.value - front.value) / Math.abs(behind.frame - front.frame)
    ) /
      Math.PI) *
    180.0
  );
};
BezierKey.prototype.getTangentAutoInDegree = function (front, behind) {
  var result = 0;
  if (front == null || behind == null) return result;
  if (front.frame > this.frame || this.frame > behind.frame) return result;
  if (
    (front.value > this.value && this.value > behind.value) ||
    (front.value < this.value && this.value < behind.value)
  ) {
    result =
      (Math.atan(
        (behind.value - front.value) / Math.abs(front.frame - behind.frame)
      ) /
        Math.PI) *
      180.0;
  } else {
    return result;
  }
  var width = Math.abs(front.frame - behind.frame);
  var height = Math.abs(front.value - behind.value);
  var diff = Math.abs(this.frame - front.frame);
  var h3 = height / 3;
  var behindDiff = h3 * (1 - diff / width);
  var frontDiff = h3 * (diff / width);
  if (Math.abs(front.value - this.value) < frontDiff) {
    var rate = Math.abs(front.value - this.value) / frontDiff;
    result *= rate;
  }
  if (Math.abs(behind.value - this.value) < behindDiff) {
    var rate = Math.abs(behind.value - this.value) / behindDiff;
    result *= rate;
  }
  return result;
}; /*BezierData.prototype. = */

function getCurvePoint(t, p0, p1, p2, p3) {
  var p01 = getInterpolation(t, p0, p1);
  var p12 = getInterpolation(t, p1, p2);
  var p23 = getInterpolation(t, p2, p3);

  var p012 = getInterpolation(t, p01, p12);
  var p123 = getInterpolation(t, p12, p23);

  return getInterpolation(t, p012, p123);
}
function getInterpolation(r, p0, p1) {
  return new BezierData(
    p0.frame + r * (p1.frame - p0.frame),
    p0.value + r * (p1.value - p0.value)
  );
}
function getCurveY(x, p0, p1, p2, p3) {
  //console.log("getCurveY");
  if (x == p0.frame) {
    return p0.value;
  }
  if (x == p3.frame) {
    return p3.value;
  }
  if (
    p1.frame == Number.POSITIVE_INFINITY ||
    p1.frame == Number.NEGATIVE_INFINITY
  ) {
    return p0.value;
  }
  var t1 = 0;
  var t2 = 0;
  var t3 = 0;

  var x0 = p0.frame - p0.frame;
  var x1 = p1.frame - p0.frame;
  var x2 = p2.frame - p0.frame;
  var x3 = p3.frame - p0.frame;
  x -= p0.frame;

  var a = x0 + 3 * x1 - 3 * x2 + x3;
  var b = 3 * x0 - 6 * x1 + 3 * x2;
  var c = -3 * x0 + 3 * x1;
  var d = x0 - x;

  if (a == 0.0 && b == 0) {
    t1 = -d / c;
    t2 = NaN;
    t3 = NaN;
  } else if (a == 0.0) {
    // Quadratic equation
    var discriminant = c * c - 4.0 * b * d;
    if (discriminant < 0) {
      return 0;
    }
    var sqrtD = Math.sqrt(discriminant);
    t1 = (-c + sqrtD) / (2 * b);
    t2 = (-c - sqrtD) / (2 * b);
    t3 = NaN;
  } else {
    // cubic equation
    // Normalize coefficients.
    var denom = a;
    a = b / denom;
    b = c / denom;
    c = d / denom;

    // Commence solution.
    var a_over_3 = a / 3.0;
    var Q = (3 * b - a * a) / 9.0;
    var Q_CUBE = Q * Q * Q;
    var R = (9 * a * b - 27 * c - 2 * a * a * a) / 54.0;
    var R_SQR = R * R;
    var D = Q_CUBE + R_SQR;

    if (D < 0.0) {
      // Three unequal real roots.
      var theta = Math.acos(R / Math.sqrt(-Q_CUBE));
      var SQRT_Q = Math.sqrt(-Q);
      t1 = 2.0 * SQRT_Q * Math.cos(theta / 3.0) - a_over_3;
      t2 = 2.0 * SQRT_Q * Math.cos((theta + Math.PI * 2.0) / 3.0) - a_over_3;
      t3 = 2.0 * SQRT_Q * Math.cos((theta + Math.PI * 4.0) / 3.0) - a_over_3;
    } else if (D > 0.0) {
      // One real root.
      var SQRT_D = Math.sqrt(D);
      var S = Math.cbrt(R + SQRT_D);
      var T = Math.cbrt(R - SQRT_D);
      t1 = S + T - a_over_3;
      t2 = NaN;
      t3 = NaN;
    } else {
      // Three real roots, at least two equal.
      var CBRT_R = Math.cbrt(R);
      t1 = 2 * CBRT_R - a_over_3;
      t2 = t3 = CBRT_R - a_over_3;
    }
  }

  if (0 <= t1 && t1 <= 1) {
    var point = getCurvePoint(t1, p0, p1, p2, p3);
    return point.value;
  }
  if (0 <= t2 && t2 <= 1) {
    var point = getCurvePoint(t2, p0, p1, p2, p3);
    return point.value;
  }
  if (0 <= t3 && t3 <= 1) {
    var point = getCurvePoint(t3, p0, p1, p2, p3);
    return point.value;
  }
  return 0;
}
