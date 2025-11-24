document.addEventListener("DOMContentLoaded", function () {
    // 來自 robot.html 的關節定義
    const joints = [
        { name: "neck_z", label: "頭部水平", min: -30, max: 30, defaultValue: 0 },
        { name: "neck_y", label: "頭部垂直", min: -20, max: 20, defaultValue: 0 },
        { name: "right_shoulder_z", label: "右肩內轉", min: 0, max: 90, defaultValue: 3.0 },
        { name: "right_shoulder_y", label: "右肩上抬", min: -55, max: 200, defaultValue: 8.0 },
        { name: "right_shoulder_x", label: "右手臂側抬", min: 0, max: 90, defaultValue: 5.0 },
        { name: "right_elbow_y", label: "右手肘上抬", min: 0, max: 75, defaultValue: -15.0 },
        { name: "left_shoulder_z", label: "左肩內轉", min: 0, max: 90, defaultValue: 3.0 },
        { name: "left_shoulder_y", label: "左肩上抬", min: -55, max: 200, defaultValue: 8.0 },
        { name: "left_shoulder_x", label: "左手臂側抬", min: 0, max: 90, defaultValue: 5.0 },
        { name: "left_elbow_y", label: "左手肘上抬", min: 0, max: 75, defaultValue: -15.0 },
    ];
    // 平台相關的 Timeline，目前是固定的
    const platformJoints = [
        { name: "platform_y", defaultValue: 0.0 },
        { name: "platform_x", defaultValue: 0.0 },
        { name: "platform_theta", defaultValue: 0.0 },
    ];

    function initializeEditor() {
        document.getElementById('add-frame-btn').addEventListener('click', addKeyframe);
        document.getElementById('save-xml-btn').addEventListener('click', saveToFile);
    }

    function addKeyframe() {
        const container = document.getElementById('keyframes-container');
        const frameId = `frame-${Date.now()}`;
        const card = document.createElement('div');
        card.className = 'card keyframe-card mb-2';
        card.innerHTML = "`
            <div class=\"card-header\" id=\"heading-${frameId}\">
                <h5 class=\"mb-0\">
                    <button class=\"btn btn-link\" data-toggle=\"collapse\" data-target=\"#collapse-${frameId}\" aria-expanded=\"true\" aria-controls=\"collapse-${frameId}\">
                        關鍵影格設定
                    </button>
                    <button class=\"btn btn-danger btn-sm float-right delete-frame-btn\">刪除</button>
                </h5>
            </div>
            <div id=\"collapse-${frameId}\" class=\"collapse show\" aria-labelledby=\"heading-${frameId}\">
                <div class=\"card-body\">
                    <div class=\"form-group\">
                        <label>影格編號 (Frame Number)</label>
                        <input type=\"number\" class=\"form-control frame-number\" placeholder=\"例如：10\" value=\"0">
                    </div>
                    <button class=\"btn btn-info record-pose-btn mb-3\">記錄當前姿勢</button>
                    <div class=\"joint-values-container row\">
                        ${joints.map(joint => `
                            <div class=\"form-group col-md-4\">
                                <label>${joint.label} (${joint.name})</label>
                                <input type=\"text\" class=\"form-control joint-value\" data-joint-name=\"${joint.name}\" value=\"${joint.defaultValue}\" readonly>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `";

        container.appendChild(card);
        
        // 綁定新按鈕的事件
        card.querySelector('.record-pose-btn').addEventListener('click', function() {
            recordPose(this);
        });
        card.querySelector('.delete-frame-btn').addEventListener('click', function() {
            deleteKeyframe(this);
        });
    }

    function recordPose(buttonElement) {
        const cardBody = buttonElement.closest('.card-body');
        joints.forEach(joint => {
            const slider = document.getElementById(`${joint.name}-slider`);
            if (slider) {
                const value = slider.value;
                const input = cardBody.querySelector(`.joint-value[data-joint-name="${joint.name}"]`);
                if (input) {
                    input.value = value;
                }
            }
        });
    }

    function deleteKeyframe(buttonElement) {
        const card = buttonElement.closest('.keyframe-card');
        card.remove();
    }

    function generateXML() {
        const motionName = document.getElementById('motionName').value || 'MyCustomMotion';
        const fps = document.getElementById('motionFps').value;
        const keyframeCards = document.querySelectorAll('.keyframe-card');

        if (keyframeCards.length === 0) {
            alert('請至少新增一個關鍵影格！');
            return null;
        }

        let keyframesData = [];
        let minFrame = Infinity;
        let maxFrame = -Infinity;

        keyframeCards.forEach(card => {
            const frameNumberInput = card.querySelector('.frame-number');
            const frame = parseInt(frameNumberInput.value, 10);

            if (isNaN(frame)) {
                // 如果使用者沒有輸入有效的影格數字，可以跳過或給予預設值
                return; 
            }

            minFrame = Math.min(minFrame, frame);
            maxFrame = Math.max(maxFrame, frame);

            let frameValues = { frame: frame, values: {} };
            card.querySelectorAll('.joint-value').forEach(input => {
                frameValues.values[input.dataset.jointName] = parseFloat(input.value);
            });
            keyframesData.push(frameValues);
        });
        
        if (keyframesData.length === 0) {
            alert('沒有有效的關鍵影格！');
            return null;
        }

        // 根據 frame 數字排序
        keyframesData.sort((a, b) => a.frame - b.frame);
        
        const startFrame = keyframesData[0].frame;
        const endFrame = keyframesData[keyframesData.length - 1].frame;


        let motorTimelineLayers = '';
        joints.forEach(joint => {
            motorTimelineLayers += `      <bezierLayer tag="${joint.name}" id="0" color="-65536">
`; // 顏色可自行更換
            keyframesData.forEach(kf => {
                motorTimelineLayers += `         <BezierKey frame="${kf.frame}.0" value="${kf.values[joint.name]}" in="AUTO" out="AUTO"/>
`;
            });
            motorTimelineLayers += `      </bezierLayer>
`;
        });
        
        let platformTimelineLayers = '';
        platformJoints.forEach(joint => {
            platformTimelineLayers += `      <bezierLayer tag="${joint.name}" id="0" color="-10223516">
`;
            keyframesData.forEach(kf => {
                 platformTimelineLayers += `         <BezierKey frame="${kf.frame}.0" value="${joint.defaultValue}" in="AUTO" out="AUTO"/>
`;
            });
            platformTimelineLayers += `      </bezierLayer>
`;
        });


        const xmlContent = "`
<motion name=\"${motionName}\" loop=\"false\" startFrame=\"" + startFrame + "\" endFrame=\"" + endFrame + "\" fps=\"" + fps + ".0">
   <motorTimeline id="0" startDelay="0.0" startFrame=\"" + startFrame + "\" endFrame=\"" + endFrame + "\" fps=\"" + fps + ".0">
${motorTimelineLayers}
   </motorTimeline>
   <platformTimeline id="0" startDelay="0.0" startFrame=\"" + startFrame + "\" endFrame=\"" + endFrame + "\" fps=\"" + fps + ".0">
${platformTimelineLayers}
   </platformTimeline>
</motion>
        ";

        return xmlContent.trim();
    }

    function saveToFile() {
        const xml = generateXML();
        if (!xml) return;

        const motionName = document.getElementById('motionName').value || 'MyCustomMotion';
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${motionName}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    initializeEditor();
});
