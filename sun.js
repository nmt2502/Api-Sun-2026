const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const STATE_FILE = "./state.json";
const ALGO_FILE = "./ttoanmoi.txt";

/* =======================
   UTILS
======================= */
function getVNDate() {
  const d = new Date();
  d.setHours(d.getHours() + 7);
  return d.toISOString().slice(0, 10);
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      lastPhien: null,
      cau: "",
      date: getVNDate()
    };
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
    const today = getVNDate();

    // ✅ reset cau đúng 0h VN
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

    // =========================
    // CẬP NHẬT CAU (KHÔNG TỤT)
    // =========================
    if (state.lastPhien === null) {
      // chỉ set mốc, KHÔNG thêm cau
      state.lastPhien = data.phien;
      saveState(state);
    } else if (data.phien > state.lastPhien) {
      const kyTu = data.ket_qua === "Tài" ? "T" : "X";
      state.cau += kyTu;

      // giới hạn 30 ký tự
      if (state.cau.length > 30) {
        state.cau = state.cau.slice(-30);
      }

      state.lastPhien = data.phien;
      saveState(state);
    }

    // =========================
    // ĐỌC THUẬT TOÁN (6 KÝ TỰ)
    // =========================
    const algorithms = fs
      .readFileSync(ALGO_FILE, "utf8")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length === 6);

    let co_thuat_toan = false;
    let dong_thuat_toan = "";
    let du_doan = "";
    let do_tin_cay = "";

    // =========================
    // SO KHỚP CAU
    // =========================
    for (const line of algorithms) {
      if (state.cau.length >= line.length) continue;

      if (line.startsWith(state.cau)) {
        co_thuat_toan = true;
        dong_thuat_toan = line;

        const nextChar = line[state.cau.length];
        if (nextChar) {
          du_doan = nextChar === "T" ? "Tài" : "Xỉu";
          do_tin_cay = "80%";
        }
        break;
      }
    }

    res.json({
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
  console.log("BINHOI API running on port " + PORT);
});
