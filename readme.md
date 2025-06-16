# OOTW – Outfit of the Weather

> **Demo**: [https://ootw.xivnick.me](https://ootw.xivnick.me)
> **KakaoTalk 채널**: [https://pf.kakao.com/\_Zyxhrn](https://pf.kakao.com/_Zyxhrn)

OOTW는 **기상청 단기예보** 데이터를 바탕으로 의상 추천을 제공하는 데모 웹페이지이자, 카카오톡 채널용 백엔드 API 서버다.

| 항목         | 내용                                           |
| ---------- | -------------------------------------------- |
| **프로젝트 명** | **OOTW, Outfit of the Weather**              |
| **작성자**    | 2017147568 김민재                               |
| **주요 기술**  | Node.js · Express · MySQL · Vue 3 · Chart.js |

---

## 목차

1. [기능](#기능)
2. [기술 스택](#기술-스택)
3. [빠른 시작](#빠른-시작)
4. [환경 변수](#환경-변수)
5. [데이터베이스 스키마](#데이터베이스-스키마)
6. [Region 데이터 삽입](#region-데이터-삽입)
7. [실행 명령어](#실행-명령어)
8. [라이선스](#라이선스)

---

## 기능

* **날씨 기반 의상 추천** : 지역별 단기예보를 활용해 최적의 옷차림 제안
* **KakaoTalk 챗봇 연동** : 위치 등록·변경, 사진 업로드(OOTD) 지원
* **데모 웹페이지** : Vue 3 + Chart.js로 시각화된 날씨·의상 정보 제공

---

## 기술 스택

| Layer        | Stack                    |
| ------------ | ------------------------ |
| **Backend**  | Node.js, Express, MySQL  |
| **Frontend** | Vue 3, Vite, Chart.js    |
| **Infra/배포** | **Vultr Cloud VPS**, Nginx, systemd |

---

## 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/your-org/ootw.git
cd ootw

# 의존성 설치
npm install  # 또는 pnpm install / yarn

# .env 파일 작성 (아래 예시 참고)
cp .env.example .env

# 개발 서버 실행
npm run dev  # nodemon + vite
```

---

## 환경 변수

`.env` 예시 :

```dotenv
PORT=3000
SERVICE_KEY=YOUR_KMA_SHORT_FORECAST_API_KEY

DB_HOST=localhost
DB_USER=ootw_user
DB_PASSWORD=secret
DB_DATABASE=ootw_db
```

* `PORT` 값을 비워두면 `3000` 이 기본값으로 사용된다.
* `SERVICE_KEY`는 **기상청 단기예보 API**를 사용할 수 있는 인증키가 필요하다.
* 나머지 값은 MySQL 서버 접속 정보다.

---

## 데이터베이스 스키마

```sql
-- TABLE: region
CREATE TABLE `region` (
  `code` varchar(20) NOT NULL,
  `level1` varchar(50) NOT NULL,
  `level2` varchar(50) DEFAULT NULL,
  `level3` varchar(50) DEFAULT NULL,
  `nx` int NOT NULL,
  `ny` int NOT NULL,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- TABLE: user
CREATE TABLE `user` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(100) NOT NULL,
  `region` varchar(255) NOT NULL DEFAULT '서울특별시',
  `nx` int NOT NULL DEFAULT 60,
  `ny` int NOT NULL DEFAULT 127,
  `status` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- TABLE: user_log
CREATE TABLE `user_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(100) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- TABLE: user_ootd
CREATE TABLE `user_ootd` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(100) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `date` varchar(100) DEFAULT NULL,
  `date_display` varchar(100) DEFAULT NULL,
  `temp_max` int DEFAULT NULL,
  `temp_min` int DEFAULT NULL,
  `icon` varchar(20) DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- TABLE: user_region_history
CREATE TABLE `user_region_history` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` varchar(100) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

---

## Region 데이터 삽입

이미 가공된 `region.sql` 덤프 파일이 저장소에 포함돼 있다. 아래 한 줄로 `region` 테이블 데이터를 불러올 수 있다.

```bash
mysql -u <user> -p <DB_NAME> < path/to/region.sql
```

> 혹은 Sequal Ace 등의 프로그램을 통하여 region.sql을 직접 실행해도 된다.

---

## 실행 명령어

| 단계     | 명령              | 설명                             |
| ------ | --------------- | ------------------------------ |
| **설치** | `npm install`   | npm 의존성 설치                  |
| **개발** | `npm run dev`   | nodemon + vite 동시 실행           |
| **배포** | `npm start`     | 로컬 PM2 또는 systemd `ExecStart`용 |

