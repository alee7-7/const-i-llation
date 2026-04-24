import {
  FilesetResolver,
  GestureRecognizer
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");

// =================================================
// ✔️ Multi-hand State
// =================================================
const handState = {
  0: { selected: null, grabbing: false },
  1: { selected: null, grabbing: false }
};

let handPositions = {
  0: { x: 0, y: 0 },
  1: { x: 0, y: 0 }
};

// =================================================
// Buttons --- function coding assisted by Claude
// =================================================

document.getElementById("addBtn").addEventListener("click", () => {
  const box = document.createElement("div");
  box.className = "box draggable";
  box.style.left = Math.random() * (window.innerWidth - 120) + "px";
  box.style.top = Math.random() * (window.innerHeight - 120) + "px";
  box.innerHTML = `<img src="./img/star.png">`;
  document.body.appendChild(box);
});

document.getElementById("removeBtn").addEventListener("click", () => {
  const stars = document.querySelectorAll(".draggable");
  if (stars.length > 0) stars[stars.length - 1].remove();
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.querySelectorAll(".draggable").forEach(el => el.remove());
});

document.getElementById("snapBtn").addEventListener("click", async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: "screen" },
      preferCurrentTab: true
    });
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream;
    await screenVideo.play();
    await new Promise(resolve => requestAnimationFrame(resolve));

    const canvas = document.createElement("canvas");
    canvas.width = screenVideo.videoWidth;
    canvas.height = screenVideo.videoHeight;
    canvas.getContext("2d").drawImage(screenVideo, 0, 0);
    screenStream.getTracks().forEach(t => t.stop());

    const link = document.createElement("a");
    link.download = "screenshot.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error("Screenshot failed:", err);
  }
});

// =================================================
// Constellation Info Panel --- function coding assisted by Claude
// =================================================

// button for open/close panel 
const panelToggleBtn = document.getElementById("panelOpen");
const infoPanel = document.getElementById("info-panel");

document.getElementById("panelClose").addEventListener("click", () => {
  infoPanel.classList.add("hidden");
  panelToggleBtn.style.display = "flex";
});

panelToggleBtn.addEventListener("click", () => {
  infoPanel.classList.remove("hidden");
  panelToggleBtn.style.display = "none";
});


// array format suggested by Claude + research for simplest code
const slides = [
  { src: "../img/const-1.png", title: "Aries - The Ram (Mar 21 - Apr 19)",        body: "Bold and ambitious, you love to be number one. You dive headfirst even into the most challenging situations and always come out on top." },
  { src: "../img/const-2.png", title: "Taurus - The Bull (Apr 20 - May 20)",   body: "You enjoy relaxing in serene, calm environments surrounded by soft sounds and soothing aromas. You are practical and reliable." },
  { src: "../img/const-3.png", title: "Gemini - The Twins (May 21 - Jun 21)",    body: "Spontaneous and playful is everything that comes from your curiousity-driven mind. You are always looking for something new and quick-witted." },
  { src: "../img/const-4.png", title: "Cancer - The Crab (Jun 22 - Jul 22)",    body: "You're loyalty and protectiveness allows you to exist in both emotional and material realms. You're driven by high intuition to make decisions." },
  { src: "../img/const-5.png", title: "Leo - The Lion (Jul 23 - Aug 22)",    body: "Passionate, loyal, and sometimes dramatic, you love to bask in the spotlight. Through your dominance, you also succeed with creativity." },
  { src: "../img/const-6.png", title: "Virgo - The Virgin (Aug 23 - Sep 22)",    body: "You're very logical, practical, and systematic with your approach to life. Deeply routed in analytics, you are hardworking and consistently practice." },
  { src: "../img/const-7.png", title: "Libra - The Balance (Sep 23 - Oct 23)",    body: "You thrive in balance, harmony, and justice. Your morals align with diplomacy and cooperation, and always establishing an equilibrium." },
  { src: "../img/const-8.png", title: "Scorpio - The Scorpion (Oct 24 - Nov 21)",    body: "Using emotional energy as fuel, you cultivate powerful wisdom with passion and resource. Sometimes you come across as mysterious." },
  { src: "../img/const-9.png", title: "Sagittarius - The Archer (Nov 22 - Dec 21)",    body: "You're always on a quest for knowledge. Chasing after physical and spiritual journeys, you're looking for a new adventure everyday." },
  { src: "../img/const-10.png", title: "Capricorn - The Goat (Dec - Jan 19)",    body: "Time is what you control. Patience, perseverance, and dedication are your strong points as you navigate your material and emotional worlds." },
  { src: "../img/const-11.png", title: "Aquarius - The Water Bearer (Jan 20 - Feb 18)",    body: "Innovative and progressive, you're always working to make the world a better place. Working independently and intellectually is where you thrive." },
  { src: "../img/const-12.png", title: "Pisces - The Fish (Feb 19 - Mar 20)",    body: "You're intuitive, sensitive, and empathatetic, and that's where your creativity forms. You use art to travel between reality and fantasy." },
];

let currentSlide = 0;
let infoOpen = false;

const track = document.getElementById("img-track");
const counter = document.getElementById("img-counter");
const imgInfo = document.getElementById("img-info");

function buildSlides() {
  track.innerHTML = "";
  slides.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "slide";
    div.innerHTML = `<img src="${s.src}" alt="${s.title}">`;
    div.addEventListener("click", toggleImgInfo);
    track.appendChild(div);
  });
}

function goToSlide(n) {
  currentSlide = (n + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 260}px)`;
  counter.textContent = `${currentSlide + 1} / ${slides.length}`;
  if (infoOpen) updateInfo();
}

function updateInfo() {
  const s = slides[currentSlide];
  document.getElementById("img-info-title").textContent = s.title;
  document.getElementById("img-info-body").textContent = s.body;
}

function toggleImgInfo() {
  infoOpen = !infoOpen;
  imgInfo.classList.toggle("open", infoOpen);
  if (infoOpen) updateInfo();
}

document.getElementById("prevBtn").addEventListener("click", () => goToSlide(currentSlide - 1));
document.getElementById("nextBtn").addEventListener("click", () => goToSlide(currentSlide + 1));

buildSlides();
goToSlide(0);


// =================================================
// 📸 Webcam setup
// =================================================
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user" }
});

video.srcObject = stream;
await video.play();

// =================================================
// ✔️ Mediapipe
// =================================================
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
);

const recognizer = await GestureRecognizer.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
  },
  numHands: 2
});

// =================================================
// ✔️ Distance
// =================================================
function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// =================================================
// ✔️ Connection logic
// =================================================
function getCenter(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function computeConnections(elements) {
  const n = elements.length;
  const centers = elements.map(getCenter);
  const connected = new Set();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = centers[j].x - centers[i].x;
      const dy = centers[j].y - centers[i].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 300) {
        connected.add(`${i}-${j}`);
      }
    }
  }

  return { connected, centers };
}

function drawLines(elements) {
  const svg = document.getElementById("lines");
  const { connected, centers } = computeConnections(elements);

  svg.innerHTML = "";

  for (const key of connected) {
    const [i, j] = key.split("-").map(Number);
    const a = centers[i];
    const b = centers[j];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
    line.setAttribute("stroke", "yellow");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-dasharray", "6 4");
    svg.appendChild(line);
  }
}

// =================================================
// ✔️ Main Loop --- function coding assisted by Claude
// =================================================
async function loop() {
  try {
    const result = await recognizer.recognize(video);

    if (result.landmarks && result.landmarks.length > 0) {
      for (let i = 0; i < result.landmarks.length; i++) {
        const lm = result.landmarks[i];
        let x = lm[9].x * window.innerWidth;
        let y = lm[9].y * window.innerHeight;
        x = window.innerWidth - x;
        handPositions[i] = { x, y };
      }
    }

    const gestures = result.gestures || [];

    for (let i = 0; i < 2; i++) {
      if (i >= gestures.length) {
        handState[i].grabbing = false;
        handState[i].selected = null;
      }
    }

    for (let i = 0; i < gestures.length; i++) {
      const gesture = gestures[i][0].categoryName;
      const hand = handPositions[i];
      const state = handState[i];

      if (!hand) continue;

      if (gesture === "Closed_Fist") {
        let minDist = Infinity;
        let nearest = null;

        document.querySelectorAll(".draggable").forEach((box) => {
          const rect = box.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const d = dist(hand.x, hand.y, cx, cy);
          if (d < minDist && d < 150) {
            minDist = d;
            nearest = box;
          }
        });

        if (nearest) state.selected = nearest;

        const el = state.selected;
        if (el && el.isConnected) {
          el.style.left = hand.x - 60 + "px";
          el.style.top = hand.y - 60 + "px";
        } else {
          state.selected = null;
        }

        state.grabbing = true;
      } else {
        state.grabbing = false;
        state.selected = null;
      }
    }

    const arr = Array.from(document.querySelectorAll(".draggable"));
    drawLines(arr);

    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i].getBoundingClientRect();
        const b = arr[j].getBoundingClientRect();
        const ax = a.left + a.width / 2;
        const ay = a.top + a.height / 2;
        const bx = b.left + b.width / 2;
        const by = b.top + b.height / 2;
        if (dist(ax, ay, bx, by) < 120) {
          document.querySelector("#special").style.display = "block";
        }
      }
    }

  } catch (err) {
    console.error("loop error:", err);
  }

  requestAnimationFrame(loop);
}

loop();

