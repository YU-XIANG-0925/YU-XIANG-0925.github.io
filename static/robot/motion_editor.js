document.addEventListener("DOMContentLoaded", function () {
    // joints 變數已在 robot.html 中定義，此處不再重複定義。
    // platformJoints 只在編輯器生成 XML 時使用，在此定義。
    const platformJoints = [
        { name: "platform_y", defaultValue: 0.0 },
        { name: "platform_x", defaultValue: 0.0 },
        { name: "platform_theta", defaultValue: 0.0 },
    ];

    function initializeEditor() {
        if (document.getElementById('add-frame-btn')) {
            document.getElementById('add-frame-btn').addEventListener('click', addKeyframe);
        }
        if (document.getElementById('save-xml-btn')) {
            document.getElementById('save-xml-btn').addEventListener('click', saveToFile);
        }
    }

    function addKeyframe() {
        const container = document.getElementById('keyframes-container');
        // 確保全域的 joints 變數已載入
        if (!container || typeof joints === 'undefined') {
            console.error("Cannot add keyframe: container or global 'joints' not found.");
            return;
        }

        const frameId = 'frame-' + Date.now();
        const card = document.createElement('div');
        card.className = 'card keyframe-card mb-2';

        let jointInputsHTML = joints.filter(j => j.name !== 'rotate').map(function(joint) {
            return (
                '<div class="form-group col-md-4">' +
                '    <label>' + joint.label + ' (' + joint.name + ')</label>' +
                '    <input type="text" class="form-control joint-value" data-joint-name="' + joint.name + '" value="' + (document.getElementById(joint.name + '-slider') ? document.getElementById(joint.name + '-slider').value : 0) + '" readonly>' +
                '</div>'
            );
        }).join('');

        let cardHTML =
            '<div class="card-header" id="heading-' + frameId + '">' +
            '    <h5 class="mb-0">' +
            '        <button class="btn btn-link" data-toggle="collapse" data-target="#collapse-' + frameId + '" aria-expanded="true" aria-controls="collapse-' + frameId + '">' +
            '            關鍵影格設定' +
            '        </button>' +
            '        <button class="btn btn-danger btn-sm float-right delete-frame-btn">刪除</button>' +
            '    </h5>' +
            '</div>' +
            '<div id="collapse-' + frameId + '" class="collapse show" aria-labelledby="heading-' + frameId + '">' +
            '    <div class="card-body">' +
            '        <div class="form-group">' +
            '            <label>影格編號 (Frame Number)</label>' +
            '            <input type="number" class="form-control frame-number" placeholder="例如：10" value="0">' +
            '        </div>' +
            '        <button class="btn btn-info record-pose-btn mb-3">記錄當前姿勢</button>' +
            '        <div class="joint-values-container row">' +
                         jointInputsHTML +
            '        </div>' +
            '    </div>' +
            '</div>';

        card.innerHTML = cardHTML;

        container.appendChild(card);
        
        card.querySelector('.record-pose-btn').addEventListener('click', function() {
            recordPose(this);
        });
        card.querySelector('.delete-frame-btn').addEventListener('click', function() {
            deleteKeyframe(this);
        });
    }

    function recordPose(buttonElement) {
        if (typeof joints === 'undefined') return;
        const cardBody = buttonElement.closest('.card-body');
        joints.filter(j => j.name !== 'rotate').forEach(joint => {
            const slider = document.getElementById(joint.name + '-slider');
            if (slider) {
                const value = slider.value;
                const input = cardBody.querySelector('.joint-value[data-joint-name="' + joint.name + '"]');
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
        console.log("generateXML function called.");
        if (typeof joints === 'undefined' || typeof platformJoints === 'undefined') {
            console.error("Global 'joints' or local 'platformJoints' variable not found.");
            return null;
        }

        const motionName = document.getElementById('motionName').value || 'MyCustomMotion';
        const fps = document.getElementById('motionFps').value;
        const keyframeCards = document.querySelectorAll('.keyframe-card');
        console.log(`Found ${keyframeCards.length} keyframe cards.`);

        if (keyframeCards.length === 0) {
            console.error('No keyframes found. Aborting XML generation.');
            alert('請至少新增一個關鍵影格！');
            return null;
        }

        let keyframesData = [];
        keyframeCards.forEach(card => {
            const frameNumberInput = card.querySelector('.frame-number');
            const frame = parseInt(frameNumberInput.value, 10);

            if (isNaN(frame)) {
                console.warn("Skipping a keyframe with invalid frame number.");
                return; 
            }
            
            let frameValues = { frame: frame, values: {} };
            card.querySelectorAll('.joint-value').forEach(input => {
                frameValues.values[input.dataset.jointName] = parseFloat(input.value);
            });
            keyframesData.push(frameValues);
        });
        
        console.log("Parsed keyframes data:", keyframesData);

        if (keyframesData.length === 0) {
            console.error('No valid keyframes data. Aborting XML generation.');
            alert('沒有有效的關鍵影格！');
            return null;
        }

        keyframesData.sort((a, b) => a.frame - b.frame);
        
        const startFrame = keyframesData[0].frame;
        const endFrame = keyframesData[keyframesData.length - 1].frame;
        console.log(`Calculated startFrame: ${startFrame}, endFrame: ${endFrame}`);

        const motorJoints = joints.filter(j => j.name !== 'rotate');

        let motorTimelineLayers = motorJoints.map(joint => {
            let layer = '      <bezierLayer tag="' + joint.name + '" id="0" color="-65536">';
            keyframesData.forEach(kf => {
                const value = kf.values[joint.name] !== undefined ? kf.values[joint.name] : 0;
                layer += '         <BezierKey frame="' + kf.frame + '.0" value="' + value + '" in="AUTO" out="AUTO"/>';
            });
            layer += '      </bezierLayer>';
            return layer;
        }).join('\n');
        
        let platformTimelineLayers = platformJoints.map(joint => {
            let layer = '      <bezierLayer tag="' + joint.name + '" id="0" color="-10223516">';
            keyframesData.forEach(kf => {
                 layer += '         <BezierKey frame="' + kf.frame + '.0" value="' + joint.defaultValue + '" in="AUTO" out="AUTO"/>';
            });
            layer += '      </bezierLayer>';
            return layer;
        }).join('\n');

        const xmlContent = 
            '<motion name="' + motionName + '" loop="false" startFrame="' + startFrame + '" endFrame="' + endFrame + '" fps="' + fps + '.0">' +
            '   <motorTimeline id="0" startDelay="0.0" startFrame="' + startFrame + '" endFrame="' + endFrame + '" fps="' + fps + '.0">' +
            motorTimelineLayers + '\n' +
            '   </motorTimeline>' +
            '   <platformTimeline id="0" startDelay="0.0" startFrame="' + startFrame + '" endFrame="' + endFrame + '" fps="' + fps + '.0">' +
            platformTimelineLayers + '\n' +
            '   </platformTimeline>' +
            '</motion>';
        
        console.log("Final XML content generated.");
        return xmlContent.trim();
    }

    function saveToFile() {
        console.log("saveToFile function called.");
        const xml = generateXML();
        console.log("Generated XML content:", xml);

        if (!xml) {
            console.error("generateXML returned null or empty. Aborting save.");
            return;
        }

        const motionName = document.getElementById('motionName').value || 'MyCustomMotion';
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        console.log("Blob object created:", blob);

        const url = URL.createObjectURL(blob);
        console.log("Generated URL:", url);

        const a = document.createElement('a');
        a.href = url;
        a.download = motionName + '.xml';
        
        console.log("Creating and clicking download link...", a);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Download link clicked and removed.");
    }

    initializeEditor();
});