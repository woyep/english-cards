let allWordSets = [];
let words = [];
let currentIndex = 0;
let currentMode = "read";

// BUILD 模式：候选词块与已选择的词块
let buildChunks = [];
let selectedChunks = [];

fetch("words.json")
  .then((res) => res.json())
  .then((data) => {
    allWordSets = data;
    loadWordSet();
  });

function loadWordSet() {
  const level = document.getElementById("level-select").value;
  const category = document.getElementById("category-select").value;

  words = allWordSets.filter((wordObj) => {
    const matchesLevel = level === "all" || wordObj.level === level;

    const matchesCategory = category === "all" || wordObj.category === category;

    return matchesLevel && matchesCategory;
  });

  currentIndex = 0;
  clearFields();

  if (words.length > 0) {
    document.getElementById("image").hidden = false;
    loadImage();
  } else {
    document.getElementById("image").hidden = true;
    document.getElementById("image").removeAttribute("src");
  }
}
document.getElementById("level-select").addEventListener("change", loadWordSet);

document
  .getElementById("category-select")
  .addEventListener("change", loadWordSet);

// 单独加载图片
function loadImage() {
  if (!words.length) return;
  const wordObj = words[currentIndex];
  document.getElementById("image").src = wordObj.image;
  document.getElementById("word-display").innerText = ""; // 不显示单词
}

// 点击 SHOW，加载单词，根据当前模式显示答案
function showText() {
  if (!words.length) return;

  const wordObj = words[currentIndex];

  if (currentMode === "build") {
    const feedback = document.getElementById("build-feedback");
    feedback.textContent = "答案：" + wordObj.word;
    feedback.className = "";
  } else {
    document.getElementById("word-display").innerText = wordObj.word;
  }
}

// 下一词，加载图片，不加载单词
function nextWord() {
  if (!words.length) return;
  currentIndex = (currentIndex + 1) % words.length;
  clearFields();
  loadImage(); // 只加载图片
}

// 上一个词；第一词再往前时，回到最后一词
function previousWord() {
  if (!words.length) return;

  currentIndex = (currentIndex - 1 + words.length) % words.length;
  clearFields();
  loadImage();
}

// 切换 READ、SPELL、BUILD 模式
function setMode(mode) {
  currentMode = mode;

  document.getElementById("read-mode").style.display =
    mode === "read" ? "block" : "none";

  document.getElementById("spell-mode").style.display =
    mode === "spell" ? "block" : "none";

  document.getElementById("build-mode").style.display =
    mode === "build" ? "block" : "none";

  clearFields();
  loadImage();
}

function showWord() {
  if (!words.length) return;
  const wordObj = words[currentIndex];
  document.getElementById("image").src = wordObj.image;
  document.getElementById("input-word").value = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("correct-answer").innerText = "";
}

function checkAnswer() {
  if (!words.length) return;
  const input = document
    .getElementById("input-word")
    .value.trim()
    .toLowerCase();
  const correct = words[currentIndex].word.toLowerCase();
  const feedback = document.getElementById("feedback");
  const answer = document.getElementById("correct-answer");

  if (input === correct) {
    feedback.innerText = "✔ 正确！";
    feedback.className = "correct";
  } else {
    feedback.innerText = "✘ 错误";
    feedback.className = "wrong";
  }

  answer.innerText = "正确拼写：" + correct;
}

// 清空答案和输入，重新准备词块
function clearFields() {
  stopSpeech();
  document.getElementById("word-display").innerText = "";
  document.getElementById("input-word").value = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("correct-answer").innerText = "";

  resetBuild();
}

document.addEventListener("keydown", function (event) {
  if (event.isComposing) return;

  const active = document.activeElement;

  // 下拉菜单保留原生键盘操作
  if (active?.tagName === "SELECT") return;

  // 输入时，左右键用于移动光标；Enter 检查拼写
  if (active?.tagName === "INPUT") {
    if (
      (event.key === "Enter" || event.key === "ArrowDown") &&
      active.id === "input-word"
    ) {
      event.preventDefault();
      checkAnswer();
    }
    return;
  }

  if (active?.tagName === "TEXTAREA" || active?.isContentEditable) {
    return;
  }

  // 不占用浏览器或系统的组合快捷键
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousWord();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    nextWord();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    showText();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();

    if (currentMode === "build") {
      checkBuild();
    } else if (currentMode === "spell") {
      checkAnswer();
    }
  }
});

// 准备当前单词的词块，并打乱顺序
function resetBuild() {
  selectedChunks = [];

  const wordObj = words[currentIndex];
  buildChunks = wordObj ? wordObj.chunks.map((text, id) => ({ text, id })) : [];

  // 随机交换词块的位置
  for (let i = buildChunks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [buildChunks[i], buildChunks[j]] = [buildChunks[j], buildChunks[i]];
  }

  renderBuild();
}

// 显示词块，处理选择与撤回
function renderBuild() {
  const answer = document.getElementById("build-answer");
  const options = document.getElementById("build-options");
  const feedback = document.getElementById("build-feedback");

  answer.replaceChildren();
  options.replaceChildren();
  feedback.textContent = "";
  feedback.className = "";

  // 上方：已选择的词块，点击即可撤回
  selectedChunks.forEach((chunk, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chunk-button";
    button.textContent = chunk.text;

    button.addEventListener("click", () => {
      selectedChunks.splice(index, 1);
      renderBuild();
    });

    answer.appendChild(button);
  });

  // 下方：候选词块，已使用的暂时禁用
  buildChunks.forEach((chunk) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chunk-button";
    button.textContent = chunk.text;
    button.disabled = selectedChunks.some(
      (selected) => selected.id === chunk.id,
    );

    button.addEventListener("click", () => {
      selectedChunks.push(chunk);
      renderBuild();
    });

    options.appendChild(button);
  });
}

// 检查是否用完词块，并拼出了正确内容
function checkBuild() {
  if (!words.length) return;

  const wordObj = words[currentIndex];
  const feedback = document.getElementById("build-feedback");

  if (selectedChunks.length !== buildChunks.length) {
    feedback.textContent = "请先用完所有词块。";
    feedback.className = "";
    return;
  }

  const assembled = selectedChunks.map((chunk) => chunk.text).join("");

  const expected = wordObj.chunks.join("");

  if (assembled === expected) {
    feedback.textContent = "✔ 正确！" + wordObj.word;
    feedback.className = "correct";
  } else {
    feedback.textContent = "✘ 再试一次，点击上方词块可以撤回。";
    feedback.className = "wrong";
  }
}
// 朗读：使用设备提供的美式英语声音
const speechSupported =
  "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let americanVoice = null;
let activeSpeech = null;

function updateVoices() {
  if (!speechSupported) return;

  americanVoice =
    window.speechSynthesis
      .getVoices()
      .find(
        (voice) => voice.lang.replace("_", "-").toLowerCase() === "en-us",
      ) || null;
}

if (speechSupported) {
  updateVoices();
  window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
}

// 停止旧声音，并清空提示
function stopSpeech() {
  activeSpeech = null;

  if (speechSupported) {
    window.speechSynthesis.cancel();
  }

  document.getElementById("speech-feedback").textContent = "";
}

// 点击按钮才朗读，不自动播放
function speakWord() {
  const feedback = document.getElementById("speech-feedback");
  const wordObj = words[currentIndex];

  if (!wordObj) return;

  if (!speechSupported) {
    feedback.textContent = "当前浏览器不支持朗读。";
    return;
  }

  stopSpeech();
  updateVoices();

  if (!americanVoice) {
    feedback.textContent =
      "暂未找到美式英语声音，请稍后重试或检查设备的英语语音设置。";
    return;
  }

  const speech = new SpeechSynthesisUtterance(wordObj.word);
  speech.voice = americanVoice;
  speech.lang = "en-US";
  speech.rate = 0.9;
  activeSpeech = speech;

  speech.onend = () => {
    if (activeSpeech === speech) activeSpeech = null;
  };

  speech.onerror = () => {
    // 主动换词或停止旧声音时，不显示错误
    if (activeSpeech !== speech) return;
    activeSpeech = null;
    feedback.textContent = "朗读失败，请重试，并检查网络和设备声音设置。";
  };

  window.speechSynthesis.speak(speech);
}
