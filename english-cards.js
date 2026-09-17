let allWordSets = [];
let words = [];
let currentIndex = 0;
let currentMode = "read";

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

// 点击 SHOW，加载单词
function showText() {
  if (!words.length) return;
  const wordObj = words[currentIndex];
  document.getElementById("word-display").innerText = wordObj.word;
}

// 下一词，加载图片，不加载单词
function nextWord() {
  if (!words.length) return;
  currentIndex = (currentIndex + 1) % words.length;
  clearFields();
  loadImage(); // 只加载图片
}

// 切换模式（拼写模式）
function setMode(mode) {
  currentMode = mode;
  document.getElementById("read-mode").style.display =
    mode === "read" ? "block" : "none";
  document.getElementById("spell-mode").style.display =
    mode === "spell" ? "block" : "none";
  if (mode === "read") {
    loadImage();
  } else {
    showWord(); // 拼写模式继续用原来的逻辑
  }
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

// 清空
function clearFields() {
  document.getElementById("word-display").innerText = "";
  document.getElementById("input-word").value = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("correct-answer").innerText = "";
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
