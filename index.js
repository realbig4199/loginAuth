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

app.get("/posts", authMiddleware, (req, res) => {
  res.json(posts);
});

function authMiddleware(req, res, next) {
  // request 헤더에서 토큰 가져오기
  const authHeader = req.headers["authorization"];
  // 토큰 파싱 : && 연산자를 이용한 null 체크, 이것을 해주지 않으면 split 함수에서 오류가 발생할 수 있음
  const token = authHeader && authHeader.split(" ")[1];
  // 토큰이 없을 경우 : 401 에러(클라이언트에서 잘못된 요청을 보냈을 경우 사용하는 에러 코드)
  if (token == null) return res.sendStatus(401);

  // 토큰 검증
  jwt.verify(token, secretText, (err, user) => {
    // 토큰이 유효하지 않을 경우 : 403 에러(서버에서 요청을 거부했을 경우 사용하는 에러 코드)
    if (err) return res.sendStatus(403);
    req.user = user;
    // 다음 미들웨어로 이동
    next();
  });
}

// express 앱 실행
const port = 4000;
app.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행 중`);
});
