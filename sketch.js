// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn;
let circleColor; // 원의 색상 저장

// 가속도 센서 관련 변수
let accelX = 0, accelY = 0, accelZ = 0;
let accelStatusP, accelBtn;
let accelEnabled = false;
// 작은 원의 위치와 속도
let ballX, ballY;
let ballVx = 0, ballVy = 0;
let ballRotation = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // 초기 색상 설정 (기본값: 흰색 또는 회색)
  circleColor = color(150, 150, 150);

  // 가속도 센서 버튼
  accelBtn = createButton("Enable Accelerometer");
  accelBtn.mousePressed(enableAccelerometer);
  accelBtn.size(150, 30);
  accelBtn.position(20, 140);

  // 가속도 센서 상태 및 값 표시
  accelStatusP = createP("Accelerometer: Not enabled");
  accelStatusP.position(22, 180);
  accelStatusP.style('font-size', '12px');

  // 작은 원의 초기 위치 (중앙)
  ballX = width / 2;
  ballY = height / 2;

  // Send buttons
  const send1Btn = createButton("send 1");
  send1Btn.mousePressed(() => {
    circleColor = color(255, 0, 0); // Red
    sendNumber(1);
  });
  send1Btn.size(100, 30);
  send1Btn.position(20, 100);

  const send2Btn = createButton("send 2");
  send2Btn.mousePressed(() => {
    circleColor = color(0, 255, 0); // Green
    sendNumber(2);
  });
  send2Btn.size(100, 30);
  send2Btn.position(130, 100);

  const send3Btn = createButton("send 3");
  send3Btn.mousePressed(() => {
    circleColor = color(0, 0, 255); // Blue
    sendNumber(3);
  });
  send3Btn.size(100, 30);
  send3Btn.position(240, 100);
}

function draw() {
  background(240); // 배경색
  
  // 중앙에 크기 200인 원 그리기
  fill(circleColor);
  noStroke();
  circle(width / 2, height / 2, 200);

  // 가속도 값에 따라 작은 파란색 원 업데이트
  if (accelEnabled) {
    // 가속도를 속도 변화로 변환
    ballVx += accelX * 0.5;
    ballVy += accelY * 0.5;
    
    // 마찰 적용
    ballVx *= 0.98;
    ballVy *= 0.98;
    
    // 위치 업데이트
    ballX += ballVx;
    ballY += ballVy;
    
    // 경계 체크 (벽에 튕기기)
    if (ballX < 10 || ballX > width - 10) {
      ballVx *= -0.8;
      ballX = constrain(ballX, 10, width - 10);
    }
    if (ballY < 10 || ballY > height - 10) {
      ballVy *= -0.8;
      ballY = constrain(ballY, 10, height - 10);
    }
    
    // 회전 각도 업데이트 (속도에 따라)
    ballRotation += sqrt(ballVx * ballVx + ballVy * ballVy) * 0.1;
    
    // 작은 파란색 원 그리기 (회전 적용)
    push();
    translate(ballX, ballY);
    rotate(ballRotation);
    fill(0, 0, 255); // 파란색
    noStroke();
    circle(0, 0, 20);
    // 회전 방향 표시를 위한 작은 선
    stroke(255);
    strokeWeight(2);
    line(0, 0, 10, 0);
    pop();
  } else {
    // 활성화되지 않았을 때는 중앙에 고정
    fill(0, 0, 255); // 파란색
    noStroke();
    circle(ballX, ballY, 20);
  }
  
  // 가속도 값 텍스트 업데이트
  if (accelEnabled) {
    accelStatusP.html(
      `Accelerometer: Enabled<br>` +
      `X: ${accelX.toFixed(2)}<br>` +
      `Y: ${accelY.toFixed(2)}<br>` +
      `Z: ${accelZ.toFixed(2)}`
    );
  }
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}

// ---- 가속도 센서 활성화 ----
function enableAccelerometer() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          window.addEventListener('devicemotion', handleMotion);
          accelEnabled = true;
          accelStatusP.html("Accelerometer: Permission granted");
          accelBtn.html("Accelerometer: Enabled");
        } else {
          accelStatusP.html("Accelerometer: Permission denied");
        }
      })
      .catch(console.error);
  } else {
    // Android 또는 데스크톱 - 권한 요청 없이 바로 활성화
    window.addEventListener('devicemotion', handleMotion);
    accelEnabled = true;
    accelStatusP.html("Accelerometer: Enabled");
    accelBtn.html("Accelerometer: Enabled");
  }
}

// ---- 가속도 센서 값 처리 ----
function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    // 가속도 값 (m/s² 단위, 중력 포함)
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 값을 정규화 (너무 크거나 작은 값 방지)
    accelX = constrain(accelX / 10, -2, 2);
    accelY = constrain(accelY / 10, -2, 2);
  }
}

// ---- 화면 크기 변경 시 원 위치 재설정 ----
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  ballX = width / 2;
  ballY = height / 2;
}
