// =================================================
// ✔️ Import MediaPipe tools
// =================================================
   import {
     FilesetResolver,
     GestureRecognizer
   } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";


// =================================================
// ✋ Left Hand: gesture content
// =================================================
   const gestureContentLeft = {
      Closed_Fist: { 
         text: "✊", 
         img: "./img/bird.png",
         audio: "./audio/haha.mp3" 
      },
      Open_Palm: { 
         text: "👋"
      },
      Pointing_Up: { 
         text: "☝️"
      },
      Thumb_Down: { 
         text: "👎"
      },
      Thumb_Up: { 
         text: "👍"
      },
      Victory: { 
         text: "✌️"
      },
      ILoveYou: { 
         text: "🤟"
      }
   };

// =================================================
// 🤚 Right Hand: gesture content
// =================================================
   const gestureContentRight = {
      Closed_Fist: { 
         img: "./img/fish.png"
      }
   };


// =================================================
// ✔️ State: store gesture history
// =================================================
   const gestureState = {
      0: { current: "Unknown", candidate: "Unknown", count: 0 },
      1: { current: "Unknown", candidate: "Unknown", count: 0 }
   };

   const lastPlayed = {}; // last played gesture (for sound)
   const audioCache = {}; // save audio to reuse

   let leftHandPos = null;  // left hand position
   let rightHandPos = null; // right hand position

   const STABILITY = 5;  // how many frames to confirm gesture


// =================================================
// 📸 Webcam setup
// =================================================
   const video = document.querySelector("#video");
   const stream = await navigator.mediaDevices.getUserMedia({video: { facingMode: "user" }});
   video.srcObject = stream;
   await video.play();

// =================================================
// ✔️ Load MediaPipe model
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
// ✔️ Get stable gesture (reduce errors)
// =================================================
   function getStableGesture(i, raw) {
      const s = gestureState[i];

      if (raw === s.candidate) {
         s.count++;
      } else {
         s.candidate = raw;
         s.count = 0;
      }

      if (s.count > STABILITY) {
         s.current = s.candidate;
      }

      return s.current;
   }

// =================================================
// ✔️ Add Contents (text, image, sound)
// =================================================
   function updateUI(div, gesture, handIndex, isLeft) {
      const map = isLeft ? gestureContentLeft : gestureContentRight;
      const content = map[gesture] || {};

      div.innerHTML = ""; // clear

      // =================================================
      // ✔️ show text
      // =================================================
      if (content.text) {
         const t = document.createElement("div");
         t.innerText = content.text;
         div.appendChild(t);
      }

      // =================================================
      // ✔️ show image
      // =================================================
      if (content.img) {
         const img = document.createElement("img");
         img.src = content.img;
         div.appendChild(img);
      }

      // =================================================
      // ✔️ play sound
      // =================================================
      if (gesture !== lastPlayed[handIndex]) {
         lastPlayed[handIndex] = gesture;

         if (content.audio) {
            if (!audioCache[gesture + handIndex]) {
            audioCache[gesture + handIndex] = new Audio(content.audio);
            }
            const sound = audioCache[gesture + handIndex];
            sound.currentTime = 0;
            sound.play();
         }
      }
   }

// =================================================
// ✔️ Main loop
// =================================================
   async function loop() {
   const result = await recognizer.recognize(video);

   leftHandPos = null;
   rightHandPos = null;

   if (result.landmarks) {

      for (let i = 0; i < result.landmarks.length; i++) {

         const lm = result.landmarks[i];

         // =================================================
         // ✅ Map hand position
         // =================================================
            let x = lm[9].x * window.innerWidth;
            let y = lm[9].y * window.innerHeight;

         // =================================================
         // ✔️ Flip horizontally
         // =================================================
            x = window.innerWidth - x;

         // =================================================
         // ✔️ Check left or right hand
         // =================================================
            const handedness = result.handednesses?.[i]?.[0]?.categoryName || "Right";
            const isLeft = handedness === "Left";
            const target = isLeft ? document.querySelector("#left") : document.querySelector("#right");

         // =================================================
         // ✔️ Move UI element
         // =================================================
            target.style.left = x + "px";
            target.style.top = y + "px";

         // =================================================
         // ✔️ Save position
         // =================================================
            if (isLeft) {
               leftHandPos = { x, y };
            } else {
               rightHandPos = { x, y };
            }

         // =================================================
         // ✔️ Get gesture name
         // =================================================
            let raw = "Unknown";
            if (result.gestures?.[i]?.[0]) {
               raw = result.gestures[i][0].categoryName;
            }

         // =================================================
         // ✔️ Stabilize gesture
         // =================================================
            const gesture = getStableGesture(i, raw);

         // =================================================   
         // ✔️ Update UI
         // =================================================
         updateUI(target, gesture, i, isLeft);
      }
   }


  // =================================================
  // 🤲 Distance trigger (hands close → sound + show)
  // =================================================
      const threshold = 150; // ↔️ Distance limit (in pixels) to detect when two hands are close
      let isClose = false;

      if (leftHandPos && rightHandPos) {
         const d = Math.hypot(
            leftHandPos.x - rightHandPos.x,
            leftHandPos.y - rightHandPos.y
         );

         if (d < threshold) {
            // =================================================
            // ✅ Add class/style to #special
            // =================================================
               document.querySelector("#special").classList.add("mainText1");
               document.querySelector("#special").textContent = "Touch!";
            // =================================================
            // 🔔 play sound when first close
            // =================================================
               if (!isClose) {
                  isClose = true;
                  new Audio("./audio/haha.mp3").currentTime = 0;
                  new Audio("./audio/haha.mp3").play();
               }
         } else {
            // =================================================
            // ✅ Remove class/style to #special
            // =================================================
            document.querySelector("#special").classList.remove("mainText1");
            document.querySelector("#special").textContent = "Bring your hands close together!";
            isClose = false;
         }

      } else {
         // =================================================
         // ✅ Remove class/style to #special (No Hand Case)
         // =================================================
            document.querySelector("#special").classList.remove("mainText1");
            document.querySelector("#special").textContent = "Bring your hands close together!";
            isClose = false;
      }

      // =================================================
      // ✔️ Repeat
      // =================================================
      requestAnimationFrame(loop);
   // =================================================
}


// =================================================
// ✔️ Start
// =================================================
loop();