const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== THUẬT TOÁN SO KHỚP FILE =====
function getPredictionFromFile(cau, fileChain) {
  const maxLen = Math.min(cau.length, fileChain.length - 1);

  for (let len = maxLen; len >= 3; len--) {
    const pattern = cau.slice(-len);
    const index = fileChain.indexOf(pattern);

    if (index !== -1 && fileChain[index + len]) {
      const nextChar = fileChain[index + len];
      return {
        du_doan: nextChar === "T" ? "Tài" : "Xỉu",
        do_tin_cay: `${60 + len * 5}%`
      };
    }
  }
  return { du_doan: "", do_tin_cay: "" };
}

app.get("/api/new-sun", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://sunwinsaygex-pcl2.onrender.com/api/sun"
    );

    // Tạo cau (ở đây bạn có thể nối chuỗi cau thực tế)
    const cau = data.ket_qua === "Tài" ? "T" : "TX";

    const fileChain = fs.readFileSync("ttoanmoi.txt", "utf8").trim();
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
      du_doan: predict.du_doan,
      do_tin_cay: predict.do_tin_cay
    });
  } catch (e) {
    res.status(500).json({ error: "Lỗi lấy API gốc" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
