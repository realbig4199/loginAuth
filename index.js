// express 앱 생성
const express = require("express");
const app = express();

// jwt 모듈 가져오기 & secretText 설정
const jwt = require("jsonwebtoken");
const secretText = "superSecret";

// 목업 데이터
const posts = [
  {
    username: "John",
    title: "Post 1",
  },
  {
    username: "Han",
    title: "Post 2",
  },
];

// 미들웨어 등록 (req.body 사용을 위한 미들웨어 등록, json 파싱)
app.use(express.json());

app.post("/login", (req, res) => {
  const username = req.body.username;
  // 객체 리터럴을 이용한 할당
  const user = { name: username };
  // jwt를 이용해서 토큰 생성하기 : payload + secretText
  const accessToken = jwt.sign(user, secretText);
  // 토큰을 클라이언트에게 전달
  res.json({ accessToken: accessToken });
});

app.get("/posts", (req, res) => {
  res.json(posts);
});

// express 앱 실행
const port = 4000;
app.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행 중`);
});
