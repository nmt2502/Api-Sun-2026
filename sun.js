const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = 3000;

function getPredictionFromFile(cau, fileChain) {
  const maxLen = Math.min(cau.length, fileChain.length - 1);

  for (let len = maxLen; len >= 3; len--) {
    const pattern = cau.slice(-len);
    const index = fileChain.indexOf(pattern);

    if (index !== -1 && fileChain[index + len]) {
      const nextChar = fileChain[index + len];
      return {
        du_doan: nextChar === "T" ? "Tài" : "Xỉu",
        do_tin_cay: `${60 + len * 5}%`,
        khop: pattern
      };
    }
  }

  return null;
}

app.get("/api/new-sun", async (req, res) => {
  try {
    // 1. Lấy API gốc
    const { data } = await axios.get(
      "https://sunwinsaygex-pcl2.onrender.com/api/sun"
    );

    // 2. Tạo cau
    const cau = data.ket_qua === "Tài" ? "T" : "TX";

    // 3. Đọc file
    const fileChain = fs.readFileSync("ttoanmoi.txt", "utf8").trim();

    // 4. So sánh
    const predict = getPredictionFromFile(cau, fileChain);

    res.json({
      ID: "BiNhoi8386",
      phien: data.phien,
      xuc_xac_1: data.xuc_xac_1,
      xuc_xac_2: data.xuc_xac_2,
      xuc_xac_3: data.xuc_xac_3,
      tong: data.tong,
      ket_qua: data.ket_qua,
      phien_hien_tai: data.phien + 1,
      cau: cau,
      du_doan: predict ? predict.du_doan : "",
      do_tin_cay: predict ? predict.do_tin_cay : ""
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi xử lý API" });
  }
});

app.listen(PORT, () => {
  console.log(`API chạy tại http://localhost:${PORT}/api/new-sun`);
});
