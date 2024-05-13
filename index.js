// express 앱 생성
const express = require("express");
const app = express();

// jwt 모듈 가져오기 & secretText & refreshSecretText 설정
const jwt = require("jsonwebtoken");
const secretText = "superSecret";
const refreshSecretText = "supersuperSecret";

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
let refreshTokens = [];

// 미들웨어 등록 (req.body 사용을 위한 미들웨어 등록, json 파싱)
app.use(express.json());

// 미들웨어 등록 (쿠키 사용을 위한 미들웨어 등록)
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.post("/login", (req, res) => {
  const username = req.body.username;
  // 객체 리터럴을 이용한 할당
  const user = { name: username };
  // jwt를 이용해서 토큰 생성하기 : payload + secretText
  // 유효기간 추가 : expiresIn 속성을 이용해서 유효기간을 설정할 수 있음
  const accessToken = jwt.sign(user, secretText, { expiresIn: "30s" });
  // jwt를 이용해서 refresh 토큰 생성하기 : payload + secretText
  const refreshToken = jwt.sign(user, refreshSecretText, { expiresIn: "1d" });

  // refreshTokens 배열에 refresh 토큰 추가 (DB에 저장하는 것이 일반적)
  refreshTokens.push(refreshToken);
  // refreshToken을 쿠키에 넣어주기, httpOnly 속성을 이용해서 자바스크립트에서 쿠키에 접근하는 것을 방지할 수 있음
  // XSS Cross Site Scripting 공격을 방지하기 위한 방법
  // maxAge 속성을 이용해서 쿠키의 유효기간을 설정할 수 있음
  res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

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

// refresh 토큰을 이용해서 access 토큰 재발급
app.get("/refresh", (req, res) => {
  // 쿠키 가져오기
  const cookies = req.cookies;
  // 쿠키가 없을 경우 : 403 에러
  if (!cookies?.jwt) {
    return res.sendStatus(403);
  }
  // refresh 토큰 가져오기
  const refreshToken = cookies.jwt;
  // db에서 refresh 토큰 확인 (여기서는 refreshTokens 배열에서 확인)
  if (!refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403);
  }
  // 토큰이 유효하다면, access 토큰 재발급
  jwt.verify(refreshToken, refreshSecretText, (err, user) => {
    if (err) return res.sendStatus(403);
    // access 토큰 재발급
    const accessToken = jwt.sign({ name: user.name }, secretText, { expiresIn: "30s" });
    // 클라이언트에게 access 토큰 전달
    res.json({ accessToken });
  });
});

// express 앱 실행
const port = 4000;
app.listen(port, () => {
  console.log(`${port}번 포트에서 서버 실행 중`);
});
