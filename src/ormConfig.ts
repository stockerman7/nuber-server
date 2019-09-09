// 여기서는 entities 파일에서 설정된 typescript schema 들을 데이터베이스와 연결한다.
import { ConnectionOptions } from "typeorm";

// 데이터베이스와 연결을 위한 옵션 설정
const connectionOptions: ConnectionOptions = {
	type: "postgres", // 어떤 데이터베이스 환경인지
	database: "nuber", // 데이터베이스 이름
	synchronize: true,
	logging: true,
	// entities: 컴퓨터 세계에서 정보/의미의 최소 단위를 말한다. "*.*" 한 이유는 .js 나 .ts 가 될 수도 있다.
	entities: ["entities/*.*"],
	host: process.env.DB_ENDPOINT, // 서버 host 주소
	port: 5432, // postgres 기본 포트
	username: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
};

export default connectionOptions;
