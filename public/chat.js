document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const processorButton = document.getElementById("processorButton");
  const responseText = document.getElementById("responseText");

  let latestTTSUrl = "";
  let processorState = false;

  const originalImages = {
    internalExchange: "public/img/originalDatabase.png",
    externalExchange: "public/img/originalDatabase.png",
    lineExchange1: "public/img/originalLine1.png",
    lineExchange2: "public/img/originalLine2.png",
    lineExchange3: "public/img/originalLine3.png",
  };

  const newImages = {
    internalExchange: "public/img/emphasisDatabase.png",
    externalExchange: "public/img/emphasisDatabase.png",
    lineExchange1: "public/img/emphasisLine1.png",
    lineExchange2: "public/img/emphasisLine2.png",
    lineExchange3: "public/img/emphasisLine3.png",
  };

  const moduleImages = {
    internalExchange: "public/img/emphasisDatabase.png",
    externalExchange: "public/img/emphasisDatabase.png",
    lineExchange1: "public/img/emphasisLine1.png",
    lineExchange2: "public/img/emphasisLine2.png",
    lineExchange3: "public/img/emphasisLine3.png",
    manualExchange: "public/img/emphasisDatabase.png",
    domainExchange: "public/img/emphasisDatabase.png",
    lineExchange4: "public/img/lineExchange4.png",
    lineExchange5: "public/img/lineExchange5.png",
  };

  const currentImages = { ...originalImages };

  processorButton.addEventListener("click", function () {
    processorState = !processorState;

    for (const [id, newSrc] of Object.entries(newImages)) {
      const imgElement = document.getElementById(id);
      if (imgElement) {
        imgElement.src = processorState ? newSrc : originalImages[id];
        currentImages[id] = processorState ? newSrc : originalImages[id];
      }
    }

    processorButton.classList.toggle("thick-border", processorState);

    let elements = document.querySelectorAll(".processorVisible");
    elements.forEach((element) =>
      element.classList.toggle("hidden", processorState)
    );

    // Clear the response text area only if processorState is false
    if (!processorState) {
      responseText.value = "";
    }

    // Change playButton functionality
    if (processorState) {
      playButton.innerText = "Copy Text";
      playButton.removeEventListener("click", playAudio);
      playButton.addEventListener("click", copyText);
    } else {
      playButton.innerText = "Play TTS";
      playButton.removeEventListener("click", copyText);
      playButton.addEventListener("click", playAudio);
    }
  });

  moduleButton.addEventListener("click", function () {
    processorState = false;

    // moduleImages를 사용하여 이미지를 변경
    for (const [id, moduleSrc] of Object.entries(moduleImages)) {
      const imgElement = document.getElementById(id);
      if (imgElement) {
        imgElement.src = moduleSrc;
        currentImages[id] = moduleSrc;
      }
    }

    processorButton.classList.remove("thick-border");

    let elements = document.querySelectorAll(".processorVisible");
    elements.forEach((element) => element.classList.remove("hidden"));

    responseText.value = "";

    playButton.innerText = "Play";
    playButton.removeEventListener("click", copyText);
    playButton.addEventListener("click", playAudio);
  });

  document.getElementById("textForm").onsubmit = function (event) {
    event.preventDefault();
    const textInput1 = document.getElementById("textInput1").value;
    const textInput2 = document.getElementById("textInput2").value;
    const textInput3 = document.getElementById("textInput3").value;

    if (processorState && textInput1 && textInput3 && !textInput2) {
      try {
        const jsonObject1 = JSON.parse(textInput1);
        const jsonObject3 = JSON.parse(textInput3);

        const result1 = convertObjectToString(jsonObject1);
        const result3 = convertObjectToString(jsonObject3);

        const randomResult1 = getPriorityPairs(result1);
        const randomResult3 = getPriorityPairs(result3);

        responseText.value = `${randomResult1}/${randomResult3}`;
      } catch (e) {
        responseText.value = "Invalid JSON input.";
      }
    } else if (textInput1 && textInput2 && textInput3) {
      const text = textInput1 + " " + textInput2 + " " + textInput3;
      socket.emit("sendText", { text: text });
    }

    document.getElementById("textInput1").value = "";
    document.getElementById("textInput2").value = "";
    document.getElementById("textInput3").value = "";
  };

  socket.on("responseText", (data) => {
    document.getElementById("responseText").value = data.responseText;
    latestTTSUrl = data.ttsUrl; // Store the TTS URL
  });

  socket.on("conversionResult", (data) => {
    const { result1, result3 } = data;
    responseText.value = `${result1}/${result3}`;
  });

  socket.on("conversionError", (message) => {
    document.getElementById("responseText").value = message;
  });

  document.getElementById("playButton").addEventListener("click", () => {
    if (latestTTSUrl) {
      const audioContainer = document.getElementById("audioContainer");
      const audioElement = document.createElement("audio");
      audioElement.src = latestTTSUrl;
      audioElement.classList.add("hidden-audio"); // 오디오 요소를 숨김
      audioElement.play();
      audioContainer.appendChild(audioElement);
    } else {
    }
  });

  function playAudio() {
    if (latestTTSUrl) {
      const audioContainer = document.getElementById("audioContainer");
      const audioElement = document.createElement("audio");
      audioElement.src = latestTTSUrl;
      audioElement.classList.add("hidden-audio"); // 오디오 요소를 숨김
      audioElement.play();
      audioContainer.appendChild(audioElement);
    } else {
    }
  }

  function copyText() {
    if (responseText.value) {
      navigator.clipboard
        .writeText(responseText.value)
        .then(() => {
          alert("텍스트가 복사되었습니다.");
        })
        .catch((err) => {
          alert("텍스트 복사에 실패했습니다.");
        });
    } else {
      alert("복사할 텍스트가 없습니다.");
    }
  }

  playButton.addEventListener("click", playAudio);

  // 객체를 문자열로 변환하는 함수
  function convertObjectToString(jsonObject) {
    const convert = (obj) => {
      return Object.entries(obj)
        .map(([key, value]) => {
          if (
            typeof value === "object" &&
            !Array.isArray(value) &&
            value !== null
          ) {
            return convert(value);
          } else {
            return `(${key}:${value})`;
          }
        })
        .join("/");
    };
    return convert(jsonObject);
  }

  function getPriorityPairs(str, count = 5 ) {
    const pairs = str.split("/");
    const priorityMap = new Map();
    const zeroPriorityPairs = [];

    pairs.forEach((pair) => {
      const key = pair.split(":")[0];
      const priority = parseInt(key.split("_").pop());

      // '_0'이 달려 있는 쌍은 무조건 포함
      if (priority === 0) {
        zeroPriorityPairs.push(pair);
        return;
      }

      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, []);
      }
      priorityMap.get(priority).push(pair);
    });

    const sortedPriorities = Array.from(priorityMap.keys()).sort(
      (a, b) => a - b
    );
    const resultPairs = [];

    // '_0'이 달려 있는 쌍을 먼저 추가
    resultPairs.push(...zeroPriorityPairs);

    for (const priority of sortedPriorities) {
      if (resultPairs.length >= count) break;
      resultPairs.push(...priorityMap.get(priority));
    }

    return resultPairs.slice(0, count).join("/");
  }


  // Persona 설정 관련 코드
  const personaSettingButton = document.getElementById("personaSettingButton");
  const personaModal = document.getElementById("personaModal");
  const closeModal = document.getElementById("closeModal");
  const personaSubmit = document.getElementById("personaSubmit");
  const personaInput = document.getElementById("personaInput");

  personaSettingButton.addEventListener("click", () => {
    personaModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    personaModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === personaModal) {
      personaModal.style.display = "none";
    }
  });

  personaSubmit.addEventListener("click", () => {
    const text = personaInput.value;
    socket.emit("sendPersona", { text: text });
    personaModal.style.display = "none";
  });

  // Additional Persona Input Form
  document
    .getElementById("personaInputForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const personaText = document.getElementById("personaTextInput").value;
      socket.emit("sendPersona", { text: personaText });
      document.getElementById("personaModal").style.display = "none";
      document.getElementById("personaTextInput").value = "";
    });
});
