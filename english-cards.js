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
  document.getElementById("word-display").innerText = "";
  document.getElementById("input-word").value = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("correct-answer").innerText = "";

  resetBuild();
}

document.addEventListener("keydown", function (event) {
  if (document.activeElement?.tagName === "SELECT") return;
  // 按下 ArrowDown 键触发 Next
  if (event.key === "ArrowDown") {
    nextWord(); // 切换到下一个单词
  }
  // 按下 ArrowUp 键触发 Show
  else if (event.key === "ArrowUp") {
    showText(); // 显示当前单词
  }
  // 按下 Enter 键触发 Check
  else if (event.key === "Enter") {
    // 如果焦点在输入框中，触发拼写检查
    if (document.activeElement === document.getElementById("input-word")) {
      checkAnswer(); // 检查拼写
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
