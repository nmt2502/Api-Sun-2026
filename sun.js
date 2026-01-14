/**
 * BINHOI – SUN API (Stable Version)
 * Endpoint: /api/sun/binhoi
 */

const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== FILE LƯU TRẠNG THÁI =====
const STATE_FILE = "state.json";

// ===== BIẾN TOÀN CỤC =====
let cauHistory = "";   // lưu cầu KHÔNG GIỚI HẠN
let lastPhien = null; // tránh cộng trùng phiên

// ===== LOAD STATE KHI START =====
function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(raw);
    cauHistory = state.cauHistory || "";
    lastPhien = state.lastPhien || null;
    console.log("✅ Load state thành công");
  } catch (e) {
    console.log("⚠️ Chưa có state.json, khởi tạo mới");
    cauHistory = "";
    lastPhien = null;
  }
}

// ===== SAVE STATE =====
function saveState() {
  const state = {
    cauHistory,
    lastPhien
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ===== ĐỌC FILE ttoanmoi.txt =====
function readTtoanFile() {
  try {
    return fs
      .readFileSync("ttoanmoi.txt", "utf8")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length === 6);
  } catch (e) {
    console.error("❌ Không đọc được ttoanmoi.txt");
    return [];
  }
}

// ===== CHECK CÓ THUẬT TOÁN TRÙNG KHÔNG =====
function checkCauInFile(cau, lines) {
  if (cau.length < 2) {
    return { co_thuat_toan: false, dong_khop: "", do_dai_khop: 0 };
  }

  const maxLen = Math.min(6, cau.length);

  for (let len = maxLen; len >= 2; len--) {
    const sub = cau.slice(-len);
    for (const line of lines) {
      if (line.startsWith(sub)) {
        return {
          co_thuat_toan: true,
          dong_khop: line,
          do_dai_khop: len
        };
      }
    }
  }

  return { co_thuat_toan: false, dong_khop: "", do_dai_khop: 0 };
}

// ===== DỰ ĐOÁN THEO THUẬT TOÁN =====
function predictFromFile(cau, lines) {
  const maxLen = Math.min(8, cau.length);

  for (let len = maxLen; len >= 2; len--) {
    const sub = cau.slice(-len);
    for (const line of lines) {
      if (line.startsWith(sub) && line.length > sub.length) {
        const nextChar = line[sub.length];
        return {
          du_doan: nextChar === "T" ? "Tài" : "Xỉu",
          do_tin_cay: `${60 + len * 5}%`
        };
      }
    }
  }

  return { du_doan: "", do_tin_cay: "" };
}

// ===== LOAD STATE KHI APP CHẠY =====
loadState();

// ===== API CHÍNH =====
app.get("/api/sun/binhoi", async (req, res) => {
  try {
    // 1️⃣ Lấy API gốc
    const { data } = await axios.get(
      "https://sunwinsaygex-pcl2.onrender.com/api/sun"
    );

    // 2️⃣ Chỉ cập nhật cau khi qua phiên mới
    if (lastPhien !== data.phien) {
      const newCau = data.ket_qua === "Tài" ? "T" : "X";
      cauHistory += newCau;
      lastPhien = data.phien;
      saveState(); // lưu ngay khi qua phiên
    }

    // 3️⃣ Đọc file thuật toán
    const lines = readTtoanFile();

    // 4️⃣ Check thuật toán
    const check = checkCauInFile(cauHistory, lines);

    let du_doan = "";
    let do_tin_cay = "";

    if (check.co_thuat_toan) {
      const predict = predictFromFile(cauHistory, lines);
      du_doan = predict.du_doan;
      do_tin_cay = predict.do_tin_cay;
    }

    // 5️⃣ Trả kết quả
    res.json({
      ID: "BiNhoi8386",
      phien: data.phien,
      xuc_xac_1: data.xuc_xac_1,
      xuc_xac_2: data.xuc_xac_2,
      xuc_xac_3: data.xuc_xac_3,
      tong: data.tong,
      ket_qua: data.ket_qua,
      phien_hien_tai: data.phien + 1,
      cau: cauHistory,
      co_thuat_toan: check.co_thuat_toan,
      dong_thuat_toan: check.dong_khop,
      du_doan,
      do_tin_cay
    });

  } catch (err) {
    res.status(500).json({
      error: "Lỗi xử lý BINHOI SUN API",
      message: err.message
    });
  }
});

// ===== RUN SERVER =====
app.listen(PORT, () => {
  console.log("🚀 BINHOI SUN API running on port " + PORT);
});
