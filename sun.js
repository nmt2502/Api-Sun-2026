const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const STATE_FILE = "./state.json";
const ALGO_FILE = "./ttoanmoi.txt";

/* =======================
   LOAD / SAVE STATE
======================= */
function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return { lastPhien: null, cau: "", date: "" };
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/* =======================
   API BINHOI
======================= */
app.get("/api/sun/binhoi", async (req, res) => {
  try {
    const state = loadState();

    // Ngày hiện tại (YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);

    // ✅ Reset cau nếu qua ngày mới
    if (state.date !== today) {
      state.cau = "";
      state.lastPhien = null;
      state.date = today;
      saveState(state);
    }

    // Lấy API gốc
    const { data } = await axios.get(
      "https://sunwinsaygex-pcl2.onrender.com/api/sun"
    );

    // Chỉ thêm cau khi sang phiên mới
    if (state.lastPhien !== data.phien) {
      const kyTu = data.ket_qua === "Tài" ? "T" : "X";
      state.cau += kyTu;
      state.lastPhien = data.phien;
      saveState(state);
    }

    // Đọc thuật toán
    const algorithms = fs
      .readFileSync(ALGO_FILE, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    let co_thuat_toan = false;
    let dong_thuat_toan = "";
    let du_doan = "";
    let do_tin_cay = "";

    // So khớp cau với thuật toán
    for (const line of algorithms) {
      if (state.cau.endsWith(line)) {
        co_thuat_toan = true;
        dong_thuat_toan = line;

        const lastChar = line[line.length - 1];
        du_doan = lastChar === "T" ? "Xỉu" : "Tài";
        do_tin_cay = "88%";
        break;
      }
    }

    res.json({
      ID: "BiNhoi8386",
      phien: data.phien,
      xuc_xac_1: data.xuc_xac_1,
      xuc_xac_2: data.xuc_xac_2,
      xuc_xac_3: data.xuc_xac_3,
      tong: data.tong,
      ket_qua: data.ket_qua,
      phien_hien_tai: data.phien + 1,
      cau: state.cau,
      co_thuat_toan,
      dong_thuat_toan,
      du_doan,
      do_tin_cay
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log("BINHOI API running");
});
